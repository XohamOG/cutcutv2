# Experiment 1: Deterministic Academic Tutoring System

## Aim
To design and implement a deterministic tutoring agent that answers predefined academic questions using rule-based logic and response templates, ensuring identical outputs for identical inputs without relying on probabilistic LLMs.

## Core Features
1. **Deterministic Contracts**: Ensures identical outputs for identical queries without hallucination.
2. **Clarification Agent**: Detects ambiguous queries (e.g., "tree") and prompts for clarification before answering.
3. **Prompt Injection Guardrails**: Blocks malicious input attempts (e.g., "ignore all previous instructions").
4. **Structured Self-Reflection**: Validates required schema fields (`topic`, `definition`, `algorithm`, `complexity`, `example`, `summary`).
5. **Auditing & Logging**: Records each query, detected intent, response time, and status in SQLite `database.db`.

## How to Run Tests
```bash
python test_tutor.py
```
