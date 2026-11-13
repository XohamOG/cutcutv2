import time
from typing import Dict, Any, Callable

def generate_notification(ticket: Dict[str, Any], event: str) -> Dict[str, Any]:
    tid = ticket["ticket_id"]
    templates = {
        "CREATED": f"Customer Notice: Support ticket {tid} has been received and logged.",
        "ESCALATED": f"Urgent Internal Alert: Ticket {tid} requires senior specialist escalation.",
        "RESOLVED": f"Customer Notice: Ticket {tid} has been marked as resolved by support team.",
        "SLA_BREACH": f"Operations Alert: Ticket {tid} has breached its guaranteed SLA deadline."
    }
    return {
        "ticket_id": tid,
        "event": event,
        "message": templates.get(event, f"Ticket {tid} updated."),
        "status": "DRAFT"
    }

def send_with_retry(
    send_function: Callable[[], bool],
    max_attempts: int = 3,
    base_delay_sec: float = 0.05
) -> Dict[str, Any]:
    for attempt in range(1, max_attempts + 1):
        try:
            success = send_function()
            if success:
                return {"status": "SENT", "attempts": attempt}
            raise RuntimeError("Transient network transport error")
        except Exception as err:
            if attempt == max_attempts:
                return {"status": "FAILED", "attempts": attempt, "error": str(err)}
            time.sleep(base_delay_sec * (2 ** (attempt - 1)))
    return {"status": "FAILED", "attempts": max_attempts, "error": "Max retries exhausted"}
