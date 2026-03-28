from deepgram import DeepgramClient
import os, json, logging
from dotenv import load_dotenv
load_dotenv()
logging.basicConfig(level=logging.INFO)
dg_client = DeepgramClient(api_key=os.getenv('DEEPGRAM_API_KEY'))
with open('silent.wav', 'rb') as f: content = f.read()
payload = {'buffer': content}
options = {'model': 'nova-2', 'language': 'hi', 'smart_format': True}
try:
    print('Attempting transcription...')
    # Try the path from my search: client.listen.v1.rest.transcribe_file
    # Wait, my test script said NO 'rest'. Let's try dg_client.listen.v('1').transcribe_file
    response = dg_client.listen.v('1').transcribe_file(payload, options)
    print('Success:', response.to_dict())
except Exception as e:
    print('Path v(1) failed:', str(e))
    try:
        print('Attempting alternate path: listen.prerecorded.v(1)...')
        # Many v6 versions use prerecorded.v('1')
        response = dg_client.listen.prerecorded.v('1').transcribe_file(payload, options)
        print('Success prerecorded:', response.to_dict())
    except Exception as e2:
        print('Path prerecorded failed:', str(e2))
        print('Available listen members:', dir(dg_client.listen))
