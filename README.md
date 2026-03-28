# VyapaarVaani AI Ledger 🎙️📊

VyapaarVaani is an AI-powered voice ledger designed specifically for Indian street vendors. It allows vendors to narrate their daily business activities in Hinglish (Hindi + English), which are then automatically converted into structured financial records.

## ✨ Features
- **AI Voice Ingestion**: Record your day naturally; no manual data entry required.
- **Multi-lingual Support**: Powered by Deepgram Nova-2 for accurate Hinglish transcription.
- **Smart Extraction**: Uses Llama 3 via Groq to identify items sold, expenses, and total earnings.
- **Premium UI**: Modern Glassmorphism interface for a high-end fintech experience.
- **Exportable Insights**: Ready-to-use income statements (Coming Soon).

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), Deepgram SDK, Groq SDK.
- **Frontend**: React (Vite), Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Database**: Firebase Firestore.

## 🚀 Quick Start
### Backend Setup
1. Navigate to 'backend/'
2. Create a '.env' file with 'DEEPGRAM_API_KEY' and 'GROQ_API_KEY'.
3. Install dependencies: 'pip install -r requirements.txt'
4. Run the server: 'uvicorn app.main:app --reload'

### Frontend Setup
1. Navigate to 'frontend/'
2. Install dependencies: 'npm install'
3. Run the dev server: 'npm run dev'

---
Built for ColoHacks 2026.
