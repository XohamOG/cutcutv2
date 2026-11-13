# Experiment 2: Agent-Driven Financial Advisory System

## Aim
To design and implement an agent-driven financial advisory system that retrieves stock-market data, calculates percentage changes, applies predefined rule-based BUY/SELL/HOLD decisions, calculates risk and confidence metrics, records interactions, and evaluates prompt-injection resilience.

## Core Features
1. **Deterministic Rule Engine**:
   - `> +2.0%` -> `BUY`
   - `< -2.0%` -> `SELL`
   - `[-2.0%, +2.0%]` -> `HOLD`
2. **Multi-Indicator & Risk Analysis**:
   - Computes 20-period Simple Moving Average (SMA) alignment and trading volume surge.
   - Outputs Risk Level (`Low`, `Medium`, `High`) and Confidence Score (0-100%).
3. **Adversarial Prompt-Injection Resilience**:
   - Untrusted user instructions are blocked from overriding the trusted rule engine output.
4. **Portfolio-Level Analysis**:
   - Scans multiple tickers and tabulates BUY/HOLD/SELL distributions.
5. **Audit Logging**:
   - Persists all executions and parameters in `financial_log.csv`.

## How to Run Tests
```bash
python test_advisor.py
```
