#!/usr/bin/env python3
"""Simple RAG Indexer - Minimal working version"""

import os
import sys
from pathlib import Path
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Config
# Navigate up: __file__ → scripts → rag-agent → skills → .claude → genhub
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent.parent  # genhub root
QDRANT_PATH = PROJECT_ROOT / ".qdrant_data"
COLLECTION_NAME = "genhub_rag"
MODEL_NAME = "all-MiniLM-L6-v2"
BATCH_SIZE = 32

print(f"Project root: {PROJECT_ROOT}")
print(f"Vector DB: {QDRANT_PATH}")

# Initialize
embedder = SentenceTransformer(MODEL_NAME)
client = QdrantClient(path=str(QDRANT_PATH))

# Create/recreate collection
try:
    client.delete_collection(collection_name=COLLECTION_NAME)
    print(f"Deleted existing collection: {COLLECTION_NAME}")
except:
    pass

# Create collection
vector_size = embedder.get_sentence_embedding_dimension()
print(f"Vector dimension: {vector_size}")

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
)
print(f"Created collection: {COLLECTION_NAME}")

# Find and index Server Actions
actions_dir = PROJECT_ROOT / "app" / "actions"
files = sorted(actions_dir.glob("*.ts"))

print(f"\nFound {len(files)} Server Action files")

points = []
point_id = 1

for file_path in files:
    try:
        content = file_path.read_text(encoding="utf-8")

        # Generate embedding
        embedding = embedder.encode(content).tolist()

        # Create point
        point = PointStruct(
            id=point_id,
            vector=embedding,
            payload={
                "content": content[:1000],  # Store first 1000 chars as preview
                "file_path": str(file_path.relative_to(PROJECT_ROOT)),
                "file_name": file_path.name,
            }
        )
        points.append(point)
        point_id += 1

        print(f"✓ {file_path.name}")

    except Exception as e:
        print(f"✗ {file_path.name}: {e}")

# Upsert to Qdrant in batches
print(f"\nUpserting {len(points)} vectors to Qdrant...")
for i in range(0, len(points), BATCH_SIZE):
    batch = points[i:i+BATCH_SIZE]
    client.upsert(
        collection_name=COLLECTION_NAME,
        points=batch
    )
    print(f"  Upserted batch {i//BATCH_SIZE + 1}/{(len(points)-1)//BATCH_SIZE + 1}")

# Get collection stats
info = client.get_collection(collection_name=COLLECTION_NAME)
print(f"\n✅ Indexing complete!")
print(f"  Total points: {info.points_count}")
print(f"  Vector DB location: {QDRANT_PATH}")
