# Experiment 4: Legal Document Intelligence & Retrieval System (RAG)

## Aim
To design and implement a Legal Document Intelligence and Retrieval System that ingests contractual documents, segments and indexes them into semantic vectors, retrieves relevant clauses using structured queries, generates grounded answers with traceable document and page citations, and detects prompt-injection attacks.

## Core Features
1. **Document Ingestion & Chunking**:
   - Parses multi-page contracts (`Vendor_Agreement.txt`, `Non_Disclosure_Agreement.txt`).
   - Normalizes whitespace and attaches metadata (`chunk_id`, `document`, `page`, `text`).
2. **Semantic Vector Indexing**:
   - TF-IDF stopword-filtered normalized vector embeddings with cosine similarity matching.
3. **Traceable Citations**:
   - Outputs strict document name, page number, and chunk ID references.
4. **Source & Grounding Validation**:
   - Assesses grounding score (`PASS`, `REVIEW`, `FAIL`) and confidence tier (`HIGH`, `MEDIUM`, `LOW`).
5. **Relevance Filtering & Out-of-Domain Guard**:
   - Safely rejects unsupported or irrelevant queries without hallucinating.
6. **Prompt-Injection Defense**:
   - Blocks instruction override attempts (e.g., "ignore all previous instructions").
7. **Audit Logging**:
   - Appends all queries, retrieval similarity scores, and execution metadata in `audit_log.json`.

## How to Run Tests
```bash
python test_legal_rag.py
```
