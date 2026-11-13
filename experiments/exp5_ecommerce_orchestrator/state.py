from typing import Dict, Any, List, Optional
from uuid import uuid4
from datetime import datetime

class SharedWorkflowState:
    def __init__(self, user_query: str):
        self.workflow_id: str = f"WF-{uuid4().hex[:8].upper()}"
        self.created_at: str = datetime.utcnow().isoformat()
        self.user_query: str = user_query
        self.requirements: Dict[str, Any] = {}
        self.messages: List[Dict[str, Any]] = []
        self.search_results: List[Dict[str, Any]] = []
        self.filtered_results: List[Dict[str, Any]] = []
        self.comparison: Dict[str, Any] = {}
        self.ranking: List[Dict[str, Any]] = []
        self.validation: Dict[str, Any] = {}
        self.human_approval: Optional[str] = None
        self.final_recommendation: Optional[Dict[str, Any]] = None
        self.errors: List[str] = []
        self.trace: List[Dict[str, Any]] = []
        self.metrics: Dict[str, Any] = {
            "agent_calls": 0,
            "tool_calls": 0,
            "retries": 0,
            "sequential_duration_ms": 0.0,
            "parallel_duration_ms": 0.0,
            "speedup": 1.0
        }

    def add_trace(self, agent_name: str, action: str, status: str, duration_ms: float, details: Any = None):
        self.trace.append({
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent_name,
            "action": action,
            "status": status,
            "duration_ms": round(duration_ms, 2),
            "details": details
        })
        self.metrics["agent_calls"] += 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "user_query": self.user_query,
            "requirements": self.requirements,
            "ranked_count": len(self.ranking),
            "final_recommendation": self.final_recommendation,
            "human_approval": self.human_approval,
            "metrics": self.metrics,
            "trace_length": len(self.trace)
        }
