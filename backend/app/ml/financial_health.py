"""
Financial Health Score Engine

Computes a 0-100 financial health score from ledger entries.
Score is broken into 5 weighted criteria aligned with Indian
microfinance institutions and the PM SVANidhi street vendor loan scheme.

This is NOT a loan eligibility calculator — it is a credit profile
indicator that helps vendors understand their own business health.
"""
import numpy as np
import logging

logger = logging.getLogger(__name__)

MIN_DAILY_EARNINGS_TARGET = 500  # ₹500/day — PM SVANidhi baseline
LOAN_MULTIPLIER = 3              # 3× monthly income, standard MFI formula

DATA_TIERS = [
    (7,   10, "Getting started"),
    (30,  20, "Building profile"),
    (90,  30, "Established record"),
    (180, 40, "Loan-ready history"),
]

DISCLAIMER = (
    "This score is an indicator of business health based on your "
    "recorded data. It is not a formal credit assessment. Actual "
    "loan eligibility is determined by lenders. Learn about PM "
    "SVANidhi at pmsvnidhi.mohua.gov.in"
)


def compute_financial_health(vendor_id: str, entries: list[dict]) -> dict:
    """
    Compute a 0-100 financial health score from ledger entries.
    Each entry should have: earnings (float), expenses (list), items_sold (list), flags (list).
    """
    score = 0
    criteria = []
    days_of_data = len(entries)

    if days_of_data == 0:
        return {
            "score": 0,
            "tier": "No data",
            "criteria": [],
            "gaps": ["Start recording your daily sales to build your profile."],
            "loan_estimate": None,
            "avg_daily_earnings": 0,
            "days_recorded": 0,
            "unique_items": 0,
            "disclaimer": DISCLAIMER
        }

    # --- CRITERION 1: Data history depth (max 40 points) ---
    history_points = 0
    history_label = "Just started"
    for (days_threshold, points, label) in DATA_TIERS:
        if days_of_data >= days_threshold:
            history_points = points
            history_label = label

    score += history_points
    next_tier = next(
        ((d, p, l) for (d, p, l) in DATA_TIERS if days_of_data < d),
        None
    )
    criteria.append({
        "name": "Business history",
        "points_earned": history_points,
        "points_max": 40,
        "status": history_label,
        "gap": f"{next_tier[0] - days_of_data} more days to reach '{next_tier[2]}'"
               if next_tier else None
    })

    # --- CRITERION 2: Earnings consistency (max 25 points) ---
    recent = entries[-30:] if len(entries) >= 30 else entries
    earnings_values = [e.get("earnings") or 0 for e in recent]
    avg_daily = sum(earnings_values) / len(earnings_values) if earnings_values else 0
    days_above_target = sum(1 for e in earnings_values if e >= MIN_DAILY_EARNINGS_TARGET)
    consistency_ratio = days_above_target / len(earnings_values) if earnings_values else 0

    if consistency_ratio >= 0.8:
        earn_points = 25
        earn_status = "Strong"
        earn_gap = None
    elif consistency_ratio >= 0.5:
        earn_points = 15
        earn_status = "Moderate"
        earn_gap = f"₹{MIN_DAILY_EARNINGS_TARGET}/day target met on {days_above_target} of {len(earnings_values)} days. Aim for 80%+."
    elif avg_daily > 0:
        earn_points = 8
        earn_status = "Early stage"
        earn_gap = f"Average daily earnings ₹{avg_daily:.0f}. Target ₹{MIN_DAILY_EARNINGS_TARGET}+/day."
    else:
        earn_points = 0
        earn_status = "No earnings recorded"
        earn_gap = "Record your daily sales to show earnings."

    score += earn_points
    criteria.append({
        "name": "Earnings consistency",
        "points_earned": earn_points,
        "points_max": 25,
        "status": earn_status,
        "gap": earn_gap
    })

    # --- CRITERION 3: Expense stability (max 15 points) ---
    expense_values = []
    for e in recent:
        total_exp = sum(ex.get("amount") or 0 for ex in e.get("expenses", []))
        expense_values.append(total_exp)

    if len(expense_values) >= 4 and avg_daily > 0:
        exp_std = float(np.std(expense_values))
        volatility_ratio = exp_std / avg_daily if avg_daily > 0 else 1

        if volatility_ratio < 0.15:
            exp_points = 15
            exp_status = "Very stable"
            exp_gap = None
        elif volatility_ratio < 0.30:
            exp_points = 10
            exp_status = "Mostly stable"
            exp_gap = "Some variation in daily expenses. Stable expenses improve your profile."
        else:
            exp_points = 4
            exp_status = "Variable"
            exp_gap = "Expenses vary significantly day to day. Try to keep costs predictable."
    else:
        exp_points = 4
        exp_status = "Building baseline"
        exp_gap = "Need more data to assess expense stability."

    score += exp_points
    criteria.append({
        "name": "Expense stability",
        "points_earned": exp_points,
        "points_max": 15,
        "status": exp_status,
        "gap": exp_gap
    })

    # --- CRITERION 4: Business diversification (max 10 points) ---
    all_items: set[str] = set()
    for e in entries:
        for item in e.get("items_sold", []):
            if item.get("name"):
                all_items.add(item["name"].lower())
    unique_count = len(all_items)

    if unique_count >= 5:
        div_points = 10
        div_status = f"{unique_count} item types"
        div_gap = None
    elif unique_count >= 3:
        div_points = 7
        div_status = f"{unique_count} item types"
        div_gap = "Selling 5+ item types strengthens your business profile."
    elif unique_count >= 1:
        div_points = 3
        div_status = f"{unique_count} item type(s)"
        div_gap = f"Currently tracking {unique_count} item(s). Add more products to diversify."
    else:
        div_points = 0
        div_status = "No items recorded"
        div_gap = "Record the items you sell each day."

    score += div_points
    criteria.append({
        "name": "Business diversification",
        "points_earned": div_points,
        "points_max": 10,
        "status": div_status,
        "gap": div_gap
    })

    # --- CRITERION 5: Data cleanliness (max 10 points) ---
    unresolved = sum(
        1 for e in entries
        for f in e.get("flags", [])
        if not f.get("resolved", False)
    )

    if unresolved == 0:
        clean_points = 10
        clean_status = "Clean record"
        clean_gap = None
    elif unresolved <= 3:
        clean_points = 6
        clean_status = f"{unresolved} unresolved flags"
        clean_gap = f"Resolve {unresolved} flagged entries in your ledger to improve your score."
    else:
        clean_points = 2
        clean_status = f"{unresolved} unresolved flags"
        clean_gap = f"{unresolved} entries need review. Open your ledger to resolve them."

    score += clean_points
    criteria.append({
        "name": "Record cleanliness",
        "points_earned": clean_points,
        "points_max": 10,
        "status": clean_status,
        "gap": clean_gap
    })

    # --- LOAN ESTIMATE ---
    monthly_income = avg_daily * 30
    loan_estimate = int(monthly_income * LOAN_MULTIPLIER) if avg_daily > 0 else None

    # --- SCORE TIER LABEL ---
    if score >= 80:
        tier = "Excellent"
    elif score >= 65:
        tier = "Good"
    elif score >= 45:
        tier = "Building"
    else:
        tier = "Early stage"

    # --- GAPS LIST (only non-None gaps, max 3 shown) ---
    gaps = [c["gap"] for c in criteria if c["gap"] is not None][:3]

    return {
        "score": score,
        "tier": tier,
        "criteria": criteria,
        "gaps": gaps,
        "loan_estimate": loan_estimate,
        "avg_daily_earnings": round(avg_daily, 2),
        "days_recorded": days_of_data,
        "unique_items": unique_count,
        "disclaimer": DISCLAIMER
    }
