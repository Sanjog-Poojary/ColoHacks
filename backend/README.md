# VyapaarVaani Backend 🎙️🐍

The FastAPI-powered intelligence engine for VyapaarVaani. Responsible for voice ingestion, entity extraction, and business logic.

## ✨ Features
- **Voice Ingestion**: Integrated with Deepgram Nova-3 for Hinglish transcription.
- **Entity Extraction**: Uses Llama 3.3 (via Groq) with structured JSON steering to identify sales and expenses.
- **Financial Health Engine**: Custom scoring logic for loan readiness (PM SVANidhi).
- **Stock Prediction**: Linear regression and exponential smoothing for inventory suggestions.
- **Firestore Integration**: Real-time storage with automated background cache invalidation.

## 🛠️ Tech Stack
- **Framework**: FastAPI
- **LLM**: Groq (Llama 3.3 70B)
- **STT**: Deepgram Nova-3
- **Data**: Pandas, NumPy, Statsmodels
- **Database**: Firebase Admin SDK

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   Create a `.env` file with the following:
   ```env
   GROQ_API_KEY=your_key
   DEEPGRAM_API_KEY=your_key
   ```
   Add `serviceAccountKey.json` to the `backend/` root directory.

3. **Run Server**:
   ```bash
   python -m uvicorn app.main:app --reload
   ```

## 📖 Global Documentation
For the full project overview and deployment guide, see the **[Root README](../README.md)**.
