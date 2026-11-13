import json
import re
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
from state import SharedWorkflowState

PRODUCTS_FILE = Path(__file__).parent / "products.json"

class PlannerAgent:
    @staticmethod
    def plan(state: SharedWorkflowState):
        t0 = time.time()
        q = state.user_query.lower()

        # Query Decomposition
        budget_match = re.search(r"(?:under|below|budget|within|max)\s*(?:₹|rs\.?|inr)?\s*([\d,]+)", q)
        ram_match = re.search(r"(\d+)\s*(?:gb)?\s*ram", q)
        storage_match = re.search(r"(\d+)\s*(?:gb|tb)?\s*storage", q)
        rating_match = re.search(r"rating\s*(?:above|greater than|>=|>)?\s*(\d+(?:\.\d+)?)", q)

        category = "laptop" if "laptop" in q else "electronics"
        max_budget = float(budget_match.group(1).replace(",", "")) if budget_match else 70000.0
        min_ram = int(ram_match.group(1)) if ram_match else 16
        min_storage = int(storage_match.group(1)) if storage_match else 512
        min_rating = float(rating_match.group(1)) if rating_match else 4.0

        state.requirements = {
            "category": category,
            "max_budget": max_budget,
            "min_ram_gb": min_ram,
            "min_storage_gb": min_storage,
            "min_rating": min_rating
        }
        state.add_trace("PlannerAgent", "query_decomposition", "SUCCESS", (time.time() - t0) * 1000, state.requirements)

class RouterAgent:
    @staticmethod
    def route(task: str) -> str:
        routes = {
            "search": "SearchAgent",
            "filter": "FilterAgent",
            "compare": "ComparisonAgent",
            "rank": "RankingAgent",
            "validate": "ValidatorAgent",
            "supervise": "SupervisorAgent"
        }
        return routes.get(task, "SupervisorAgent")

class SearchAgent:
    @staticmethod
    def search(state: SharedWorkflowState):
        t0 = time.time()
        state.metrics["tool_calls"] += 1
        with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
            catalog = json.load(f)

        req_cat = state.requirements.get("category", "laptop")
        candidates = [p for p in catalog if p.get("category") == req_cat]
        state.search_results = candidates
        state.add_trace("SearchAgent", "catalog_search", "SUCCESS", (time.time() - t0) * 1000, f"Found {len(candidates)} items")

class FilterAgent:
    @staticmethod
    def filter_products(state: SharedWorkflowState):
        t0 = time.time()
        req = state.requirements
        filtered = []
        for p in state.search_results:
            if p["price"] <= req["max_budget"] and \
               p["ram_gb"] >= req["min_ram_gb"] and \
               p["storage_gb"] >= req["min_storage_gb"] and \
               p["rating"] >= req["min_rating"]:
                filtered.append(p)

        state.filtered_results = filtered
        state.add_trace("FilterAgent", "constraint_filtering", "SUCCESS", (time.time() - t0) * 1000, f"{len(filtered)} passed constraints")

class ComparisonAgent:
    @staticmethod
    def compare(state: SharedWorkflowState):
        t0 = time.time()
        # Matrix comparison
        comparison = {}
        for p in state.filtered_results:
            comparison[p["id"]] = {
                "name": p["name"],
                "price": p["price"],
                "price_to_ram_ratio": round(p["price"] / p["ram_gb"], 2),
                "rating": p["rating"],
                "storage": p["storage_gb"]
            }
        state.comparison = comparison
        state.add_trace("ComparisonAgent", "matrix_comparison", "SUCCESS", (time.time() - t0) * 1000, comparison)

class RankingAgent:
    @staticmethod
    def rank(state: SharedWorkflowState):
        t0 = time.time()
        # Multi-factor score: Rating weight (50%), Price budget efficiency (30%), Storage bonus (20%)
        ranked = []
        budget = state.requirements["max_budget"]
        for p in state.filtered_results:
            rating_score = (p["rating"] / 5.0) * 50.0
            price_score = ((budget - p["price"]) / budget) * 30.0
            storage_score = min(20.0, (p["storage_gb"] / 1024.0) * 20.0)
            total_score = round(rating_score + price_score + storage_score, 2)
            ranked.append({
                **p,
                "score": total_score,
                "score_breakdown": {
                    "rating_contribution": round(rating_score, 2),
                    "price_efficiency": round(price_score, 2),
                    "storage_contribution": round(storage_score, 2)
                }
            })
        ranked.sort(key=lambda x: x["score"], reverse=True)
        state.ranking = ranked
        state.add_trace("RankingAgent", "scoring_and_ranking", "SUCCESS", (time.time() - t0) * 1000, f"Ranked {len(ranked)} products")

class ValidatorAgent:
    @staticmethod
    def validate(state: SharedWorkflowState) -> bool:
        t0 = time.time()
        req = state.requirements
        for p in state.ranking:
            if p["price"] > req["max_budget"] or p["ram_gb"] < req["min_ram_gb"] or p["rating"] < req["min_rating"]:
                state.validation = {"valid": False, "reason": f"Product {p['id']} violates constraints."}
                state.add_trace("ValidatorAgent", "validation_check", "FAILED", (time.time() - t0) * 1000, state.validation)
                return False
        state.validation = {"valid": True, "reason": "All ranked products strictly adhere to user constraints."}
        state.add_trace("ValidatorAgent", "validation_check", "SUCCESS", (time.time() - t0) * 1000, state.validation)
        return True

class SupervisorAgent:
    @staticmethod
    def supervise_and_finalize(state: SharedWorkflowState, human_approval: str = "APPROVE"):
        t0 = time.time()
        state.human_approval = human_approval
        if human_approval == "APPROVE" and state.ranking and state.validation.get("valid"):
            state.final_recommendation = state.ranking[0]
            status = "APPROVED"
        elif human_approval == "REJECT":
            state.final_recommendation = None
            status = "REJECTED_BY_HUMAN"
        else:
            state.final_recommendation = None
            status = "INCOMPLETE_OR_INVALID"

        state.add_trace("SupervisorAgent", "supervision_finalization", status, (time.time() - t0) * 1000, {
            "human_approval": human_approval,
            "recommended": state.final_recommendation["id"] if state.final_recommendation else None
        })
