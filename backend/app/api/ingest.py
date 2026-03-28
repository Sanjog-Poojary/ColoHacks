from fastapi import APIRouter, HTTPException, UploadFile, File
from deepgram import DeepgramClient
from groq import Groq
import os, json, logging, traceback
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

        # Deepgram SDK v6: transcribe_file uses keyword-only args
        response = dg_client.listen.v1.media.transcribe_file(
            request=content,
            model="nova-3",
            language="hi",
            smart_format=True,
        )

        transcript = response.results.channels[0].alternatives[0].transcript
        logger.info(f'Transcript: {transcript}')

        prompt = (
            'You are a business data extractor for Indian street vendors. '
            'Given the following transcript of a vendor narrating their day, '
            'extract structured JSON with these keys: '
            '"items_sold" (array of {name, qty, price}), '
            '"expenses" (array of {label, amount}), '
            '"earnings" (number, total earnings), '
            '"flags" (array of {field, reason} for uncertain data). '
            'Respond ONLY with valid JSON. Transcript: '
        )

        completion = groq_client.chat.completions.create(
            model='llama-3.3-70b-versatile',
            messages=[{'role': 'user', 'content': prompt + transcript}],
            response_format={'type': 'json_object'},
        )

        result = json.loads(completion.choices[0].message.content)
        return {'transcript': transcript, 'ledger_entry': result}

    except Exception as e:
        err_msg = traceback.format_exc()
        logger.error(f'Ingest crash:\n{err_msg}')
        raise HTTPException(status_code=500, detail=str(e))
