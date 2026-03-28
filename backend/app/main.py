from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.ingest import router as ingest_router
from app.api.history import router as history_router
from app.api.insights import router as insights_router
from app.api.profile import router as profile_router

app = FastAPI(title='VyapaarVaani API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(ingest_router, prefix='/api', tags=['ingest'])
app.include_router(history_router, prefix='/api', tags=['history'])
app.include_router(insights_router, prefix='/api', tags=['insights'])
app.include_router(profile_router, prefix='/api', tags=['profile'])

@app.get('/')
def read_root(): return {'message': 'VyapaarVaani API'}
