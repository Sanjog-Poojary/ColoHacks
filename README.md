# VyapaarVaani AI Ledger 🎙️📊

VyapaarVaani is an AI-powered voice ledger designed specifically for Indian street vendors. It allows vendors to narrate their daily business activities in Hinglish (Hindi + English), which are then automatically converted into structured financial records.

- ✨ **Features**
- **AI Voice Ingestion**: Record your day naturally; no manual data entry required.
- **Multi-lingual Support**: Powered by Deepgram Nova-3 for accurate Hinglish transcription.
- **Smart Extraction**: Uses Llama 3.3 via Groq to identify items sold, expenses, and total earnings.
- **Confidence Flags & Proactive Clarification**: Automatically identifies ambiguous data and prompts for shopkeeper review on startup.
- **Local ML Insights**: Professional business analytics using Linear Regression and Exponential Smoothing for revenue forecasting and automated stock suggestions. No external AI APIs are called for this feature, ensuring zero latency and 100% data privacy.
- **Premium Analytics UI**: Modern Recharts-based dashboard with interactive trend lines, rolling averages, and a 7-day forecast zone.
- **Entity Normalization**: High-speed fuzzy matching to aggregate similar items (e.g., 'Kela' and 'Banana') for accurate inventory tracking.
- **Exportable Insights**: Ready-to-use income statements (Coming Soon).

## 🛠️ Tech Stack
- **Backend**: FastAPI (Python), Deepgram SDK, Groq SDK.
- **Frontend**: React (Vite), Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Database**: Firebase Firestore.

## 📖 Documentation
- **[Deployment Guide](file:///c:/Users/Sanjog/Downloads/ColoHacks/DEPLOYMENT.md)** — Step-by-step instructions for Firebase and Cloud Run.
- **[Troubleshooting Guide](file:///c:/Users/Sanjog/Downloads/ColoHacks/TROUBLESHOOTING.md)** — Fixes for common voice and API errors.
- **[Product Requirements (PRD)](file:///c:/Users/Sanjog/Downloads/ColoHacks/PRD.md)** — Full vision and strategy for VyapaarVaani.

### 🔌 API Reference (Swagger)
When the backend is running locally, access the interactive API docs at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---
Built for ColoHacks 2026.
