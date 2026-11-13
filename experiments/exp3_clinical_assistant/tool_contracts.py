from typing import Dict, Any, Optional

TOOL_CONTRACT = {
    "tool_name": "",
    "parameters": {},
    "status": "READY",
    "result": None,
    "error": None
}

ALLOWED_TOOLS = {
    "medical_literature_search",
    "medical_calculator",
    "healthcare_knowledge_search"
}

FALLBACK_TOOLS = {
    "unreliable_medical_tool": "healthcare_knowledge_search",
    "medical_literature_search": "healthcare_knowledge_search"
}

TOOL_SCHEMAS = {
    "medical_calculator": {
        "required": ["operation", "weight_kg", "height_m"],
        "types": {
            "operation": str,
            "weight_kg": (int, float),
            "height_m": (int, float)
        }
    },
    "medical_literature_search": {
        "required": ["query"],
        "types": {
            "query": str,
            "year_from": int,
            "max_results": int
        }
    },
    "healthcare_knowledge_search": {
        "required": ["query"],
        "types": {
            "query": str
        }
    }
}
