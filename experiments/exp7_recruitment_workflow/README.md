# Experiment 7: Automated Recruitment Workflow System (HR Domain)

## Aim
To design and implement an automated recruitment workflow system that processes candidate application data, enforces input validation and duplicate detection, executes weighted rule-based scoring ($S = 0.40K + 0.30E + 0.30A$), routes applications into review tiers, drafts notifications, and provides human-in-the-loop governance with full audit logging.

## Core Features
1. **Candidate Ingestion & Sanitization**:
   - Parses `candidates.csv`, checking required fields, email syntax, score ranges [0, 100], and unique `candidate_id`.
   - Quarantines invalid or duplicate records into `rejected_records.csv` with logged reasons.
2. **Transparent Weighted Scoring**:
   - Computes overall score out of 100 with documented criteria weights (Skills 40%, Experience 30%, Assessment 30%).
   - Generates criterion-wise score explanations.
3. **Multi-Tier Workflow Routing**:
   - `SHORTLIST_REVIEW` ($\ge 75$)
   - `MANUAL_REVIEW` ($50 - 74.99$)
   - `NOT_SHORTLISTED_REVIEW` ($< 50$)
4. **Human-in-the-Loop Governance**:
   - Authorized reviewer actions (`APPROVE`, `EDIT`, `HOLD`, `REQUEST_INFO`) before any external dispatch.
5. **Notification Drafting**:
   - Creates role-specific professional drafts marked as `DRAFT` without disclosing private internal metrics.
6. **Auditing & Metrics**:
   - Complete execution history in `audit_log.csv`.
   - Computes validation rate, workflow success rate, draft generation rate, and review completion rate.

## How to Run Tests
```bash
python test_recruitment.py
```
