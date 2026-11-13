import json
import re
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from logger import log_interaction

TEMPLATES_PATH = Path(__file__).parent / "templates.json"

ADVERSARIAL_INJECTION_PATTERNS = [
    r"ignore (all )?previous instructions",
    r"system prompt",
    r"reveal prompt",
    r"override rules",
    r"bypass security",
    r"you are now a",
    r"pretend to be",
    r"forget your instructions"
]

REQUIRED_RESPONSE_FIELDS = ["topic", "definition", "algorithm", "complexity", "example", "summary"]

class DeterministicTutorAgent:
    def __init__(self, templates_path: Path = TEMPLATES_PATH):
        with open(templates_path, "r", encoding="utf-8") as f:
            self.kb = json.load(f)
        self.default_fallback = self.kb.get("default_fallback", "Sorry, I can answer only predefined academic questions.")
        self.clarifications = self.kb.get("clarifications", [])
        self.topics = self.kb.get("topics", [])
        self.conversation_context: list = []

    def check_prompt_injection(self, text: str) -> bool:
        lower = text.lower()
        for pattern in ADVERSARIAL_INJECTION_PATTERNS:
            if re.search(pattern, lower):
                return True
        return False

    def check_clarification_needed(self, text: str) -> Optional[str]:
        words = set(re.findall(r"\w+", text.lower()))
        for item in self.clarifications:
            term = item["ambiguous_term"].lower()
            if term in words and len(words) <= 3:
                return item["clarification_question"]
        return None

    def detect_intent(self, text: str) -> Optional[Dict[str, Any]]:
        lower = text.lower()
        for item in self.topics:
            for kw in item["keywords"]:
                if kw in lower:
                    return item
        return None

    def validate_response(self, response_data: Dict[str, Any]) -> Tuple[bool, str]:
        for field in REQUIRED_RESPONSE_FIELDS:
            if field not in response_data or not str(response_data[field]).strip():
                return False, f"Missing required response contract field: {field}"
        return True, "Valid"

    def format_structured_contract(self, topic_data: Dict[str, Any]) -> str:
        # Enforce deterministic, repeatable structured output
        contract = {
            "topic": topic_data["topic"],
            "definition": topic_data["definition"],
            "algorithm": topic_data["algorithm"],
            "complexity": topic_data["complexity"],
            "example": topic_data["example"],
            "summary": topic_data["summary"]
        }
        valid, msg = self.validate_response(contract)
        if not valid:
            raise ValueError(f"Self-reflection check failed: {msg}")
        return json.dumps(contract, indent=2)

    def answer_query(self, query: str) -> Dict[str, Any]:
        start_time = time.time()

        # Step 1: Adversarial Prompt Injection Defense
        if self.check_prompt_injection(query):
            response = "Security Alert: Adversarial prompt injection detected. Request rejected to preserve system boundaries."
            elapsed_ms = (time.time() - start_time) * 1000
            log_interaction(query, "ADVERSARIAL_INJECTION", elapsed_ms, response, status="BLOCKED")
            return {
                "status": "BLOCKED",
                "intent": "ADVERSARIAL_INJECTION",
                "response": response,
                "response_time_ms": round(elapsed_ms, 2)
            }

        # Step 2: Clarification Agent Check
        clarification = self.check_clarification_needed(query)
        if clarification:
            elapsed_ms = (time.time() - start_time) * 1000
            log_interaction(query, "CLARIFICATION_NEEDED", elapsed_ms, clarification, status="CLARIFY")
            return {
                "status": "CLARIFY",
                "intent": "CLARIFICATION_NEEDED",
                "response": clarification,
                "response_time_ms": round(elapsed_ms, 2)
            }

        # Step 3: Intent Detection & Knowledge Retrieval
        matched_topic = self.detect_intent(query)
        if not matched_topic:
            elapsed_ms = (time.time() - start_time) * 1000
            log_interaction(query, "UNKNOWN_INTENT", elapsed_ms, self.default_fallback, status="FALLBACK")
            return {
                "status": "FALLBACK",
                "intent": "UNKNOWN_INTENT",
                "response": self.default_fallback,
                "response_time_ms": round(elapsed_ms, 2)
            }

        # Step 4: Deterministic Generation with Retry and Validation
        attempts = 0
        max_retries = 2
        formatted_response = ""
        while attempts <= max_retries:
            attempts += 1
            try:
                formatted_response = self.format_structured_contract(matched_topic)
                break
            except Exception as e:
                if attempts > max_retries:
                    formatted_response = self.default_fallback

        elapsed_ms = (time.time() - start_time) * 1000
        log_interaction(query, matched_topic["intent"], elapsed_ms, formatted_response, status="SUCCESS")
        return {
            "status": "SUCCESS",
            "intent": matched_topic["intent"],
            "response": formatted_response,
            "response_time_ms": round(elapsed_ms, 2)
        }
