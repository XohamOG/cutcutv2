import os
import ast
import subprocess
from pathlib import Path
from typing import Dict, Any, List

PROJECT_ROOT = (Path(__file__).parent / "sample_project").resolve()

def safe_project_path(requested_path: str) -> Path:
    target = (PROJECT_ROOT / requested_path).resolve()
    if not str(target).startswith(str(PROJECT_ROOT)):
        raise PermissionError("Path outside project directory: Traversal rejected.")
    return target

class MCPDeveloperServer:
    def __init__(self):
        self.tools = {
            "list_files": {
                "name": "list_files",
                "description": "Lists project files in directory",
                "risk_level": "LOW",
                "handler": self.list_files
            },
            "read_file": {
                "name": "read_file",
                "description": "Reads a project file content",
                "risk_level": "LOW",
                "handler": self.read_file
            },
            "search_code": {
                "name": "search_code",
                "description": "Searches python source code for pattern",
                "risk_level": "LOW",
                "handler": self.search_code
            },
            "analyze_python": {
                "name": "analyze_python",
                "description": "Performs AST-based Python code analysis",
                "risk_level": "LOW",
                "handler": self.analyze_python
            },
            "run_tests": {
                "name": "run_tests",
                "description": "Executes automated tests using test runner",
                "risk_level": "MEDIUM",
                "handler": self.run_tests
            }
        }

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {"name": v["name"], "description": v["description"], "risk_level": v["risk_level"]}
            for v in self.tools.values()
        ]

    def list_files(self, relative_dir: str = ".") -> Dict[str, Any]:
        target = safe_project_path(relative_dir)
        files = [p.name for p in target.glob("*") if p.is_file()]
        return {"directory": relative_dir, "files": sorted(files), "count": len(files)}

    def read_file(self, file_path: str) -> Dict[str, Any]:
        target = safe_project_path(file_path)
        if not target.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(target, "r", encoding="utf-8") as f:
            content = f.read()
        return {"file_path": file_path, "size": len(content), "content": content}

    def search_code(self, query: str, file_path: str = "calculator.py") -> Dict[str, Any]:
        target = safe_project_path(file_path)
        with open(target, "r", encoding="utf-8") as f:
            lines = f.readlines()
        matches = [
            {"line_number": i + 1, "text": line.strip()}
            for i, line in enumerate(lines) if query.lower() in line.lower()
        ]
        return {"file": file_path, "query": query, "matches": matches, "match_count": len(matches)}

    def analyze_python(self, file_path: str = "calculator.py") -> Dict[str, Any]:
        target = safe_project_path(file_path)
        with open(target, "r", encoding="utf-8") as f:
            code = f.read()
        tree = ast.parse(code, filename=str(target))
        functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
        classes = [node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]
        return {
            "file": file_path,
            "functions": functions,
            "classes": classes,
            "function_count": len(functions),
            "class_count": len(classes)
        }

    def run_tests(self, test_file: str = "test_calculator.py") -> Dict[str, Any]:
        target = safe_project_path(test_file)
        cmd = ["python", str(target)]
        proc = subprocess.run(cmd, cwd=str(PROJECT_ROOT), capture_output=True, text=True, timeout=10)
        passed = proc.returncode == 0
        return {
            "test_file": test_file,
            "return_code": proc.returncode,
            "passed": passed,
            "stdout": proc.stdout.strip(),
            "stderr": proc.stderr.strip()
        }

    def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if tool_name not in self.tools:
            raise KeyError(f"MCP tool not found: {tool_name}")
        handler = self.tools[tool_name]["handler"]
        return handler(**arguments)
