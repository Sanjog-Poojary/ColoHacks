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


SYSTEM_PROMPT = """
You are a business ledger assistant for Indian street vendors and micro-entrepreneurs.

You extract structured financial data from voice transcripts in Hindi, English, or Hinglish.

You are given the vendor's business profile at the start of every request.
You must use this profile to validate every item and expense you extract.

Your job has two layers:
1. Extract what the vendor said.
2. Cross-check each extracted entity against their business context.

Validation rules:
- If an item sold does not belong to the vendor's business type, mark it as ANOMALOUS. (e.g., Selling "Laptop" in a "Fruit Shop")
- If an expense is plausible for their business (raw materials, transport, packaging, rent, labour), accept it.
- If an expense seems completely unrelated to their business type, flag it for confirmation.
- Never silently drop data. Anomalous data is still recorded — just tagged differently.
- Do not hallucinate items or numbers. If something was not mentioned, do not add it.
- CRITICAL: You MUST do all math calculations yourself and output ONLY the final computed float/integer. Never output mathematical expressions like `20 * 40` inside JSON values.

Always respond with valid JSON only. No explanation. No markdown fences.
Expected JSON:
{
  "items_sold": [{"name": string, "qty": number, "price": number, "is_anomalous": boolean}],
  "expenses": [{"label": string, "amount": number, "is_anomalous": boolean}],
  "earnings": number,
  "flags": [{"field": string, "reason": string}]
}
"""


@router.post('/ingest')
async def ingest_audio(
    file: UploadFile = File(...), 
    user: dict = Depends(get_current_user), 
    x_shop_id: str = Header(...)
):
    """
    Primary ingestion endpoint for audio business records.
    
    1. **Context Fetching**: Retrieves the shop's business profile from Firestore.
    2. **Transcription**: Uses Deepgram Nova-3 (Hinglish model) to get raw text.
    3. **Ghost Prevention (Tier 1)**: Aborts if the transcript is empty or silent.
    4. **Extraction**: Uses Groq (Llama 3.3 70B) with the new Context-Aware System Prompt.
    5. **Ghost Prevention (Tier 2)**: Aborts if the LLM finds no business data (JSON is empty).
    6. **Persistence**: Saves the full record (transcript + structured data) to Firestore.
    
    Returns: The extracted ledger entry with a unique ID.
    """
    try:
        uid = user['uid']
        logger.info(f'Processing {file.filename} for shop {x_shop_id}')
        
        # 1. Fetch Shop Metadata for Context
        shop_ref = db.collection('shops').document(x_shop_id)
        shop_doc = shop_ref.get()
        if not shop_doc.exists:
            profile_context = "Unknown Business"
        else:
            s_data = shop_doc.to_dict()
            profile_context = f"Business Name: {s_data.get('name')}, Location: {s_data.get('city')}, Business Type: {s_data.get('business_type')}"

        content = await file.read()

        # 2. Transcription
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
        
        # 3. ghost prevention (Tier 1)
        if not transcript or not transcript.strip():
            logger.warning("Empty transcript detected. Aborting save.")
            raise HTTPException(status_code=400, detail="Silence detected. Please try recording again with clear speech.")

        # 4. Extraction with Context-Aware Prompt
        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': f"Vendor Profile: {profile_context}\nNarration: {transcript}"}
            ],
            response_format={'type': 'json_object'},
        )
        ledger_entry = json.loads(completion.choices[0].message.content)

        # 5. ghost prevention (Tier 2)
        has_items = len(ledger_entry.get('items_sold', [])) > 0
        has_expenses = len(ledger_entry.get('expenses', [])) > 0
        has_earnings = ledger_entry.get('earnings', 0) > 0
        
        if not (has_items or has_expenses or has_earnings):
            logger.warning("Meaningless transcript detected. Aborting save.")
            raise HTTPException(status_code=400, detail="No business data found. Please try again.")

        # 6. Persistence
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
        with open('crash.txt', 'w') as f:
            f.write(err_msg)
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail=str(e))
