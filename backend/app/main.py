from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ingest import router as ingest_router

app = FastAPI(title='VoiceTrace API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(ingest_router, prefix='/api', tags=['ingest'])

@app.get('/')
def read_root(): return {'message': 'VoiceTrace API'}
