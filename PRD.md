# VyapaarVaani — Product Requirements Document
**Version:** 1.0  
**Team:** [Your Team Name]  
**Last Updated:** 2026-03-28  
**Status:** Feature Beta (Financial Health Score Implemented) ✅  
**SDG Alignment:** SDG 8 (Decent Work & Economic Growth) · SDG 1 (No Poverty)

---

## 1. Overview

### 1.1 Problem Statement

India has over 10 million street vendors — chai sellers, fruit cart operators, roadside tailors — who run real businesses entirely from memory. They have no financial records, which blocks access to institutional loans, prevents intelligent stock planning, and makes income invisible to government schemes.

The barrier is not motivation. Writing takes time, and literacy is not universal. Voice, however, is effortless. Most vendors already narrate their day into WhatsApp voice notes.

**The gap:** nothing on the other side converts that narration into structured, actionable business data.

### 1.2 Solution

VyapaarVaani is an AI-powered voice ledger. A vendor speaks freely about their day — what they sold, what they spent, how the day went — in Hindi, English, or Hinglish. The system transcribes, extracts structured business data, maintains a running ledger, identifies weekly patterns, and surfaces next-day suggestions. Zero form-filling. Zero literacy requirement.

### 1.3 Target User

**Primary:** Street vendor, 25–55 years old, semi-literate or fully literate, smartphone user, speaks Hindi or Hinglish. Uses WhatsApp daily. Has never used a finance or bookkeeping app.

**Secondary:** NGO field officers and government scheme administrators who need to verify informal income.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Voice input works end-to-end | Transcript accuracy on Hinglish audio | ≥ 85% word accuracy |
| Entity extraction is reliable | Ledger entries with ≥1 item extracted | ≥ 90% of valid recordings |
| No data is silently dropped | Flagged ambiguous entries shown to user | 100% of uncertain extractions flagged |
| Health Score works end-to-end | 5-criterion scoring engine (0-100) | Implementation Ready |
| PDF is credible for loan use | Professional Financial Profile Export | Working in Phase 2 |
| Patterns are useful after a week | Pattern insight generated after 4 days of data | Working in Phase 3 |

---

## 3. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + Vite + Tailwind CSS | Fast setup, familiar |
| Backend | FastAPI (Python) | Existing expertise, async support |
| Speech-to-Text | Deepgram Nova-2 | Best Hinglish support, simple API |
| AI / LLM | Groq API + Llama 3.3 70b | Low latency, JSON mode, free tier |
| Database | Firebase Firestore | Real-time, no-SQL, auth included |
| Auth | Firebase Auth (anonymous → phone OTP) | Frictionless for low-literacy users |
| PDF Export | jsPDF (client-side) | No backend needed for PDF |
| Hosting | Firebase Hosting + Cloud Run | One ecosystem |

---

## 4. System Architecture

```
Vendor (browser)
    │
    │  audio blob (≤3 min)
    ▼
Deepgram Nova-2 ── transcript ──▶ FastAPI /ingest
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                        Groq Llama         Firestore
                     (entity extract)   (ledger write)
                              │                 │
                              └────────┬────────┘
                                       ▼
                               FastAPI /insights
                              (pattern detection)
                                       │
                              ┌────────┴────────┐
                              ▼                 ▼
                      Pattern summary      jsPDF export
                      (frontend display)  (income statement)
```

### 4.1 Firestore Schema

```
vendors/
  {vendorId}/
    profile/
      name: string
      city: string
      business_type: string
      created_at: timestamp

    entries/
      {YYYY-MM-DD}/
        audio_url: string          # Firebase Storage ref
        transcript: string
        items_sold: [
          { name: string, qty: number|null, price: number|null }
        ]
        expenses: [
          { label: string, amount: number|null }
        ]
        earnings: number|null
        flags: [
          { field: string, reason: string, resolved: boolean }
        ]
        created_at: timestamp
```

---

## 5. Feature Specification

### 5.1 Core Features (Phase 1 & 2)

#### F1 — Voice Recording & Transcription

**Description:** User records up to 3 minutes of free-form narration. System sends audio to Deepgram and returns a transcript.

**Acceptance Criteria:**
- [ ] Record button visible on home screen
- [ ] Recording limited to 180 seconds with live countdown
- [ ] Audio sent to Deepgram Nova-2 with `language: hi` and `detect_language: true`
- [ ] Transcript displayed to user before extraction proceeds
- [ ] If transcript returns empty or error, show retry prompt
- [ ] Raw audio stored in Firebase Storage at `vendors/{vendorId}/audio/{date}.webm`

**API call:**
```python
# Deepgram request
response = deepgram.listen.prerecorded.v("1").transcribe_file(
    {"buffer": audio_bytes, "mimetype": "audio/webm"},
    PrerecordedOptions(
        model="nova-2",
        language="hi",
        detect_language=True,
        punctuate=True,
    )
)
transcript = response.results.channels[0].alternatives[0].transcript
```

---

#### F2 — Entity Extraction & Ledger Entry

**Description:** Groq parses the transcript and extracts structured business data. Ambiguous values are flagged, not dropped.

**Acceptance Criteria:**
- [ ] Groq called in JSON mode with the extraction prompt below
- [ ] Output matches schema: `{ items_sold, expenses, earnings, flags }`
- [ ] If `qty` or `price` is absent or vague, set to `null` and add a flag
- [ ] If extraction fails JSON parse, retry once with stricter prompt
- [ ] Ledger entry written to Firestore on success
- [ ] Entry displayed to user as a readable card immediately after save

**Groq extraction prompt:**
```
You are a business data extractor for Indian street vendors.

Given a voice transcript in Hindi, English, or Hinglish, extract:
- items_sold: array of { name: string, qty: number|null, price: number|null }
- expenses: array of { label: string, amount: number|null }
- earnings: total earnings as number|null
- flags: array of { field: string, reason: string } for any uncertain data

Rules:
- Never discard data. If a number is approximate ("around 200"), use 200 and flag it.
- If quantity is missing ("sold some bananas"), set qty to null and flag it.
- Map "maal", "saamaan" to "raw materials" in expenses.
- earnings = total received from customers, not profit.
- Respond ONLY with valid JSON. No explanation, no markdown fences.

Transcript:
"""
{transcript}
"""
```

---

#### F3 — Ledger View

**Description:** User can see all past entries as a scrollable list. Tapping an entry shows item breakdown, expenses, earnings, and any unresolved flags.

**Acceptance Criteria:**
- [ ] Home screen shows last 7 entries by default
- [ ] Each entry card shows: date, total earnings, item count
- [ ] Tapping a card expands full detail: items sold (with qty/price), expenses, flagged fields
- [ ] Flagged fields highlighted in amber with the flag reason
- [ ] "Mark as resolved" button per flag (writes `resolved: true` to Firestore)

---

#### F4 — Financial Profile (PDF Export)

**Description:** User can export a professional business health profile as a 1-page PDF using jsPDF. This replaces the standard "Income Statement" with a more holistic view for PM SVANidhi.

**Acceptance Criteria:**
- [x] Export button visible on Financial Health screen
- [x] PDF contains: vendor name, business type, city, 0-100 score, tier, 5-criterion breakdown table, loan estimate (if score > 45), resources (PM SVANidhi), disclaimer
- [x] Generated entirely client-side with jsPDF
- [x] File name: `VoiceTrace_HealthProfile_{Vendor}_{YYYY-MM}.pdf`

**API Implementation:**
- Integrated with `HealthExport.tsx` component.

```
[VyapaarVaani Logo]                    [Date range]

INCOME STATEMENT — WEEKLY SUMMARY
Vendor: [name] | Business: [type] | City: [city]

────────────────────────────────────
EARNINGS
  Total sales received       ₹ XXXX

EXPENSES
  Raw materials              ₹ XXXX
  Transport                  ₹  XXX
  Other                      ₹  XXX
  Total expenses             ₹ XXXX

NET INCOME                   ₹ XXXX
────────────────────────────────────
Items sold this week:
  • [Item A] — sold X times
  • [Item B] — sold X times

This statement was generated from
voice-recorded daily business data.
```

---

### 5.2 Intelligence Features (Phase 3)

#### F5 — Weekly Pattern Detection

**Description:** After 4+ days of data, the system identifies patterns and surfaces plain-language observations.

**Acceptance Criteria:**
- [ ] Pattern endpoint runs only when ≥4 entries exist in Firestore
- [ ] Patterns detected: top-selling item, highest-earning day of week, expense trend (rising/stable/falling)
- [ ] Output is plain language, max 3 bullet points, no charts
- [ ] Patterns refreshed once per day, cached in Firestore under `vendors/{vendorId}/insights/latest`
- [ ] Displayed on a dedicated "Insights" tab

**Pattern logic (Python):**
```python
def detect_patterns(entries: list[dict]) -> list[str]:
    insights = []

    # Top-selling item
    item_counts = Counter()
    for e in entries:
        for item in e.get("items_sold", []):
            if item["name"]:
                item_counts[item["name"]] += 1
    if item_counts:
        top = item_counts.most_common(1)[0]
        insights.append(f"{top[0]} sold on {top[1]} out of {len(entries)} days — your most consistent item.")

    # Earnings trend
    earnings = [e.get("earnings") for e in entries if e.get("earnings")]
    if len(earnings) >= 4:
        avg = sum(earnings) / len(earnings)
        recent_avg = sum(earnings[-2:]) / 2
        if recent_avg > avg * 1.15:
            insights.append("Your earnings over the last 2 days are above your usual average. Good run!")
        elif recent_avg < avg * 0.85:
            insights.append("Earnings in the last 2 days are below your average. Worth checking stock or timing.")

    # Expense trend
    expenses = [sum(ex.get("amount", 0) or 0 for ex in e.get("expenses", [])) for e in entries]
    if len(expenses) >= 4:
        if expenses[-1] > (sum(expenses[:-1]) / len(expenses[:-1])) * 2:
            insights.append("Today's expenses were double your usual. Did something unusual happen?")

    return insights
```

---

#### F6 — Next-Day Stock Suggestion

**Description:** Based on sell-through history and any "ran out" mentions in transcripts, Groq generates 1-line per-item stock suggestions.

**Acceptance Criteria:**
- [ ] Triggered after user views Insights tab
- [ ] Uses last 7 days of `items_sold` data + any transcript mentions of "khatam ho gaya" / "ran out" / "stock nahi tha"
- [ ] Groq returns max 5 item suggestions in JSON: `{ item, action, reason }`
- [ ] Displayed as: "🫙 Bananas — Prepare 20% more. Sold out 3 of the last 5 days."
- [ ] Suggestions stored under `vendors/{vendorId}/insights/next_day`

---

### 5.3 Optional / Stretch Features (Phase 4)

#### F10 — Financial Health Score (PM SVANidhi Readiness)

**Description:** A proprietary scoring engine that evaluates vendor creditworthiness across 5 criteria: History, Earnings Consistency, Expense Stability, Diversification, and Record Cleanliness.

**Acceptance Criteria:**
- [x] Scoring algorithm (0-100) implemented in `financial_health.py`
- [x] 12-hour compute cache in Firestore to minimize database load
- [x] Score visualization (SVG Arc) with color-coded tiers (Excellent/Good/Building/Early)
- [x] Loan estimate calculation (3x monthly average income)
- [x] Actionable "What to Improve" tips surfaced for scores < 80
- [x] Real-time widget on Home screen for quick check

**Criteria Weights:**
- Business History (40 pts)
- Earnings Consistency (25 pts)
- Expense Stability (15 pts)
- Diversification (10 pts)
- Record Cleanliness (10 pts)

---

#### F7 — Confidence Flags & Clarification

- On next app open after an entry with unresolved flags, surface one clarification prompt
- Format: "Yesterday you mentioned selling some bananas — how many did you sell? [Enter number] or [Skip]"
- On answer, update the original Firestore entry

#### F8 — Anomaly Alerts

- Single-line alert if today's earnings or expenses deviate >2x from 7-day average
- Non-judgmental phrasing: "Today's expenses were higher than usual. Did something happen?"
- Dismissible toast on the home screen

#### F9 — Voice Playback with Highlights *(low priority)*

- Store audio in Firebase Storage
- On ledger entry view, each extracted item links to a timestamp in the audio
- Tap item → plays that segment of the original recording

---

## 6. API Endpoints

### `POST /ingest`
**Request:**
```json
{
  "vendor_id": "string",
  "audio_base64": "string",
  "date": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "transcript": "string",
  "ledger_entry": {
    "items_sold": [...],
    "expenses": [...],
    "earnings": 1200,
    "flags": [...]
  },
  "entry_id": "YYYY-MM-DD"
}
```

**Error handling:**
- Deepgram fails → `503` with `{ error: "transcription_failed" }`
- Groq parse fails → retry once; if still fails → save raw transcript, flag entire entry as `extraction_failed`

---

### `GET /insights/{vendor_id}`
**Response:**
```json
{
  "patterns": ["string", "string"],
  "next_day_suggestions": [
    { "item": "string", "action": "string", "reason": "string" }
  ],
  "summary": {
    "weekly_earnings": 7200,
    "weekly_expenses": 2100,
    "net_income": 5100
  }
}
```

---

## 7. UI Screens

### Screen 1 — Home / Record
- Large central record button (primary CTA)
- Last entry card below (date, earnings, item count)
- Bottom nav: Home · Ledger · Insights · Export

### Screen 2 — Transcript Review
- Full transcript displayed post-recording
- "Looks good → Save" button
- "Re-record" button
- Extracted items preview (before Firestore write)

### Screen 3 — Ledger
- Scrollable list of dated entry cards
- Each card: date, earnings total, item count, flag indicator
- Expand on tap → full detail with flag resolution

### Screen 4 — Insights
- Pattern bullets (plain language)
- Next-day suggestions (one line per item)
- "Only available after 4 days of data" placeholder for new users

### Screen 5 — Export
- Period selector: This Week / This Month / Custom Range
- Preview of income statement data
- "Download PDF" button
- "Share" button (opens native share sheet)

---

## 8. Build Phases

### Phase 1 — Core Pipeline (Hours 0–5)
**Goal:** Voice in → Ledger entry saved. Demoable end-to-end.

| Task | Owner | Est. |
|------|-------|------|
| Deepgram integration + transcript display | Backend | 1.5 hr |
| Groq entity extraction with JSON mode | Backend | 1.5 hr |
| Firestore write + read for entries | Backend | 1 hr |
| Record button + transcript screen (React) | Frontend | 1 hr |

**Exit criteria:** Record audio → See extracted ledger entry on screen.

---

### Phase 2 — Ledger & Export (Hours 5–10)
**Goal:** Ledger browsable. PDF exportable. App feels complete.

| Task | Owner | Est. |
|------|-------|------|
| Ledger list screen with entry cards | Frontend | 1.5 hr |
| Flag display + resolution UI | Frontend | 1 hr |
| jsPDF income statement | Frontend | 1.5 hr |
| `/insights` endpoint (summary only) | Backend | 1 hr |

**Exit criteria:** User can browse past entries and download a PDF.

---

### Phase 3 — Intelligence (Hours 10–16)
**Goal:** Pattern engine live. Next-day suggestions working.

| Task | Owner | Est. |
|------|-------|------|
| Pattern detection logic (Python) | Backend | 2 hr |
| Groq next-day suggestion prompt | Backend | 1 hr |
| Insights screen (React) | Frontend | 1.5 hr |
| Cache insights in Firestore | Backend | 0.5 hr |

**Exit criteria:** After 4+ entries, Insights tab shows real patterns.

---

### Phase 4 — Polish & Stretch (Hours 16–24)
**Goal:** Confidence flags, anomaly alerts, demo-ready UI.

| Task | Owner | Est. |
|------|-------|------|
| Clarification prompt on app open | Frontend | 1 hr |
| Anomaly alert toast | Backend + Frontend | 1 hr |
| Onboarding screen (name, city, business type) | Frontend | 1 hr |
| UI polish + Tailwind cleanup | Frontend | 2 hr |
| Demo data seeding script | Backend | 1 hr |

---

## 9. Environment Variables

```env
# Backend (.env)
DEEPGRAM_API_KEY=
GROQ_API_KEY=
FIREBASE_SERVICE_ACCOUNT_JSON=   # path to JSON file

# Frontend (.env.local)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_API_BASE_URL=http://localhost:8000
```

---

## 10. Known Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Deepgram poor accuracy on heavy dialect | Medium | Test early with real Hinglish samples; fallback to Whisper if needed |
| Groq returns malformed JSON | Low-Medium | Retry with stricter prompt; save raw transcript as fallback |
| Vendor says nothing quantifiable | High | Flag entry as "narrative only"; still save transcript |
| PDF layout breaks on mobile | Low | Test jsPDF on Android Chrome in Phase 2 |
| Firebase free tier limits hit during demo | Low | Use a dedicated demo project with no usage from other apps |

---

## 11. Out of Scope (v1)

- Multi-vendor dashboard / admin panel
- WhatsApp bot integration
- Offline mode / PWA
- Bank API integration
- Multi-language UI (Hindi UI text)
- Voice playback with timestamp highlights (Phase 4 stretch)

---

## 12. Appendix — Hinglish Test Samples

Use these to validate Deepgram + Groq extraction during development:

**Sample 1 (clear):**
> "Aaj maine 30 kela becha, 10 rupaye ek. Aur 20 apple bhi gaye, 15 rupaye each. Maal ke liye 150 rupaye lage. Total around 750 mile."

**Sample 2 (ambiguous qty):**
> "Thodi chai bachi, baaki sab sell ho gayi. Expenses mein auto ka 80 rupaya gaya aur thoda namak lekar aaya. Kaafi acha din tha, 600 se upar toh mila."

**Sample 3 (ran out of stock):**
> "Banana khatam ho gaya 2 baje tak, demand thi lekin tha nahi. Next time zyada laana chahiye. Aaj total 900 rupaye ka business hua."

---

*Document generated for VyapaarVaani hackathon submission. Build sequence follows Phase 1 → 4 order.*
