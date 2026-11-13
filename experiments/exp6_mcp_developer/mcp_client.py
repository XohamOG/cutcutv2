import asyncio
import json
import time
from uuid import uuid4
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from mcp_server import MCPDeveloperServer

TRACE_FILE = Path(__file__).parent / "mcp_traces.jsonl"

class MCPClientSession:
    def __init__(self, server: MCPDeveloperServer):
        self.server = server

    async def list_tools(self) -> List[Dict[str, Any]]:
        await asyncio.sleep(0.001)
        return self.server.list_tools()

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        await asyncio.sleep(0.001)
        return self.server.call_tool(tool_name, arguments)

class DeveloperAutomationPipeline:
    def __init__(self):
        self.server = MCPDeveloperServer()
        self.session = MCPClientSession(self.server)

    def log_trace(self, trace_id: str, task_id: str, tool_name: str, args: Any, status: str, duration_ms: float, err: Optional[str] = None):
        record = {
            "trace_id": trace_id,
            "task_id": task_id,
            "tool_name": tool_name,
            "arguments": args,
            "status": status,
            "duration_ms": round(duration_ms, 2),
            "timestamp": datetime.utcnow().isoformat(),
            "error": err
        }
        with open(TRACE_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

    async def execute_task(self, trace_id: str, task_id: str, tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        t0 = time.time()
        try:
            res = await self.session.call_tool(tool_name, args)
            dur = (time.time() - t0) * 1000
            self.log_trace(trace_id, task_id, tool_name, args, "SUCCESS", dur)
            return {"task_id": task_id, "status": "SUCCESS", "result": res}
        except Exception as e:
            dur = (time.time() - t0) * 1000
            self.log_trace(trace_id, task_id, tool_name, args, "FAILED", dur, err=str(e))
            return {"task_id": task_id, "status": "FAILED", "error": str(e)}

    async def run_dependency_aware_workflow(self, trace_id: Optional[str] = None) -> Dict[str, Any]:
        tid = trace_id or f"TRACE-{uuid4().hex[:8].upper()}"

        # Phase 1: Parallel (DOP = 2) - Independent analysis and search
        t_phase1_start = time.time()
        task1 = self.execute_task(tid, "TASK-001", "analyze_python", {"file_path": "calculator.py"})
        task2 = self.execute_task(tid, "TASK-002", "search_code", {"query": "def", "file_path": "calculator.py"})
        phase1_results = await asyncio.gather(task1, task2)
        phase1_duration = (time.time() - t_phase1_start) * 1000

        # Phase 2: Dependency Validation
        analysis_ok = phase1_results[0]["status"] == "SUCCESS"

        # Phase 3: Sequential dependent execution - Run tests only if analysis passed
        phase3_result = None
        if analysis_ok:
            phase3_result = await self.execute_task(tid, "TASK-003", "run_tests", {"test_file": "test_calculator.py"})

        return {
            "trace_id": tid,
            "phase1_parallel": phase1_results,
            "phase1_duration_ms": round(phase1_duration, 2),
            "phase2_validation": "PASSED" if analysis_ok else "FAILED",
            "phase3_sequential": phase3_result
        }

    async def benchmark_sequential_vs_parallel(self, runs: int = 3) -> Dict[str, Any]:
        tools_batch = [
            ("analyze_python", {"file_path": "calculator.py"}),
            ("search_code", {"query": "def", "file_path": "calculator.py"}),
            ("list_files", {"relative_dir": "."}),
            ("read_file", {"file_path": "calculator.py"})
        ]

        seq_times = []
        par_times = []

        for r in range(runs):
            # Sequential
            t0 = time.time()
            for name, args in tools_batch:
                await self.session.call_tool(name, args)
            seq_times.append((time.time() - t0) * 1000)

            # Parallel
            t0 = time.time()
            await asyncio.gather(*[self.session.call_tool(name, args) for name, args in tools_batch])
            par_times.append((time.time() - t0) * 1000)

        avg_seq = sum(seq_times) / len(seq_times)
        avg_par = sum(par_times) / len(par_times)
        reduction_pct = ((avg_seq - avg_par) / avg_seq) * 100.0 if avg_seq > 0 else 0.0

        return {
            "runs": runs,
            "avg_sequential_ms": round(avg_seq, 2),
            "avg_parallel_ms": round(avg_par, 2),
            "relative_reduction_pct": round(reduction_pct, 2)
        }
