# Experiment 3: Clinical Research Assistant with Tool Integration

## Aim
To design and implement an intelligent Clinical Research Assistant that selects appropriate healthcare tools, executes structured tool calls using predefined schemas, validates authorization, handles errors through retry and fallback mechanisms, and evaluates system reliability and prompt injection resilience.

## Core Features
1. **Tool Contract & Registry**:
   - Standardized `TOOL_CONTRACT` and centralized `TOOL_REGISTRY`.
   - Predefined tools: `medical_literature_search`, `medical_calculator` (BMI), and `healthcare_knowledge_search`.
2. **Schema & Authorization Validation**:
   - Checks parameter presence and data types prior to dispatch.
   - Enforces `ALLOWED_TOOLS` policy, instantly blocking unauthorized calls (e.g. `delete_medical_database`).
3. **Controlled Retry & Fallback Engine**:
   - Implements up to 3 attempts with exponential delay for transient errors.
   - Automatically pivots to `FALLBACK_TOOLS` upon primary failure.
4. **Safe Failure Principle**:
   - Zero medical hallucination: when tools fail or knowledge is absent, safe fallback responses are returned.
5. **Adversarial Security Suite**:
   - 100% pass rate on adversarial checks (injection, fake diagnosis, fabrication requests, unauthorized tool execution).
6. **Audit & Observability**:
   - Logs query, tool, parameters, authorization, attempts, status, and response in `clinical_research_interaction_log.csv`.

## How to Run Tests
```bash
python test_clinical_assistant.py
```
