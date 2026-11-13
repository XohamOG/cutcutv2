#!/usr/bin/env python3
"""
Master Test Runner for all Lab Experiments (Exp-1 to Exp-8)
Agentic AI Engineering & Enterprise Automation Lab (26CMPC72)
"""

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).parent

EXPERIMENTS = [
    ("Exp 1: Deterministic Academic Tutoring System", "exp1_deterministic_tutor", "test_tutor.py"),
    ("Exp 2: Agent-Driven Financial Advisory System", "exp2_financial_advisor", "test_advisor.py"),
    ("Exp 3: Clinical Research Assistant with Tool Integration", "exp3_clinical_assistant", "test_clinical_assistant.py"),
    ("Exp 4: Legal Document Intelligence & Retrieval System (RAG)", "exp4_legal_doc_rag", "test_legal_rag.py"),
    ("Exp 5: E-Commerce Product Analysis Multi-Agent Pipeline", "exp5_ecommerce_orchestrator", "test_ecommerce.py"),
    ("Exp 6: Developer Automation System using MCP Protocol", "exp6_mcp_developer", "test_mcp_developer.py"),
    ("Exp 7: Automated Recruitment Workflow System (HR Domain)", "exp7_recruitment_workflow", "test_recruitment.py"),
    ("Exp 8: Intelligent Customer Support with Escalation", "exp8_customer_support", "test_support.py"),
]

def run_suite():
    print("=" * 80)
    print("RUNNING ALL LAB EXPERIMENT TEST SUITES (26CMPC72)")
    print("=" * 80)

    total = len(EXPERIMENTS)
    passed = 0
    results = []

    for title, folder, test_file in EXPERIMENTS:
        target_dir = BASE_DIR / folder
        cmd = [sys.executable, test_file]
        print(f"\n[RUNNING] {title}...")
        try:
            res = subprocess.run(
                cmd,
                cwd=str(target_dir),
                capture_output=True,
                text=True,
                timeout=30
            )
            if res.returncode == 0:
                print(f"[PASSED]  {title}")
                passed += 1
                results.append((title, "PASSED", res.stdout.strip() or res.stderr.strip()))
            else:
                print(f"[FAILED]  {title}")
                print(res.stderr or res.stdout)
                results.append((title, "FAILED", res.stderr.strip() or res.stdout.strip()))
        except Exception as e:
            print(f"[ERROR]   {title}: {e}")
            results.append((title, "ERROR", str(e)))

    print("\n" + "=" * 80)
    print("EXPERIMENT VERIFICATION SUMMARY")
    print("=" * 80)
    for title, status, _ in results:
        indicator = "[PASS]" if status == "PASSED" else "[FAIL]"
        print(f"{indicator} {title}")

    print(f"\nTotal: {passed}/{total} Experiments Passed ({round((passed/total)*100, 1)}%)")
    print("=" * 80)

    if passed == total:
        print("ALL LAB EXPERIMENTS VERIFIED SUCCESSFULLY!\n")
        return 0
    return 1

if __name__ == "__main__":
    sys.exit(run_suite())
