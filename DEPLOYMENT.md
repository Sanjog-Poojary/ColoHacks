# 🚀 Deployment Guide — VyapaarVaani

This guide covers the end-to-end process of deploying VyapaarVaani to a production environment using Firebase and Google Cloud Platform (GCP).

## 1. Firebase Setup

### 1.1 Project Creation
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it `vyapaar-vaani`.
3. Enable **Google Analytics** (optional).

### 1.2 Database & Storage
1. **Firestore**: 
   - Click **Create Database**.
   - Start in **Production Mode**.
   - Choose a location (e.g., `asia-south1`).
2. **Storage**:
   - Click **Get Started**.
   - Create a bucket with default settings.
   - Note the bucket name (e.g., `vyapaar-vaani.appspot.com`).

### 1.3 Service Account Key
1. Go to **Project Settings** > **Service Accounts**.
2. Click **Generate New Private Key**.
3. Save this file as `backend/serviceAccountKey.json`.
   > [!CAUTION]
   > NEVER commit this file to GitHub. It is ignored by `.gitignore` by default.

---

## 2. Backend Deployment (Cloud Run)

The backend is a FastAPI application that can be containerized.

### 2.1 Build Docker Image
Ensure you have the [Google Cloud SDK](https://cloud.google.com/sdk) installed.
```bash
cd backend
gcloud builds submit --tag gcr.io/[PROJECT_ID]/vyapaar-backend
```

### 2.2 Deploy to Cloud Run
```bash
gcloud run deploy vyapaar-backend \
  --image gcr.io/[PROJECT_ID]/vyapaar-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars "DEEPGRAM_API_KEY=your_key,GROQ_API_KEY=your_key"
```

---

## 3. Frontend Deployment (Firebase Hosting)

### 3.1 Build the App
```bash
cd frontend
npm install
npm run build
```

### 3.2 Deploy
Make sure you have `firebase-tools` installed (`npm install -g firebase-tools`).
```bash
firebase login
firebase init hosting
# Select your project, set public directory to 'dist', rewrite all URLs to index.html
firebase deploy --only hosting
```

---

## 4. Environment Variables Summary

| Variable | Source | Description |
|----------|--------|-------------|
| `DEEPGRAM_API_KEY` | Deepgram Console | Used for Hinglish transcription. |
| `GROQ_API_KEY` | Groq RAM | Used for Llama 3.3 entity extraction. |
| `VITE_API_BASE_URL` | Cloud Run URL | The endpoint for your deployed backend. |

> [!TIP]
> Always use `https` for the API URL in production to avoid mixed content errors.
