@echo off
start cmd /k "cd backend && uvicorn app.main:app --reload --port 8000"
start cmd /k "cd frontend && npm run dev"