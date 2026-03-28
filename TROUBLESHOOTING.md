# 🛠️ Troubleshooting Guide — VyapaarVaani

This guide helps diagnose and resolve common development and production issues.

## 1. Voice & Ingestion Issues

### 1.1 "Silence Detected" or 400 Bad Request
- **Cause**: The audio blob sent was too small or contained no speech.
- **Solution**: 
  - Ensure the browser has **Microphone permissions**.
  - Check the output of `VoiceRecorder.tsx` console logs.
  - Verify that the `webm` format is supported by your browser (e.g., Safari requires a polyfill or `mp4` fallback).

### 1.2 "AI Extraction Failed" 
- **Cause**: Groq might be experiencing rate limits or the prompt was too complex for the current narration.
- **Solution**: 
  - Check **Groq API Status**.
  - Review `backend/app/api/ingest.py` for the current JSON schema extraction.
  - Verify `DEEPGRAM_API_KEY` is valid.

---

## 2. API & Backend Failures

### 2.1 500 Internal Server Error
- **Cause**: Usually a missing or invalid `serviceAccountKey.json`.
- **Solution**: 
  - Ensure the key exists in `backend/` and matches your current Firebase project.
  - Check Python logs (`uvicorn` or Cloud Run logs) for the specific traceback.

### 2.2 403 Forbidden (Firestore)
- **Cause**: The user is trying to access a shop or ledger entry they don't own.
- **Solution**: 
  - Check the `uid` in the Firestore document against the `uid` in the `Authorization` header.
  - Verify if your Firestore rules allow the operation.

### 2.3 CORS Errors in Browser
- **Cause**: The frontend is trying to call an API on a different domain without permission.
- **Solution**: 
  - Ensure `app/main.py` has `CORSMiddleware` configured.
  - For production, replace `allow_origins=['*']` with your actual domain (`['https://vyapaar-vaani.web.app']`).

---

## 3. Frontend & UI Glitches

### 3.1 Components Not Found (ReferenceError)
- **Cause**: Vite HMR (Hot Module Replacement) sometimes fails to hoist components defined at the bottom of a file.
- **Solution**: 
  - Move sub-components (like `NavTab` or `MobileNavTab`) to the **top** of the file, outside the main `App` component.
  - Force a page refresh (`Cmd+R` / `Ctrl+R`).

### 3.2 "Confirm Ledger" Does Nothing
- **Cause**: Likely a type mismatch in the `PATCH` payload or a failed API call with no alert.
- **Solution**: 
  - Check the **Network Tab** in Chrome DevTools.
  - Verify the `editedEntry` object in `ClarificationDialog.tsx` contains the expected fields.

---

## 4. Useful Commands for Debugging

| Command | Purpose |
|---------|---------|
| `gcloud run logs read --service vyapaar-backend` | Read production backend logs. |
| `npm run dev` | Start frontend with HMR. |
| `uvicorn app.main:app --reload` | Start backend with auto-reload. |
| `gcloud auth login` | Re-authenticate with GCP if storage/database fails. |
