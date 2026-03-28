import requests
import json
import base64

# Create a dummy tiny valid webm or wav file so Deepgram doesn't fail immediately on "not a file"
# Actually a tiny wav:
dummy_wav = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
with open('test.wav', 'wb') as f:
    f.write(dummy_wav)

url = 'http://127.0.0.1:8000/api/ingest'
headers = {
    'Authorization': 'Bearer test-token', # Just bypass auth if disabled or use mock
    'x-shop-id': 'a-4af7-b2be-dcca8b9706fc'
}
files = {'file': ('test.wav', open('test.wav', 'rb'), 'audio/wav')}
response = requests.post(url, headers=headers, files=files)
print(response.status_code)
try:
    print(response.json())
except:
    print(response.text)
