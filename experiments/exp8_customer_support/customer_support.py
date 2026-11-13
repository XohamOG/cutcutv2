import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Tuple
from classifier import classify_query
from resolver import load_knowledge_base, retrieve_article, route_query
from ticket_manager import create_ticket, transition_ticket, apply_review_action, check_sla_status
from notifications import generate_notification, send_with_retry

BASE_DIR = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "config.json"
AUDIT_LOG_FILE = BASE_DIR / "audit_log.csv"

REQUIRED_FIELDS = {"query_id", "customer_id", "query_text", "created_at"}

def load_config() -> Dict[str, Any]:
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def ingest_queries(file_path: Path) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    valid_queries = []
    rejected_queries = []
    seen_ids = set()

    with open(file_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            row = {k: (v or "").strip() for k, v in row.items()}
            errors = []
            for f in REQUIRED_FIELDS:
                if f not in row:
                    errors.append(f"Missing required field: {f}")
            qid = row.get("query_id", "")
            if qid in seen_ids:
                errors.append("Duplicate query ID")
            else:
                seen_ids.add(qid)
            if not row.get("query_text", "").strip():
                errors.append("Empty query")

            if errors:
                rejected_queries.append({"record": row, "errors": errors})
            else:
                valid_queries.append(row)

    return valid_queries, rejected_queries

class IntelligentCustomerSupportSystem:
    def __init__(self):
        self.config = load_config()
        self.kb = load_knowledge_base()
        self._init_audit_log()

    def _init_audit_log(self):
        if not AUDIT_LOG_FILE.exists():
            with open(AUDIT_LOG_FILE, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "timestamp", "query_id", "ticket_id", "event_type",
                    "intent", "priority", "match_score", "route", "ticket_status"
                ])

    def log_audit(self, query_id: str, ticket_id: str, event_type: str, intent: str, priority: str, score: float, route: str, status: str):
        with open(AUDIT_LOG_FILE, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                datetime.now(timezone.utc).isoformat(), query_id, ticket_id,
                event_type, intent, priority, score, route, status
            ])

    def process_query(self, query: Dict[str, Any]) -> Dict[str, Any]:
        classification = classify_query(query["query_text"])
        article, match_score = retrieve_article(query["query_text"], self.kb)
        route = route_query(classification, match_score, article is not None)

        prio = classification["priority"]
        sla_mins = self.config.get("sla_minutes", {}).get(prio, 60)
        ticket = create_ticket(query, classification, sla_minutes=sla_mins)

        if route == "PROPOSE_AUTO_RESOLUTION":
            ticket["status"] = "PROPOSED_AUTO_RESOLUTION"
            ticket["resolution_summary"] = article["response"] if article else None
        elif route == "URGENT_HUMAN_ESCALATION":
            ticket["status"] = "ESCALATED_P1"
            ticket["assigned_team"] = "Critical Incident Team"
        else:
            ticket["status"] = "ESCALATED"
            ticket["assigned_team"] = "Support Engineering"

        self.log_audit(
            query["query_id"], ticket["ticket_id"], "TRIAGE_AND_ROUTE",
            classification["intent"], prio, match_score, route, ticket["status"]
        )

        notif = generate_notification(ticket, "CREATED")
        return {
            "query_id": query["query_id"],
            "classification": classification,
            "article": article,
            "match_score": match_score,
            "route": route,
            "ticket": ticket,
            "notification": notif
        }
