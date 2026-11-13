import unittest
import asyncio
from pathlib import Path
from mcp_client import DeveloperAutomationPipeline, TRACE_FILE

class TestMCPDeveloperAutomation(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.pipeline = DeveloperAutomationPipeline()

    async def test_tool_discovery(self):
        tools = await self.pipeline.session.list_tools()
        self.assertEqual(len(tools), 5)
        names = {t["name"] for t in tools}
        expected = {"list_files", "read_file", "search_code", "analyze_python", "run_tests"}
        self.assertEqual(names, expected)

    async def test_code_analysis_ast(self):
        res = await self.pipeline.session.call_tool("analyze_python", {"file_path": "calculator.py"})
        self.assertEqual(res["file"], "calculator.py")
        self.assertEqual(res["function_count"], 5)
        self.assertIn("add", res["functions"])
        self.assertIn("divide", res["functions"])
        self.assertIn("calculate_square", res["functions"])

    async def test_automated_testing_tool(self):
        res = await self.pipeline.session.call_tool("run_tests", {"test_file": "test_calculator.py"})
        self.assertEqual(res["return_code"], 0)
        self.assertTrue(res["passed"])

    async def test_path_traversal_protection(self):
        with self.assertRaises(PermissionError):
            await self.pipeline.session.call_tool("read_file", {"file_path": "../../etc/passwd"})

    async def test_dependency_aware_workflow(self):
        result = await self.pipeline.run_dependency_aware_workflow()
        self.assertEqual(len(result["phase1_parallel"]), 2)
        self.assertEqual(result["phase2_validation"], "PASSED")
        self.assertIsNotNone(result["phase3_sequential"])
        self.assertTrue(result["phase3_sequential"]["result"]["passed"])

    async def test_trace_logging_persisted(self):
        await self.pipeline.execute_task("TEST-TRACE", "TASK-099", "list_files", {"relative_dir": "."})
        self.assertTrue(TRACE_FILE.exists())

    async def test_benchmark_performance(self):
        bench = await self.pipeline.benchmark_sequential_vs_parallel(runs=2)
        self.assertIn("avg_sequential_ms", bench)
        self.assertIn("avg_parallel_ms", bench)
        self.assertIn("relative_reduction_pct", bench)

if __name__ == "__main__":
    unittest.main()
