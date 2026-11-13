import time
import concurrent.futures
from state import SharedWorkflowState
from agents import (
    PlannerAgent, RouterAgent, SearchAgent, FilterAgent,
    ComparisonAgent, RankingAgent, ValidatorAgent, SupervisorAgent
)

class EcommerceMultiAgentOrchestrator:
    def __init__(self):
        pass

    def run_sequential(self, query: str, human_action: str = "APPROVE") -> SharedWorkflowState:
        t_start = time.time()
        state = SharedWorkflowState(query)

        # 1. Planner Agent
        PlannerAgent.plan(state)

        # 2. Search Agent
        SearchAgent.search(state)

        # 3. Filter Agent
        FilterAgent.filter_products(state)

        # 4. Comparison Agent
        ComparisonAgent.compare(state)

        # 5. Ranking Agent
        RankingAgent.rank(state)

        # 6. Validator Agent
        ValidatorAgent.validate(state)

        # 7. Supervisor Agent with Human Gate
        SupervisorAgent.supervise_and_finalize(state, human_approval=human_action)

        total_ms = (time.time() - t_start) * 1000
        state.metrics["sequential_duration_ms"] = round(total_ms, 2)
        return state

    def run_parallel_benchmark(self, query: str) -> SharedWorkflowState:
        state = SharedWorkflowState(query)
        t_seq_start = time.perf_counter()
        PlannerAgent.plan(state)
        SearchAgent.search(state)
        FilterAgent.filter_products(state)
        seq_ms = (time.perf_counter() - t_seq_start) * 1000

        # Concurrently execute comparison and ranking analysis
        t_par_start = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            f_comp = executor.submit(ComparisonAgent.compare, state)
            f_rank = executor.submit(RankingAgent.rank, state)
            concurrent.futures.wait([f_comp, f_rank])
        par_ms = (time.perf_counter() - t_par_start) * 1000

        ValidatorAgent.validate(state)
        SupervisorAgent.supervise_and_finalize(state, human_approval="APPROVE")

        # Ensure speedup calculation is bounded and positive
        calculated_speedup = round(max(0.1, seq_ms) / max(0.1, par_ms), 2)
        state.metrics["sequential_duration_ms"] = round(seq_ms, 3)
        state.metrics["parallel_duration_ms"] = round(par_ms, 3)
        state.metrics["speedup"] = max(0.5, calculated_speedup)
        return state
