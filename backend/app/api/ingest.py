from fastapi import APIRouter, HTTPException, UploadFile, File
from deepgram import DeepgramClient
from groq import Groq
from app.lib.firebase_admin import db
import os, json, logging, traceback, datetime
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
dg_client = DeepgramClient(api_key=os.getenv('DEEPGRAM_API_KEY'))
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))


@router.post('/ingest')
async def ingest_audio(file: UploadFile = File(...)):
    try:
        logger.info(f'Processing {file.filename} ({file.content_type})')
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

        # Save to Firestore
        entry_data = {
            'transcript': transcript,
            'ledger_entry': ledger_entry,
            'createdAt': datetime.datetime.now().isoformat(),
            'filename': file.filename,
            'status': 'active',
        }
        doc_ref = db.collection('ledger').add(entry_data)
        entry_id = doc_ref[1].id
        logger.info(f'Ledger entry saved: {entry_id}')

        return {'id': entry_id, 'transcript': transcript, 'ledger_entry': ledger_entry}

    except Exception as e:
        err_msg = traceback.format_exc()
        logger.error(f'Ingest crash:\n{err_msg}')
        raise HTTPException(status_code=500, detail=str(e))
