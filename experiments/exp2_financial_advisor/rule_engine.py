from typing import Dict, Any, Tuple

def calculate_price_change(current_price: float, previous_close: float) -> Tuple[float, float]:
    price_change = current_price - previous_close
    pct_change = (price_change / previous_close) * 100.0
    return round(price_change, 2), round(pct_change, 2)

def evaluate_decision_rule(pct_change: float) -> Tuple[str, str]:
    """
    Core Rule Specification from Manual:
    Greater than +2.0% -> BUY
    Less than -2.0%    -> SELL
    Between -2.0% and +2.0% -> HOLD
    """
    if pct_change > 2.0:
        return "BUY", f"Percentage change (+{pct_change}%) exceeded bullish threshold (> +2.0%)"
    elif pct_change < -2.0:
        return "SELL", f"Percentage change ({pct_change}%) breached bearish threshold (< -2.0%)"
    else:
        return "HOLD", f"Percentage change ({pct_change}%) remains within neutral consolidation bounds [-2.0%, +2.0%]"

def calculate_risk_and_confidence(
    pct_change: float,
    current_price: float,
    sma_20: float,
    volume: int,
    avg_volume: int
) -> Tuple[str, float, str]:
    # Risk classification
    abs_pct = abs(pct_change)
    if abs_pct > 3.5:
        risk = "High Risk"
    elif abs_pct > 1.5:
        risk = "Medium Risk"
    else:
        risk = "Low Risk"

    # Rule-based confidence scoring (0-100)
    score = 60.0
    # Indicator 1: Moving average trend alignment
    if (pct_change > 0 and current_price > sma_20) or (pct_change < 0 and current_price < sma_20):
        score += 20.0
    else:
        score -= 10.0

    # Indicator 2: Volume confirmation
    if volume > avg_volume:
        score += 20.0
    else:
        score -= 10.0

    score = max(10.0, min(100.0, score))
    if score >= 80:
        conf_label = "High"
    elif score >= 50:
        conf_label = "Medium"
    else:
        conf_label = "Low"

    return risk, round(score, 1), conf_label
