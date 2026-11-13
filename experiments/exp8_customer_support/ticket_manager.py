from datetime import datetime, timezone, timedelta
from uuid import uuid4
from typing import Dict, Any, Optional

ALLOWED_REVIEW_ACTIONS = {
    "APPROVE", "EDIT", "HOLD", "REQUEST_INFORMATION", "ESCALATE", "RESOLVE"
}

def create_ticket(query: Dict[str, Any], classification: Dict[str, str], sla_minutes: int = 60) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    deadline = (now + timedelta(minutes=sla_minutes)).isoformat()

    return {
        "ticket_id": "TKT-" + uuid4().hex[:8].upper(),
        "query_id": query["query_id"],
        "customer_id": query["customer_id"],
        "intent": classification["intent"],
        "complexity": classification["complexity"],
        "priority": classification["priority"],
        "status": "OPEN",
        "created_at": now_iso,
        "updated_at": now_iso,
        "first_response_due": deadline,
        "sla_state": "WITHIN_SLA",
        "assigned_team": "Tier 1 Triage",
        "resolution_summary": None,
        "history": [{"status": "OPEN", "timestamp": now_iso, "actor": "SYSTEM"}]
    }

def transition_ticket(ticket: Dict[str, Any], new_status: str, actor: str = "SYSTEM", note: str = ""):
    ticket["status"] = new_status
    ticket["updated_at"] = datetime.now(timezone.utc).isoformat()
    ticket["history"].append({
        "status": new_status,
        "timestamp": ticket["updated_at"],
        "actor": actor,
        "note": note
    })

def reopen_ticket(ticket: Dict[str, Any], reason: str, actor: str = "CUSTOMER"):
    transition_ticket(ticket, "ASSIGNED", actor=actor, note=f"Reopened: {reason}")

def apply_review_action(ticket: Dict[str, Any], action: str, reviewer_id: str = "AGENT_42") -> Dict[str, Any]:
    if action not in ALLOWED_REVIEW_ACTIONS:
        raise ValueError(f"Invalid review action: {action}")

    ticket["last_reviewer"] = reviewer_id
    ticket["review_action"] = action

    if action == "APPROVE":
        transition_ticket(ticket, "APPROVED_FOR_RESPONSE", actor=reviewer_id)
    elif action == "EDIT":
        transition_ticket(ticket, "IN_REVIEW", actor=reviewer_id)
    elif action == "HOLD":
        transition_ticket(ticket, "ON_HOLD", actor=reviewer_id)
    elif action == "REQUEST_INFORMATION":
        transition_ticket(ticket, "AWAITING_CUSTOMER", actor=reviewer_id)
    elif action == "ESCALATE":
        transition_ticket(ticket, "ESCALATED", actor=reviewer_id)
    elif action == "RESOLVE":
        transition_ticket(ticket, "RESOLVED", actor=reviewer_id)

    return ticket

def check_sla_status(ticket: Dict[str, Any]) -> str:
    now = datetime.now(timezone.utc)
    due = datetime.fromisoformat(ticket["first_response_due"])
    delta_minutes = (due - now).total_seconds() / 60.0

    if delta_minutes < 0:
        status = "BREACHED"
    elif delta_minutes < 15:
        status = "AT_RISK"
    else:
        status = "WITHIN_SLA"

    ticket["sla_state"] = status
    return status
