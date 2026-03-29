# VyapaarVaani Frontend 🎙️📊

The React-based dashboard for VyapaarVaani, optimized for mobile-first usage by Indian street vendors.

## ✨ Features
- **Voice Recording Interface**: Simplified one-tap recording with Framer Motion animations.
- **Financial Health Dashboard**: SVG-based score visualization and logic for PM SVANidhi readiness.
- **Interactive Insights**: Recharts-powered business analytics and trend forecasting.
- **PDF Generation**: Client-side financial profile generation using `jsPDF`.
- **Offline Resilience**: Basic support for handling intermittent connectivity common in street markets.

## 🛠️ Tech Stack
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **PDF**: jsPDF + jspdf-autotable

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` with your Firebase config and API base URL:
   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 📖 Global Documentation
For the full project overview, API reference, and deployment guide, see the **[Root README](../README.md)**.
