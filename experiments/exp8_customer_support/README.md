# Experiment 8: Intelligent Customer Support System with Escalation (SaaS Domain)

## Aim
To design and implement an Intelligent Customer Support System with Escalation that ingests customer queries, validates fields, classifies queries across three dimensions (Intent, Complexity, Priority), retrieves grounded responses from an approved knowledge base, routes issues through human-in-the-loop workflows, manages ticket lifecycle state machines, tracks SLA deadlines, and dispatches notifications with exponential retry logic.

## Core Features
1. **Query Ingestion & Validation**:
   - Parses `customer_queries.csv`. Rejects empty queries, missing fields, or duplicate IDs.
2. **Three-Dimensional Classification**:
   - **Intent**: Login / Access, Billing, Technical Error, Feature Request, General Information, Unresolved Issue.
   - **Complexity**: Low, Medium, High.
   - **Priority**: P1 (Critical), P2 (High), P3 (Normal), P4 (Low).
   - Precedence: P1 outages and security events override standard workflows.
3. **Approved Knowledge Base & Matching**:
   - Calculates heuristic match score ($C = 100 \times \frac{\text{matched}}{\text{total}}$) against `knowledge_base.json`.
4. **Adaptive Routing Engine**:
   - `PROPOSE_AUTO_RESOLUTION`: High match score ($\ge 70\%$) & Low complexity.
   - `HUMAN_REVIEW`: Moderate match score ($40 - 69.99\%$).
   - `URGENT_HUMAN_ESCALATION`: P1 Outages / Security incidents.
   - `CREATE_TICKET_AND_ESCALATE`: No approved article or high technical complexity.
5. **Ticket Lifecycle State Machine**:
   - `OPEN` $\rightarrow$ `TRIAGED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`.
   - Supports human review actions (`APPROVE`, `EDIT`, `HOLD`, `ESCALATE`, `RESOLVE`) and customer reopening.
6. **SLA Monitoring**:
   - Tracks configurable SLA deadlines based on priority ($P1: 15m, P2: 60m, P3: 240m, P4: 1440m$).
   - Alerts on `WITHIN_SLA`, `AT_RISK`, and `BREACHED` tickets.
7. **Exponential Backoff Notification Retries**:
   - Automatically handles transient transmission errors up to 3 attempts.
8. **Audit Logging**:
   - Records all events, routing decisions, and status transitions in `audit_log.csv`.

## How to Run Tests
```bash
python test_support.py
```
