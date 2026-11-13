# Experiment 5: E-Commerce Product Analysis & Recommendation Multi-Agent Pipeline

## Aim
To design and implement a multi-agent e-commerce recommendation system in which specialized agents (Planner, Router, Search, Filter, Comparison, Ranking, Validator, Supervisor) collaborate via shared state to decompose natural-language requirements, execute sequential and parallel workflows, enforce validation, and incorporate human-in-the-loop approval.

## Multi-Agent Architecture
1. **Planner Agent**: Performs query decomposition, extracting category, budget, RAM, storage, and rating.
2. **Router Agent**: Routes decomposed subtasks to appropriate worker agents.
3. **Search Agent**: Queries catalog database (`products.json`).
4. **Filter Agent**: Enforces strict inequality constraint boundaries.
5. **Comparison Agent**: Analyzes specifications and price-performance ratios.
6. **Ranking Agent**: Computes transparent multi-factor weighted scores.
7. **Validator Agent**: Verifies that ranked outputs satisfy all initial customer constraints.
8. **Supervisor Agent & Human Gate**: Coordinates final approval (`APPROVE`, `REJECT`) before issuing recommendations.

## Shared Workflow State & Observability
- Maintains unified state (`workflow_id`, `trace`, `metrics`, `ranking`, `human_approval`).
- Records metrics including agent calls, tool invocations, duration, and parallel speedup.

## How to Run Tests
```bash
python test_ecommerce.py
```
