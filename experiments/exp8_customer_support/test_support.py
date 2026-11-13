import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path
from customer_support import IntelligentCustomerSupportSystem, ingest_queries, AUDIT_LOG_FILE
from classifier import classify_query
from ticket_manager import create_ticket, apply_review_action, reopen_ticket, check_sla_status
from notifications import send_with_retry

CSV_FILE = Path(__file__).parent / "customer_queries.csv"

class TestCustomerSupportSystem(unittest.TestCase):
    def setUp(self):
        self.system = IntelligentCustomerSupportSystem()

    def test_query_ingestion_and_validation(self):
        valid, rejected = ingest_queries(CSV_FILE)
        self.assertGreater(len(valid), 8)
        # Empty query (Q011) and duplicate ID (Q001) should be in rejected
        self.assertGreaterEqual(len(rejected), 2)
        err_types = [r["errors"][0] for r in rejected]
        self.assertTrue(any("Empty query" in e for e in err_types))
        self.assertTrue(any("Duplicate query ID" in e for e in err_types))

    def test_classification_dimensions(self):
        # Normal login
        c_login = classify_query("I cannot log in to my account")
        self.assertEqual(c_login["intent"], "Login / Access")
        self.assertEqual(c_login["priority"], "P2")

        # Critical outage
        c_outage = classify_query("The application is down for all users service outage")
        self.assertEqual(c_outage["intent"], "Technical Error")
        self.assertEqual(c_outage["priority"], "P1")

        # Feature request
        c_feat = classify_query("Can you add dark mode to dashboard?")
        self.assertEqual(c_feat["intent"], "Feature Request")
        self.assertEqual(c_feat["priority"], "P4")

    def test_p1_outage_urgent_escalation(self):
        res = self.system.process_query({
            "query_id": "TEST_P1",
            "customer_id": "C_VIP",
            "query_text": "Critical data breach and application is down for all users",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.assertEqual(res["classification"]["priority"], "P1")
        self.assertEqual(res["route"], "URGENT_HUMAN_ESCALATION")
        self.assertEqual(res["ticket"]["status"], "ESCALATED_P1")

    def test_auto_resolution_route(self):
        res = self.system.process_query({
            "query_id": "TEST_KB",
            "customer_id": "C_REG",
            "query_text": "What features are included in the basic plan subscription?",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.assertGreaterEqual(res["match_score"], 70.0)
        self.assertEqual(res["route"], "PROPOSE_AUTO_RESOLUTION")
        self.assertIsNotNone(res["ticket"]["resolution_summary"])

    def test_ticket_lifecycle_and_reopen(self):
        ticket = create_ticket(
            {"query_id": "Q_TKT", "customer_id": "C_TKT"},
            {"intent": "Billing", "complexity": "Medium", "priority": "P2"}
        )
        self.assertEqual(ticket["status"], "OPEN")

        # Review action ESCALATE
        apply_review_action(ticket, "ESCALATE")
        self.assertEqual(ticket["status"], "ESCALATED")

        # Reopen ticket
        reopen_ticket(ticket, "Customer replies: payment still not credited")
        self.assertEqual(ticket["status"], "ASSIGNED")
        self.assertIn("Reopened", ticket["history"][-1]["note"])

    def test_notification_delivery_with_retries(self):
        attempts_counter = [0]
        def flaky_send():
            attempts_counter[0] += 1
            if attempts_counter[0] < 3:
                return False
            return True

        res = send_with_retry(flaky_send, max_attempts=3)
        self.assertEqual(res["status"], "SENT")
        self.assertEqual(res["attempts"], 3)

    def test_sla_breach_detection(self):
        ticket = create_ticket(
            {"query_id": "Q_SLA", "customer_id": "C_SLA"},
            {"intent": "Technical Error", "complexity": "High", "priority": "P1"},
            sla_minutes=-10 # already in the past
        )
        status = check_sla_status(ticket)
        self.assertEqual(status, "BREACHED")

    def test_audit_log_populated(self):
        self.system.process_query({
            "query_id": "Q_LOG",
            "customer_id": "C_LOG",
            "query_text": "How can I upgrade my subscription?",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        self.assertTrue(AUDIT_LOG_FILE.exists())

if __name__ == "__main__":
    unittest.main()
