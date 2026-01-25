#!/usr/bin/env python3
"""Query the RAG index"""

import json
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

# Initialize
client = QdrantClient(path="./.qdrant_data")
embedder = SentenceTransformer("all-mpnet-base-v2")

# Query
query = "how well do you know this app structure"
query_embedding = embedder.encode(query)

# Search
results = client.search(
    collection_name="genhub_rag",
    query_vector=query_embedding.tolist(),
    limit=10,
    with_payload=True
)

print(json.dumps([
    {
        "id": r.id,
        "score": r.score,
        "payload": {
            "content": r.payload.get("content", "")[:200],
            "source": r.payload.get("source"),
            "file_path": r.payload.get("file_path"),
            "chunk_type": r.payload.get("chunk_type"),
            "header_hierarchy": r.payload.get("header_hierarchy")
        }
    }
    for r in results
], indent=2))
