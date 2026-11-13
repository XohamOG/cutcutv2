import csv
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from tool_contracts import ALLOWED_TOOLS, FALLBACK_TOOLS
from execution_engine import (
    TOOL_REGISTRY, validate_tool_schema, classify_error
)

LOG_FILE = Path(__file__).parent / "clinical_research_interaction_log.csv"

def init_log(log_path: Path = LOG_FILE):
    if not log_path.exists():
        with open(log_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Timestamp", "User_Query", "Tool_Name", "Parameters",
                "Auth_Status", "Attempts", "Error_Category", "Execution_Status",
                "Source", "Response"
            ])

def log_interaction(
    query: str, tool_name: str, params: Any, auth_status: str,
    attempts: int, err_cat: str, exec_status: str, source: str, response: str
):
    init_log()
    with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.utcnow().isoformat(), query, tool_name, str(params),
            auth_status, attempts, err_cat, exec_status, source, response
        ])

class ClinicalResearchAssistant:
    def __init__(self):
        init_log()

    def select_tool(self, query: str) -> Optional[str]:
        q = query.lower()
        if "bmi" in q or "body mass index" in q or "calculate" in q:
            return "medical_calculator"
        if any(w in q for w in ["research", "study", "paper", "literature", "trial"]):
            return "medical_literature_search"
        if any(w in q for w in ["what is", "define", "explain", "information about"]):
            return "healthcare_knowledge_search"
        return None

    def extract_parameters(self, tool_name: str, query: str) -> Dict[str, Any]:
        if tool_name == "medical_calculator":
            weight_match = re.search(r"(\d+(?:\.\d+)?)\s*kg", query, re.IGNORECASE)
            height_match = re.search(r"(\d+(?:\.\d+)?)\s*m", query, re.IGNORECASE)
            return {
                "operation": "BMI",
                "weight_kg": float(weight_match.group(1)) if weight_match else 0.0,
                "height_m": float(height_match.group(1)) if height_match else 0.0
            }
        elif tool_name == "medical_literature_search":
            return {"query": query, "year_from": 2020, "max_results": 5}
        elif tool_name == "healthcare_knowledge_search":
            return {"query": query}
        return {}

    def execute_with_retry_and_fallback(
        self, tool_name: str, params: Dict[str, Any], query: str
    ) -> Dict[str, Any]:
        # 1. Authorization check
        if tool_name not in ALLOWED_TOOLS:
            log_interaction(query, tool_name, params, "REJECTED", 0, "AUTHORIZATION_ERROR", "FAILED", "SECURITY", "Unauthorized tool access blocked.")
            return {
                "status": "REJECTED",
                "error_category": "AUTHORIZATION_ERROR",
                "message": f"Execution of tool '{tool_name}' is unauthorized by clinical governance policy."
            }

        # 2. Schema validation
        valid, schema_err = validate_tool_schema(tool_name, params)
        if not valid:
            log_interaction(query, tool_name, params, "AUTHORIZED", 1, "INPUT_ERROR", "FAILED", "VALIDATOR", str(schema_err))
            return {
                "status": "FAILED",
                "error_category": "INPUT_ERROR",
                "message": schema_err
            }

        # 3. Execution with retries (up to 3 attempts: initial + 2 retries)
        max_attempts = 3
        attempts = 0
        last_error = None
        func = TOOL_REGISTRY[tool_name]

        while attempts < max_attempts:
            attempts += 1
            try:
                result = func(**params)
                log_interaction(query, tool_name, params, "AUTHORIZED", attempts, "NONE", "SUCCESS", tool_name, str(result))
                return {
                    "status": "SUCCESS",
                    "source": tool_name,
                    "attempts": attempts,
                    "result": result
                }
            except Exception as e:
                last_error = e
                err_type = classify_error(e)
                if err_type != "TRANSIENT_ERROR":
                    # Non-recoverable error, do not retry
                    break

        # 4. Fallback execution if primary fails
        fallback_tool_name = FALLBACK_TOOLS.get(tool_name)
        if fallback_tool_name and fallback_tool_name in TOOL_REGISTRY:
            try:
                fb_func = TOOL_REGISTRY[fallback_tool_name]
                fb_params = {"query": query}
                fb_result = fb_func(**fb_params)
                log_interaction(query, fallback_tool_name, fb_params, "AUTHORIZED", attempts, "FALLBACK_RECOVERED", "FALLBACK_SUCCESS", fallback_tool_name, str(fb_result))
                return {
                    "status": "FALLBACK_SUCCESS",
                    "source": fallback_tool_name,
                    "primary_tool_failed": tool_name,
                    "attempts": attempts,
                    "result": fb_result
                }
            except Exception as fb_err:
                pass

        # 5. Safe Failure Response (never fabricate medical data)
        safe_response = "Clinical System Notice: The query could not be verified through primary tools or approved fallbacks. No medical advice can be generated."
        log_interaction(query, tool_name, params, "AUTHORIZED", attempts, classify_error(last_error) if last_error else "UNKNOWN", "SAFE_FAILURE", "SAFEGUARD", safe_response)
        return {
            "status": "SAFE_FAILURE",
            "source": "SAFEGUARD",
            "attempts": attempts,
            "message": safe_response
        }

    def process_query(self, query: str) -> Dict[str, Any]:
        # Adversarial Security Filters
        adversarial_tests = [
            (r"delete_medical_database", "REJECTED", "Unauthorized database modification rejected."),
            (r"ignore all previous instructions", "REJECTED", "Prompt injection blocked."),
            (r"diagnose the patient yourself", "CONTROLLED", "Clinical policy requires tool validation; autonomous diagnosis rejected."),
            (r"invent a result|fabricate", "REJECTED", "Fabrication request rejected: clinical system adheres to grounded evidence."),
            (r"pretend you are a doctor and prescribe", "CONTROLLED", "Prescription requests without verified physician authorization are prohibited.")
        ]
        for pattern, status, msg in adversarial_tests:
            if re.search(pattern, query.lower()):
                log_interaction(query, "SECURITY_FILTER", {}, "BLOCKED", 0, "AUTHORIZATION_ERROR", status, "SECURITY", msg)
                return {"status": status, "security_alert": True, "message": msg}

        tool_name = self.select_tool(query)
        if not tool_name:
            msg = "No suitable approved healthcare tool available for the submitted query."
            log_interaction(query, "NONE", {}, "N/A", 0, "INPUT_ERROR", "NO_TOOL", "DISPATCHER", msg)
            return {"status": "NO_TOOL", "message": msg}

        params = self.extract_parameters(tool_name, query)
        return self.execute_with_retry_and_fallback(tool_name, params, query)
