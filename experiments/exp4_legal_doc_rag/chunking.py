import re
from pathlib import Path
from typing import List, Dict, Any

def clean_text(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", text)
    return cleaned.strip()

def chunk_document_file(file_path: Path) -> List[Dict[str, Any]]:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    doc_name = file_path.name
    pages = re.split(r"(?:Page:\s*(\d+))", content)
    chunks = []
    chunk_counter = 1

    current_page = 1
    # pages list starts with header, followed by pairs of (page_num, page_content)
    if len(pages) > 1:
        for i in range(1, len(pages), 2):
            page_num = int(pages[i])
            page_text = clean_text(pages[i+1])
            if page_text:
                chunks.append({
                    "chunk_id": chunk_counter,
                    "document": doc_name,
                    "page": page_num,
                    "text": page_text
                })
                chunk_counter += 1
    else:
        cleaned = clean_text(content)
        if cleaned:
            chunks.append({
                "chunk_id": chunk_counter,
                "document": doc_name,
                "page": 1,
                "text": cleaned
            })

    return chunks
