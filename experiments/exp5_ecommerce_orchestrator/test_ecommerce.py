import unittest
from orchestrator import EcommerceMultiAgentOrchestrator

class TestEcommerceMultiAgentPipeline(unittest.TestCase):
    def setUp(self):
        self.orchestrator = EcommerceMultiAgentOrchestrator()

    def test_query_decomposition_and_requirements(self):
        query = "Find laptops under 70000 with at least 16 GB RAM, 512 GB storage and rating above 4.2"
        state = self.orchestrator.run_sequential(query)
        req = state.requirements
        self.assertEqual(req["category"], "laptop")
        self.assertEqual(req["max_budget"], 70000.0)
        self.assertEqual(req["min_ram_gb"], 16)
        self.assertEqual(req["min_storage_gb"], 512)
        self.assertEqual(req["min_rating"], 4.2)

    def test_end_to_end_recommendation(self):
        query = "Find laptops under 70000 with 16 GB RAM and 512 GB storage and rating above 4.2"
        state = self.orchestrator.run_sequential(query, human_action="APPROVE")
        self.assertIsNotNone(state.final_recommendation)
        rec = state.final_recommendation
        self.assertLessEqual(rec["price"], 70000)
        self.assertGreaterEqual(rec["ram_gb"], 16)
        self.assertGreaterEqual(rec["rating"], 4.2)
        self.assertTrue(state.validation["valid"])
        self.assertEqual(state.human_approval, "APPROVE")

    def test_human_rejection_gate(self):
        query = "Find laptops under 70000 with 16 GB RAM"
        state = self.orchestrator.run_sequential(query, human_action="REJECT")
        self.assertIsNone(state.final_recommendation)
        self.assertEqual(state.human_approval, "REJECT")

    def test_shared_state_trace_and_metrics(self):
        query = "Find laptops under 70000 with 16 GB RAM"
        state = self.orchestrator.run_sequential(query)
        self.assertGreater(len(state.trace), 5)
        self.assertGreater(state.metrics["agent_calls"], 5)
        self.assertGreater(state.metrics["tool_calls"], 0)

    def test_parallel_execution_benchmark(self):
        query = "Find laptops under 70000 with 16 GB RAM"
        state = self.orchestrator.run_parallel_benchmark(query)
        self.assertIn("speedup", state.metrics)
        self.assertGreater(state.metrics["speedup"], 0.0)

if __name__ == "__main__":
    unittest.main()
