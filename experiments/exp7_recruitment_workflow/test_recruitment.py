import unittest
from pathlib import Path
from recruitment_workflow import (
    AutomatedRecruitmentSystem, calculate_score, route_candidate,
    review_action, load_rules, AUDIT_LOG_FILE, REJECTED_FILE
)

CSV_FILE = Path(__file__).parent / "candidates.csv"

class TestRecruitmentWorkflow(unittest.TestCase):
    def setUp(self):
        self.system = AutomatedRecruitmentSystem()
        self.rules = load_rules()

    def test_weighted_scoring_formula(self):
        # Candidate C101: skills=85, exp=70, assess=90 -> 82.0
        candidate = {
            "skills_score": 85,
            "experience_score": 70,
            "assessment_score": 90
        }
        score, breakdown = calculate_score(candidate, self.rules)
        self.assertEqual(score, 82.0)
        self.assertEqual(breakdown["skills_contrib"], 34.0)
        self.assertEqual(breakdown["experience_contrib"], 21.0)
        self.assertEqual(breakdown["assessment_contrib"], 27.0)

    def test_routing_thresholds_and_boundaries(self):
        # >= 75 -> SHORTLIST_REVIEW
        self.assertEqual(route_candidate(82.0, self.rules), "SHORTLIST_REVIEW")
        self.assertEqual(route_candidate(75.0, self.rules), "SHORTLIST_REVIEW")

        # 50 - 74.99 -> MANUAL_REVIEW
        self.assertEqual(route_candidate(74.99, self.rules), "MANUAL_REVIEW")
        self.assertEqual(route_candidate(50.0, self.rules), "MANUAL_REVIEW")

        # < 50 -> NOT_SHORTLISTED_REVIEW
        self.assertEqual(route_candidate(49.99, self.rules), "NOT_SHORTLISTED_REVIEW")
        self.assertEqual(route_candidate(35.0, self.rules), "NOT_SHORTLISTED_REVIEW")

    def test_human_review_actions(self):
        status, reviewer = review_action("SHORTLIST_REVIEW", "APPROVE")
        self.assertEqual(status, "SHORTLIST_REVIEW")

        status_edit, _ = review_action("SHORTLIST_REVIEW", "EDIT")
        self.assertEqual(status_edit, "REQUIRES_FURTHER_REVIEW")

        status_hold, _ = review_action("SHORTLIST_REVIEW", "HOLD")
        self.assertEqual(status_hold, "ON_HOLD")

    def test_pipeline_execution_and_quarantine(self):
        res = self.system.process_file(CSV_FILE)
        metrics = res["metrics"]
        self.assertEqual(metrics["total_candidates"], 12)
        # Invalid records: missing email (C106), score 120 (C107), duplicate ID (C101) = 3
        self.assertEqual(metrics["quarantined_count"], 3)
        self.assertEqual(metrics["valid_candidates"], 9)
        self.assertEqual(metrics["data_validation_rate"], 75.0)

    def test_audit_and_rejected_logs_exist(self):
        self.system.process_file(CSV_FILE)
        self.assertTrue(AUDIT_LOG_FILE.exists())
        self.assertTrue(REJECTED_FILE.exists())

if __name__ == "__main__":
    unittest.main()
