import math
import re
from typing import List, Dict, Any, Tuple, Optional

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "as", "at", "be", "because", "been", "before", "being", "below",
    "between", "both", "but", "by", "could", "did", "do", "does", "doing", "down",
    "during", "each", "few", "for", "from", "further", "had", "has", "have", "having",
    "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i",
    "if", "in", "into", "is", "it", "its", "itself", "me", "more", "most", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them",
    "themselves", "then", "there", "these", "they", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
    "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
    "yours", "yourself", "yourselves"
}

class VectorSemanticIndex:
    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.vectors: List[List[float]] = []

    def _tokenize(self, text: str) -> List[str]:
        raw = re.findall(r"\b[a-zA-Z0-9_]{2,}\b", text.lower())
        return [w for w in raw if w not in STOPWORDS]

    def build_index(self, chunks: List[Dict[str, Any]]):
        self.chunks = chunks
        num_docs = len(chunks)
        if num_docs == 0:
            return

        doc_tokens = [self._tokenize(c["text"]) for c in chunks]
        doc_freq: Dict[str, int] = {}

        for tokens in doc_tokens:
            unique = set(tokens)
            for t in unique:
                doc_freq[t] = doc_freq.get(t, 0) + 1

        self.vocabulary = {term: idx for idx, term in enumerate(sorted(doc_freq.keys()))}
        self.idf = {
            term: math.log((num_docs + 1) / (df + 1)) + 1.0
            for term, df in doc_freq.items()
        }

        self.vectors = [self._vectorize(tokens) for tokens in doc_tokens]

    def _vectorize(self, tokens: List[str]) -> List[float]:
        vec = [0.0] * len(self.vocabulary)
        tf: Dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1

        for term, count in tf.items():
            if term in self.vocabulary:
                idx = self.vocabulary[term]
                vec[idx] = (count / len(tokens)) * self.idf[term]

        # L2 normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def _cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        return sum(a * b for a, b in zip(v1, v2))

    def search(
        self,
        query: str,
        top_k: int = 3,
        similarity_threshold: float = 0.15,
        document_filter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        q_tokens = self._tokenize(query)
        if not q_tokens or not self.vocabulary:
            return []

        q_vec = self._vectorize(q_tokens)
        results = []

        for idx, doc_vec in enumerate(self.vectors):
            chunk = self.chunks[idx]
            if document_filter and chunk["document"] != document_filter:
                continue

            sim = self._cosine_similarity(q_vec, doc_vec)
            if sim >= similarity_threshold:
                item = dict(chunk)
                item["similarity"] = round(sim, 4)
                results.append(item)

        results.sort(key=lambda x: x["similarity"], reverse=True)
        return results[:top_k]
