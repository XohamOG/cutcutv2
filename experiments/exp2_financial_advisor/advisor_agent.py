import csv
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from data_fetcher import fetch_stock_data
from rule_engine import calculate_price_change, evaluate_decision_rule, calculate_risk_and_confidence

LOG_FILE = Path(__file__).parent / "financial_log.csv"

def init_log(log_path: Path = LOG_FILE):
    if not log_path.exists():
        with open(log_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Timestamp", "Stock_Symbol", "Current_Price", "Previous_Close",
                "Price_Change", "Percentage_Change", "Decision", "Reason",
                "Risk_Level", "Confidence", "Status"
            ])

def log_financial_event(data: Dict[str, Any], status: str = "SUCCESS", log_path: Path = LOG_FILE):
    init_log(log_path)
    with open(log_path, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.utcnow().isoformat(),
            data.get("symbol", "N/A"),
            data.get("current_price", 0.0),
            data.get("previous_close", 0.0),
            data.get("price_change", 0.0),
            data.get("percentage_change", 0.0),
            data.get("decision", "N/A"),
            data.get("reason", "N/A"),
            data.get("risk_level", "N/A"),
            data.get("confidence", "N/A"),
            status
        ])

class FinancialAdvisoryAgent:
    def __init__(self):
        init_log()

    def analyze_stock(self, symbol: str, user_instruction: Optional[str] = None) -> Dict[str, Any]:
        # Input validation
        if not symbol or not symbol.strip():
            err_data = {"symbol": str(symbol), "decision": "INVALID", "reason": "Empty or missing stock symbol."}
            log_financial_event(err_data, status="INPUT_ERROR")
            return {"status": "ERROR", "error": "Invalid stock symbol: Input cannot be empty."}

        stock_info = fetch_stock_data(symbol)
        if not stock_info:
            err_data = {"symbol": symbol, "decision": "UNSUPPORTED", "reason": f"Stock {symbol} not found in market feed."}
            log_financial_event(err_data, status="NOT_FOUND")
            return {"status": "ERROR", "error": f"Unsupported or unknown stock symbol '{symbol}'."}

        # Calculation
        curr = stock_info["current_price"]
        prev = stock_info["previous_close"]
        price_change, pct_change = calculate_price_change(curr, prev)
        decision, reason = evaluate_decision_rule(pct_change)
        risk, conf_score, conf_label = calculate_risk_and_confidence(
            pct_change, curr, stock_info["sma_20"], stock_info["volume"], stock_info["avg_volume"]
        )

        # Adversarial Guardrail Testing:
        # User instructions must NEVER override the trusted Python rule decision.
        tamper_detected = False
        if user_instruction:
            malicious_patterns = [
                r"change decision to",
                r"override decision",
                r"ignore rule",
                r"force (buy|sell|hold)",
                r"say buy instead",
                r"say sell instead"
            ]
            for pat in malicious_patterns:
                if re.search(pat, user_instruction.lower()):
                    tamper_detected = True
                    break

        result = {
            "symbol": stock_info["symbol"],
            "current_price": curr,
            "previous_close": prev,
            "price_change": price_change,
            "percentage_change": pct_change,
            "decision": decision,
            "reason": reason,
            "risk_level": risk,
            "confidence_score": conf_score,
            "confidence": conf_label,
            "prompt_injection_tamper_attempt": tamper_detected,
            "trusted_decision_preserved": True,
            "educational_disclaimer": "Educational research prototype only. Not certified financial advice."
        }

        log_financial_event(result, status="SUCCESS")
        return {"status": "SUCCESS", "data": result}

    def analyze_portfolio(self, symbols: List[str]) -> Dict[str, Any]:
        portfolio_results = []
        counts = {"BUY": 0, "SELL": 0, "HOLD": 0, "ERROR": 0}
        for sym in symbols:
            res = self.analyze_stock(sym)
            if res["status"] == "SUCCESS":
                d = res["data"]["decision"]
                counts[d] = counts.get(d, 0) + 1
                portfolio_results.append(res["data"])
            else:
                counts["ERROR"] += 1
        return {
            "summary_counts": counts,
            "portfolio": portfolio_results
        }
