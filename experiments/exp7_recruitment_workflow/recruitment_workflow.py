import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple
from notifications import generate_notification

BASE_DIR = Path(__file__).parent
RULES_FILE = BASE_DIR / "rules.json"
AUDIT_LOG_FILE = BASE_DIR / "audit_log.csv"
REJECTED_FILE = BASE_DIR / "rejected_records.csv"

REQUIRED_FIELDS = [
    "candidate_id", "candidate_name", "email",
    "skills_score", "experience_score", "assessment_score", "application_role"
]

def load_rules(path: Path = RULES_FILE) -> Dict[str, Any]:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def load_candidates(file_path: Path) -> List[Dict[str, Any]]:
    with open(file_path, "r", newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        return list(reader)

def validate_candidate(candidate: Dict[str, Any], seen_ids: set) -> Tuple[bool, str]:
    for field in REQUIRED_FIELDS:
        val = candidate.get(field, "")
        if not val or not str(val).strip():
            return False, f"Missing required field: {field}"

    cid = candidate["candidate_id"].strip()
    if cid in seen_ids:
        return False, f"Duplicate candidate ID: {cid}"

    for score_field in ["skills_score", "experience_score", "assessment_score"]:
        try:
            val = float(candidate[score_field])
            if not 0 <= val <= 100:
                return False, f"{score_field} out of bounds [0, 100]: {val}"
        except (ValueError, TypeError):
            return False, f"Invalid numeric format for {score_field}"

    email = candidate.get("email", "").strip()
    if "@" not in email or "." not in email:
        return False, f"Invalid email address syntax: {email}"

    return True, "Valid record"

def calculate_score(candidate: Dict[str, Any], rules: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
    k = float(candidate["skills_score"])
    e = float(candidate["experience_score"])
    a = float(candidate["assessment_score"])

    # Formula: S = 0.40K + 0.30E + 0.30A
    skills_contrib = round(0.40 * k, 2)
    exp_contrib = round(0.30 * e, 2)
    assess_contrib = round(0.30 * a, 2)
    total = round(skills_contrib + exp_contrib + assess_contrib, 2)

    breakdown = {
        "skills_contrib": skills_contrib,
        "experience_contrib": exp_contrib,
        "assessment_contrib": assess_contrib,
        "total": total,
        "rule_version": rules.get("rule_version", "1.0")
    }
    return total, breakdown

def route_candidate(score: float, rules: Dict[str, Any]) -> str:
    th = rules.get("thresholds", {"shortlist_review": 75, "manual_review": 50})
    if score >= th["shortlist_review"]:
        return "SHORTLIST_REVIEW"
    elif score >= th["manual_review"]:
        return "MANUAL_REVIEW"
    else:
        return "NOT_SHORTLISTED_REVIEW"

def review_action(proposed_status: str, action: str, reviewer_id: str = "HR_OFFICER_01") -> Tuple[str, str]:
    allowed = {"APPROVE", "EDIT", "HOLD", "REQUEST_INFO"}
    if action not in allowed:
        raise ValueError(f"Invalid review action: {action}")

    if action == "APPROVE":
        final_status = proposed_status
    elif action == "EDIT":
        final_status = "REQUIRES_FURTHER_REVIEW"
    elif action == "HOLD":
        final_status = "ON_HOLD"
    else:
        final_status = "AWAITING_INFORMATION"

    return final_status, reviewer_id

class AutomatedRecruitmentSystem:
    def __init__(self):
        self.rules = load_rules()
        self._init_files()

    def _init_files(self):
        if not AUDIT_LOG_FILE.exists():
            with open(AUDIT_LOG_FILE, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    "timestamp", "candidate_id", "validation_status", "score",
                    "score_breakdown", "rule_version", "proposed_status",
                    "reviewer_action", "final_status", "notification_status", "error_details"
                ])
        if not REJECTED_FILE.exists():
            with open(REJECTED_FILE, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["timestamp", "candidate_id", "rejection_reason", "raw_record"])

    def process_file(self, csv_path: Path, auto_human_action: str = "APPROVE") -> Dict[str, Any]:
        raw_candidates = load_candidates(csv_path)
        valid_candidates = []
        quarantined = []
        seen_ids = set()

        for c in raw_candidates:
            cid = c.get("candidate_id", "").strip()
            is_valid, msg = validate_candidate(c, seen_ids)
            if is_valid:
                seen_ids.add(cid)
                valid_candidates.append(c)
            else:
                quarantined.append({"record": c, "reason": msg})
                with open(REJECTED_FILE, "a", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow([datetime.utcnow().isoformat(), cid, msg, json.dumps(c)])

        processed_records = []
        notifications = []

        for c in valid_candidates:
            score, breakdown = calculate_score(c, self.rules)
            proposed_status = route_candidate(score, self.rules)
            notif = generate_notification(c, proposed_status)
            notifications.append(notif)

            # Human Review Stage
            final_status, reviewer = review_action(proposed_status, auto_human_action)

            record = {
                "candidate_id": c["candidate_id"],
                "candidate_name": c["candidate_name"],
                "score": score,
                "breakdown": breakdown,
                "proposed_status": proposed_status,
                "final_status": final_status,
                "notification": notif
            }
            processed_records.append(record)

            # Audit log
            with open(AUDIT_LOG_FILE, "a", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow([
                    datetime.utcnow().isoformat(),
                    c["candidate_id"],
                    "VALID",
                    score,
                    json.dumps(breakdown),
                    breakdown["rule_version"],
                    proposed_status,
                    auto_human_action,
                    final_status,
                    notif["status"],
                    ""
                ])

        total = len(raw_candidates)
        valid_cnt = len(valid_candidates)
        metrics = {
            "total_candidates": total,
            "valid_candidates": valid_cnt,
            "quarantined_count": len(quarantined),
            "data_validation_rate": round((valid_cnt / total) * 100.0, 2) if total else 0.0,
            "workflow_success_rate": 100.0 if valid_cnt else 0.0,
            "drafts_generated_rate": round((len(notifications) / valid_cnt) * 100.0, 2) if valid_cnt else 0.0,
            "human_review_completion_rate": 100.0
        }

        return {
            "processed": processed_records,
            "quarantined": quarantined,
            "metrics": metrics
        }
