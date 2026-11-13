import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from chunking import chunk_document_file
from vector_index import VectorSemanticIndex

CONTRACTS_DIR = Path(__file__).parent / "sample_contracts"
AUDIT_LOG_FILE = Path(__file__).parent / "audit_log.json"

PROMPT_INJECTION_PATTERNS = [
    r"ignore (all )?previous instructions",
    r"reveal (the )?system prompt",
    r"bypass security",
    r"override your rules",
    r"forget your instructions"
]

class LegalDocumentRAGSystem:
    def __init__(self, contracts_dir: Path = CONTRACTS_DIR):
        self.contracts_dir = contracts_dir
        self.index = VectorSemanticIndex()
        self.chunks: List[Dict[str, Any]] = []
        self._ingest_documents()

    def _ingest_documents(self):
        all_chunks = []
        if self.contracts_dir.exists():
            for f in self.contracts_dir.glob("*.txt"):
                chunks = chunk_document_file(f)
                all_chunks.extend(chunks)
        self.chunks = all_chunks
        self.index.build_index(all_chunks)

    def check_security(self, query: str) -> bool:
        lower = query.lower()
        for pat in PROMPT_INJECTION_PATTERNS:
            if re.search(pat, lower):
                return False
        return True

    def validate_grounding(self, response_text: str, retrieved_contexts: List[str]) -> str:
        if not retrieved_contexts:
            return "FAIL"
        # Check if response terms derive from retrieved context
        combined_context = " ".join(retrieved_contexts).lower()
        resp_words = [w for w in re.findall(r"\w+", response_text.lower()) if len(w) > 4]
        matches = sum(1 for w in resp_words if w in combined_context)
        ratio = matches / max(1, len(resp_words))
        if ratio > 0.6:
            return "PASS"
        elif ratio > 0.3:
            return "REVIEW"
        return "FAIL"

    def estimate_confidence(self, top_similarity: float, grounding_status: str) -> str:
        if top_similarity >= 0.4 and grounding_status == "PASS":
            return "HIGH"
        elif top_similarity >= 0.2 and grounding_status in ["PASS", "REVIEW"]:
            return "MEDIUM"
        return "LOW"

    def query(
        self,
        query_text: str,
        top_k: int = 3,
        similarity_threshold: float = 0.15,
        document_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()

        # Step 1: Security Checking
        if not self.check_security(query_text):
            self._log_audit(query_text, "BLOCKED", [], 0.0, "Prompt injection detected.")
            return {
                "status": "BLOCKED",
                "answer": "Security Alert: Prompt injection attempt detected. Request blocked.",
                "sources": [],
                "confidence": "LOW",
                "grounding": "FAIL"
            }

        # Step 2: Semantic Retrieval with Retry simulation
        attempts = 0
        max_retries = 3
        retrieved: List[Dict[str, Any]] = []
        while attempts < max_retries:
            attempts += 1
            try:
                retrieved = self.index.search(
                    query_text,
                    top_k=top_k,
                    similarity_threshold=similarity_threshold,
                    document_filter=document_filter
                )
                break
            except Exception:
                time.sleep(0.05 * (2 ** (attempts - 1)))

        # Step 3: Relevance Filtering
        if not retrieved:
            no_info_msg = "The information is not available in the provided legal documents."
            self._log_audit(query_text, "NO_RESULTS", [], 0.0, no_info_msg)
            return {
                "status": "NO_RESULTS",
                "answer": no_info_msg,
                "sources": [],
                "confidence": "LOW",
                "grounding": "PASS"
            }

        # Step 4: Context Augmentation & Grounded Response
        top_similarity = retrieved[0]["similarity"]
        contexts = [r["text"] for r in retrieved]

        # Extract answer and format traceable citation
        sources = [
            {
                "document": r["document"],
                "page": r["page"],
                "chunk_id": r["chunk_id"],
                "similarity": r["similarity"]
            }
            for r in retrieved
        ]

        primary_clause = retrieved[0]["text"]
        answer = f"According to {sources[0]['document']} (Page {sources[0]['page']}, Chunk {sources[0]['chunk_id']}): {primary_clause}"

        # Step 5: Source & Grounding Validation
        grounding = self.validate_grounding(answer, contexts)
        confidence = self.estimate_confidence(top_similarity, grounding)

        self._log_audit(query_text, "SUCCESS", sources, top_similarity, answer)

        return {
            "status": "SUCCESS",
            "answer": answer,
            "sources": sources,
            "confidence": confidence,
            "grounding": grounding,
            "response_time_ms": round((time.time() - start_time) * 1000, 2)
        }

    def _log_audit(self, query: str, status: str, sources: List[Dict[str, Any]], top_sim: float, response: str):
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "query": query,
            "status": status,
            "top_similarity": top_sim,
            "sources_count": len(sources),
            "sources": sources,
            "response_summary": response[:100]
        }
        logs = []
        if AUDIT_LOG_FILE.exists():
            try:
                with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                    logs = json.load(f)
            except Exception:
                logs = []
        logs.append(record)
        with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(logs, f, indent=2)
