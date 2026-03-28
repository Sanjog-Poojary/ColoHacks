from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Header
from deepgram import DeepgramClient
from groq import Groq
from app.lib.firebase_admin import db
from app.lib.auth_middleware import get_current_user
import os, json, logging, traceback, datetime
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
dg_client = DeepgramClient(api_key=os.getenv('DEEPGRAM_API_KEY'))
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))


@router.post('/ingest')
async def ingest_audio(
    file: UploadFile = File(...), 
    user: dict = Depends(get_current_user), 
    x_shop_id: str = Header(...)
):
    """
    Primary ingestion endpoint for audio business records.
    
    1. **Transcription**: Uses Deepgram Nova-3 (Hinglish model) to get raw text.
    2. **Ghost Prevention (Tier 1)**: Aborts if the transcript is empty or silent.
    3. **Extraction**: Uses Groq (Llama 3.3 70B) to parse the narration into items, expenses, and totals.
    4. **Ghost Prevention (Tier 2)**: Aborts if the LLM finds no business data (JSON is empty).
    5. **Persistence**: Saves the full record (transcript + structured data) to Firestore under the shop context.
    
    Returns: The extracted ledger entry with a unique ID.
    """
    try:
        uid = user['uid']
        logger.info(f'Processing {file.filename} for shop {x_shop_id}')
        content = await file.read()

        # Deepgram SDK v6: keyword-only args
        response = dg_client.listen.v1.media.transcribe_file(
            request=content,
            model="nova-3",
            language="hi",
            smart_format=True,
        )

        transcript = ''
        if hasattr(response, 'results') and response.results.channels[0].alternatives:
            transcript = response.results.channels[0].alternatives[0].transcript
        logger.info(f'Transcript: {transcript}')
        
        # --- PREVENT GHOST TRANSACTIONS (Tier 1: Silence) ---
        if not transcript or not transcript.strip():
            logger.warning("Empty transcript detected. Aborting save.")
            raise HTTPException(status_code=400, detail="Silence detected. Please try recording again with clear speech.")

        prompt = (
            'You are a business data extractor for Indian street vendors. '
            'Given the following transcript, extract structured JSON with: '
            '"items_sold" (array of {name, qty, price}), '
            '"expenses" (array of {label, amount}), '
            '"earnings" (number, total), '
            '"flags" (array of {field, reason} for uncertain data). '
            'Respond ONLY with valid JSON. Transcript: '
        )

        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt + transcript}],
            response_format={'type': 'json_object'},
        )
        ledger_entry = json.loads(completion.choices[0].message.content)

        # --- PREVENT GHOST TRANSACTIONS (Tier 2: Empty Extraction) ---
        has_items = len(ledger_entry.get('items_sold', [])) > 0
        has_expenses = len(ledger_entry.get('expenses', [])) > 0
        has_earnings = ledger_entry.get('earnings', 0) > 0
        
        if not (has_items or has_expenses or has_earnings):
            logger.warning("Meaningless transcript detected (no items/money found). Aborting save.")
            raise HTTPException(status_code=400, detail="No business data (sales or expenses) found in your recording. Please try again.")

        # Save to Firestore
        entry_data = {
            'transcript': transcript,
            'ledger_entry': ledger_entry,
            'createdAt': datetime.datetime.now().isoformat(),
            'filename': file.filename,
            'status': 'active',
            'shop_id': x_shop_id,
            'uid': uid
        }
        doc_ref_tuple = db.collection('ledger').add(entry_data)
        entry_id = doc_ref_tuple[1].id
        logger.info(f'Ledger entry saved: {entry_id}')

        return {'id': entry_id, 'transcript': transcript, 'ledger_entry': ledger_entry}

    except Exception as e:
        err_msg = traceback.format_exc()
        logger.error(f'Ingest crash:\n{err_msg}')
        raise HTTPException(status_code=500, detail=str(e))
