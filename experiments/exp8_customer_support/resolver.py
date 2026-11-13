import json
from pathlib import Path
from typing import Dict, Any, Tuple, Optional, List

KB_FILE = Path(__file__).parent / "knowledge_base.json"

def load_knowledge_base(path: Path = KB_FILE) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def retrieve_article(query_text: str, knowledge_base: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], float]:
    text = query_text.lower()
    matches = []

    for article in knowledge_base:
        if not article.get("approved", False):
            continue
        keywords = article.get("keywords", [])
        matched = [kw for kw in keywords if kw.lower() in text]
        if matched:
            score = (len(matched) / len(keywords)) * 100.0
            matches.append((score, article))

    if not matches:
        return None, 0.0

    matches.sort(key=lambda x: x[0], reverse=True)
    return matches[0][1], round(matches[0][0], 2)

def route_query(classification: Dict[str, str], match_score: float, article_found: bool) -> str:
    priority = classification["priority"]
    complexity = classification["complexity"]

    # Security & P1 triggers override all knowledge matches
    if priority == "P1":
        return "URGENT_HUMAN_ESCALATION"
    if complexity == "High":
        return "TECHNICAL_HUMAN_REVIEW"
    if not article_found:
        return "CREATE_TICKET_AND_ESCALATE"
    if match_score >= 70.0 and complexity == "Low":
        return "PROPOSE_AUTO_RESOLUTION"
    if match_score >= 40.0:
        return "HUMAN_REVIEW"
    return "REQUEST_INFORMATION_OR_ESCALATE"
