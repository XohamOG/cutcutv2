# Experiment 6: Developer Automation System using MCP Protocol

## Aim
To design and implement a Developer Automation System using Model Context Protocol (MCP) that enables an agent to communicate with developer tools (file listing, file reading, code search, AST analysis, automated test execution) through a client-server architecture with dependency-aware scheduling, path security, and persistent tracing.

## Core Features
1. **MCP Client-Server Protocol**:
   - `MCPDeveloperServer` exposing standardized tools with risk policies.
   - `MCPClientSession` using asynchronous tool discovery (`list_tools`) and invocation (`call_tool`).
2. **5 Registered Developer Tools**:
   - `list_files`, `read_file`, `search_code`, `analyze_python` (AST-based parsing), `run_tests` (subprocess runner).
3. **Path Security Guard**:
   - `safe_project_path()` prevents directory traversal exploits (e.g. `../../etc/passwd`).
4. **Dependency-Aware Workflow (DOP / DOS)**:
   - Phase 1: Parallel execution of independent tasks (`analyze_python` + `search_code`, DOP = 2).
   - Phase 2: Result validation checkpoint.
   - Phase 3: Sequential dependent execution (`run_tests`).
5. **Observability & Tracing**:
   - Stores Trace ID, Task ID, execution times, and status in `mcp_traces.jsonl`.
6. **Performance Engineering**:
   - Compares sequential vs parallel throughput and calculates relative execution time reduction.

## How to Run Tests
```bash
python test_mcp_developer.py
```
