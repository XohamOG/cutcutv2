import time
import random
from typing import Dict, Any, Tuple, Optional
from tool_contracts import ALLOWED_TOOLS, TOOL_SCHEMAS, FALLBACK_TOOLS

# Synthetic literature & knowledge databases
MEDICAL_LITERATURE_DB = [
    {"id": "PUB101", "title": "Type 2 Diabetes Mellitus: Comprehensive Review", "year": 2024, "summary": "Review of metformin and SGLT2 inhibitors."},
    {"id": "PUB102", "title": "Hypertension Guidelines and Clinical Outcomes", "year": 2023, "summary": "Evaluation of ACE inhibitors and lifestyle intervention."}
]

HEALTHCARE_KB = {
    "diabetes": "Diabetes mellitus is a metabolic disorder characterized by sustained elevated blood glucose levels due to insulin deficiency or resistance.",
    "hypertension": "Hypertension is a chronic medical condition where arterial blood pressure is persistently elevated above 130/80 mmHg.",
    "asthma": "Asthma is a chronic inflammatory disorder of the airways causing recurrent episodes of wheezing, breathlessness, and coughing."
}

def medical_calculator(operation: str, weight_kg: float, height_m: float) -> Dict[str, Any]:
    if operation.upper() == "BMI":
        if height_m <= 0 or weight_kg <= 0:
            raise ValueError("Height and weight must be strictly positive numbers.")
        bmi = weight_kg / (height_m ** 2)
        if bmi < 18.5:
            cat = "Underweight"
        elif bmi < 25.0:
            cat = "Normal weight"
        elif bmi < 30.0:
            cat = "Overweight"
        else:
            cat = "Obese"
        return {"operation": "BMI", "bmi": round(bmi, 2), "category": cat}
    raise ValueError(f"Unsupported clinical calculator operation: {operation}")

def medical_literature_search(query: str, year_from: int = 2020, max_results: int = 5) -> Dict[str, Any]:
    q = query.lower()
    matches = [
        item for item in MEDICAL_LITERATURE_DB
        if item["year"] >= year_from and any(w in item["title"].lower() or w in item["summary"].lower() for w in q.split())
    ]
    return {"query": query, "year_from": year_from, "count": len(matches[:max_results]), "results": matches[:max_results]}

def healthcare_knowledge_search(query: str) -> Dict[str, Any]:
    q = query.lower()
    for key, text in HEALTHCARE_KB.items():
        if key in q:
            return {"topic": key, "found": True, "information": text}
    return {"topic": query, "found": False, "information": "No verified healthcare record found in controlled knowledge base."}

# Unreliable tool for demonstrating transient retries & fallback
_failure_counter = {"unreliable": 0}

def unreliable_medical_tool(query: str) -> Dict[str, Any]:
    _failure_counter["unreliable"] += 1
    # Simulates transient failure on attempts 1 and 2, fails persistently to trigger fallback
    raise TimeoutError("Remote medical database connection timed out (Transient Error).")

TOOL_REGISTRY = {
    "medical_calculator": medical_calculator,
    "medical_literature_search": medical_literature_search,
    "healthcare_knowledge_search": healthcare_knowledge_search,
    "unreliable_medical_tool": unreliable_medical_tool
}

def validate_tool_schema(tool_name: str, params: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    schema = TOOL_SCHEMAS.get(tool_name)
    if not schema:
        return False, f"Unknown schema for tool: {tool_name}"
    for req in schema["required"]:
        if req not in params:
            return False, f"Missing required parameter '{req}' for tool '{tool_name}'."
    for key, val in params.items():
        if key in schema["types"]:
            expected_type = schema["types"][key]
            if not isinstance(val, expected_type):
                return False, f"Type mismatch for parameter '{key}': expected {expected_type}, got {type(val)}."
    return True, None

def classify_error(err: Exception) -> str:
    if isinstance(err, (ValueError, KeyError, TypeError)):
        return "INPUT_ERROR"
    if isinstance(err, (TimeoutError, ConnectionError)):
        return "TRANSIENT_ERROR"
    if isinstance(err, PermissionError):
        return "AUTHORIZATION_ERROR"
    return "SERVICE_ERROR"
