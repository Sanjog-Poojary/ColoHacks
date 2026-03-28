# VyapaarVaani ML Engine Technical Documentation

VyapaarVaani uses a **Local-First ML Architecture** to provide professional business intelligence to street vendors without relying on expensive external AI APIs. All computation happens directly on the FastAPI backend using standard scientific Python libraries.

## Core Models

### 1. Revenue Dynamics (Linear Regression)
- **Module**: `app/ml/revenue_trend.py`
- **Algorithm**: `sklearn.linear_model.LinearRegression`
- **Logic**:
    - Calculates a 7-day rolling average to smooth daily volatility.
    - Fits a linear model on the earnings time series to determine slope.
    - Forecasts the next 7 days of earnings.
- **Trend Thresholds**:
    - Slope > 50: `GROWING`
    - Slope < -50: `DECLINING`
    - Otherwise: `STABLE`

### 2. Demand Forecasting (Exponential Smoothing)
- **Module**: `app/ml/stock_suggestion.py`
- **Algorithm**: `statsmodels.tsa.holtwinters.ExponentialSmoothing`
- **Logic**:
    - Fits a Holt-Winters model per canonical item.
    - Captures historical momentum and trends.
    - Adds a **15% Safety Buffer** if keywords like *"finished"* or *"sold out"* are detected in voice transcripts.

### 3. Entity Normalization (Fuzzy Matching)
- **Module**: `app/ml/normalizer.py`
- **Algorithm**: `rapidfuzz.process.extractOne`
- **Threshold**: 80% similarity score.
- **Purpose**: Collapses variations like *"Kela"* and *"Kele"* into a single canonical product record.

## Hardware & Performance

- **Caching**: Results are cached in Firestore (`shops/{id}/insights/latest`) for **6 hours**.
- **Concurrency**: Models run in separate threads using `asyncio.run_in_executor` to prevent blocking the async event loop.
- **Dependencies**:
    - `pandas`: Data manipulation.
    - `scikit-learn`: Forecasting.
    - `statsmodels`: Advanced time-series analysis.
    - `rapidfuzz`: High-speed string matching.

## Privacy & Safety

> [!IMPORTANT]
> **Data Privacy**: No vendor sales data is sent to Groq or Deepgram for analysis. All logic is executed on-premises.
> [!NOTE]
> **Thresholds**: Insights are only generated after **4 days of data** are recorded to ensure statistical significance.
