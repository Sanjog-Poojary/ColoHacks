from fastapi import APIRouter, HTTPException, UploadFile, File
from deepgram import DeepgramClient
from groq import Groq
import os, json
from dotenv import load_dotenv
load_dotenv()
router = APIRouter()
dg_client = DeepgramClient(api_key=os.getenv('DEEPGRAM_API_KEY'))
groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
@router.post('/ingest')
async def ingest_audio(file: UploadFile = File(...)):
    try:
        content = await file.read()
        # SDK v6: Options are passed as a dictionary
        payload = {'buffer': content}
        options = {
            'model': 'nova-2',
            'language': 'hi',
            'detect_language': True,
            'smart_format': True
        }
        # SDK v6 call structure
        response = dg_client.listen.rest.v('1').transcribe_file(payload, options)
        transcript = response.results.channels[0].alternatives[0].transcript
        prompt = f'''You are a business data extractor for Indian street vendors. Extract items_sold, expenses, earnings, and flags as JSON.'''
        completion = groq_client.chat.completions.create(model='llama3-70b-8192', messages=[{'role': 'user', 'content': prompt + transcript}], response_format={'type': 'json_object'})
        return {'transcript': transcript, 'ledger_entry': json.loads(completion.choices[0].message.content)}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))