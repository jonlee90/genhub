#!/usr/bin/env python3
"""
RAG Agent Retriever - Hybrid Search with Parent-Child Lookup

Implements hybrid retrieval combining:
- Dense semantic search (sentence transformers)
- Sparse keyword search (BM25)
- Parent-child hierarchical lookup for context preservation
"""

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import yaml
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("rag-retriever")


@dataclass
class RetrievalResult:
    """A single retrieval result with context."""
    chunk_id: str
    content: str
    source: str
    source_type: str
    file_path: str
    start_line: int
    end_line: int
    score: float
    chunk_type: str
    parent_content: Optional[str] = None
    header_hierarchy: list[str] = None
    priority: int = 1

    def to_dict(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "content": self.content,
            "source": self.source,
            "source_type": self.source_type,
            "file_path": self.file_path,
            "start_line": self.start_line,
            "end_line": self.end_line,
            "score": round(self.score, 4),
            "chunk_type": self.chunk_type,
            "parent_content": self.parent_content,
            "header_hierarchy": self.header_hierarchy or [],
            "priority": self.priority
        }


class HybridRetriever:
    """
    Hybrid retrieval combining dense and sparse search.

    Flow:
    1. Dense search with sentence transformers
    2. Sparse search with BM25
    3. Combine scores with configurable weights
    4. Fetch parent chunks for context
    5. Re-rank by relevance
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)

        retrieval_config = self.config.get("retrieval", {})

        # Initialize Qdrant
        self.client = QdrantClient(
            path=retrieval_config.get("qdrant_path", "./.qdrant_data")
        )
        self.collection_name = retrieval_config.get("collection_name", "genhub_rag")

        # Load embedding model
        logger.info("Loading embedding model...")
        self.dense_model = SentenceTransformer(
            retrieval_config.get("dense_model", "all-mpnet-base-v2")
        )

        # Load re-ranker if enabled
        self.rerank = retrieval_config.get("rerank", True)
        self.reranker = None
        if self.rerank:
            try:
                from sentence_transformers import CrossEncoder
                rerank_model = retrieval_config.get(
                    "rerank_model",
                    "cross-encoder/ms-marco-MiniLM-L-6-v2"
                )
                logger.info(f"Loading re-ranker: {rerank_model}")
                self.reranker = CrossEncoder(rerank_model)
            except ImportError:
                logger.warning("CrossEncoder not available, skipping re-ranking")
                self.rerank = False

        # Search parameters
        self.top_k = retrieval_config.get("top_k", 10)
        self.top_k_parent = retrieval_config.get("top_k_parent", 3)
        self.confidence_threshold = retrieval_config.get("confidence_threshold", 0.7)
        self.dense_weight = retrieval_config.get("dense_weight", 0.7)
        self.sparse_weight = retrieval_config.get("sparse_weight", 0.3)

        # Build BM25 index from collection
        self._build_bm25_index()

    def _load_config(self, path: str) -> dict:
        """Load configuration from YAML."""
        config_file = Path(__file__).parent.parent / path
        if not config_file.exists():
            logger.warning(f"Config not found at {config_file}, using defaults")
            return {}

        with open(config_file) as f:
            return yaml.safe_load(f)

    def _build_bm25_index(self) -> None:
        """Build BM25 index from Qdrant collection."""
        try:
            # Scroll through all points to get content
            points = []
            offset = None

            while True:
                result = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=100,
                    offset=offset,
                    with_payload=True,
                    with_vectors=False
                )

                points.extend(result[0])
                offset = result[1]

                if offset is None:
                    break

            if not points:
                logger.warning("No points in collection, BM25 index empty")
                self.bm25_corpus = []
                self.bm25_ids = []
                self.bm25 = None
                return

            # Build corpus
            self.bm25_corpus = []
            self.bm25_ids = []

            for point in points:
                content = point.payload.get("content", "")
                self.bm25_corpus.append(content.lower().split())
                self.bm25_ids.append(point.id)

            self.bm25 = BM25Okapi(self.bm25_corpus)
            logger.info(f"Built BM25 index with {len(self.bm25_corpus)} documents")

        except Exception as e:
            logger.error(f"Failed to build BM25 index: {e}")
            self.bm25 = None

    def _dense_search(self, query: str, top_k: int) -> list[tuple[int, float]]:
        """Perform dense vector search."""
        query_embedding = self.dense_model.encode(query).tolist()

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k,
            with_payload=True
        )

        return [(r.id, r.score) for r in results]

    def _sparse_search(self, query: str, top_k: int) -> list[tuple[int, float]]:
        """Perform BM25 sparse search."""
        if self.bm25 is None:
            return []

        tokenized_query = query.lower().split()
        scores = self.bm25.get_scores(tokenized_query)

        # Get top-k indices
        top_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True
        )[:top_k]

        # Normalize scores to 0-1 range
        max_score = max(scores) if max(scores) > 0 else 1

        return [
            (self.bm25_ids[i], scores[i] / max_score)
            for i in top_indices
            if scores[i] > 0
        ]

    def _fetch_point(self, point_id: int) -> Optional[dict]:
        """Fetch a single point from Qdrant."""
        try:
            results = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[point_id],
                with_payload=True
            )
            if results:
                return results[0].payload
        except Exception as e:
            logger.warning(f"Failed to fetch point {point_id}: {e}")
        return None

    def _fetch_parent(self, parent_id: str) -> Optional[str]:
        """Fetch parent chunk content by ID."""
        try:
            results = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="chunk_id",
                            match=MatchValue(value=parent_id)
                        )
                    ]
                ),
                limit=1,
                with_payload=True
            )

            if results[0]:
                return results[0][0].payload.get("content")
        except Exception as e:
            logger.warning(f"Failed to fetch parent {parent_id}: {e}")

        return None

    def _combine_scores(
        self,
        dense_results: list[tuple[int, float]],
        sparse_results: list[tuple[int, float]]
    ) -> dict[int, float]:
        """Combine dense and sparse scores with RRF-style fusion."""
        combined = {}

        # Add dense scores
        for point_id, score in dense_results:
            combined[point_id] = self.dense_weight * score

        # Add sparse scores
        for point_id, score in sparse_results:
            if point_id in combined:
                combined[point_id] += self.sparse_weight * score
            else:
                combined[point_id] = self.sparse_weight * score

        return combined

    def _rerank(
        self,
        query: str,
        results: list[RetrievalResult]
    ) -> list[RetrievalResult]:
        """Re-rank results using cross-encoder."""
        if not self.reranker or not results:
            return results

        pairs = [(query, r.content) for r in results]
        scores = self.reranker.predict(pairs)

        # Update scores and sort
        for result, score in zip(results, scores):
            result.score = float(score)

        return sorted(results, key=lambda r: r.score, reverse=True)

    def search(
        self,
        query: str,
        top_k: Optional[int] = None,
        source_filter: Optional[str] = None,
        source_type_filter: Optional[str] = None,
        include_parents: bool = True
    ) -> list[RetrievalResult]:
        """
        Perform hybrid search with optional filtering.

        Args:
            query: Search query
            top_k: Number of results (default from config)
            source_filter: Filter by source name
            source_type_filter: Filter by source type (code, skill, docs)
            include_parents: Include parent chunk content

        Returns:
            List of RetrievalResult sorted by relevance
        """
        top_k = top_k or self.top_k

        logger.info(f"Searching for: {query[:100]}...")

        # Perform both searches
        dense_results = self._dense_search(query, top_k * 2)
        sparse_results = self._sparse_search(query, top_k * 2)

        # Combine scores
        combined_scores = self._combine_scores(dense_results, sparse_results)

        # Sort by combined score
        sorted_ids = sorted(
            combined_scores.keys(),
            key=lambda x: combined_scores[x],
            reverse=True
        )[:top_k * 2]  # Get more for filtering

        # Fetch results and build output
        results = []
        seen_chunks = set()

        for point_id in sorted_ids:
            payload = self._fetch_point(point_id)
            if not payload:
                continue

            chunk_id = payload.get("chunk_id", "")

            # Skip duplicates
            if chunk_id in seen_chunks:
                continue
            seen_chunks.add(chunk_id)

            # Apply filters
            if source_filter and payload.get("source") != source_filter:
                continue
            if source_type_filter and payload.get("source_type") != source_type_filter:
                continue

            # Fetch parent content if needed
            parent_content = None
            if include_parents and payload.get("chunk_type") == "child":
                parent_id = payload.get("parent_id")
                if parent_id:
                    parent_content = self._fetch_parent(parent_id)

            result = RetrievalResult(
                chunk_id=chunk_id,
                content=payload.get("content", ""),
                source=payload.get("source", ""),
                source_type=payload.get("source_type", ""),
                file_path=payload.get("file_path", ""),
                start_line=payload.get("start_line", 0),
                end_line=payload.get("end_line", 0),
                score=combined_scores[point_id],
                chunk_type=payload.get("chunk_type", ""),
                parent_content=parent_content,
                header_hierarchy=payload.get("header_hierarchy", []),
                priority=payload.get("priority", 1)
            )

            results.append(result)

            if len(results) >= top_k:
                break

        # Re-rank if enabled
        if self.rerank:
            results = self._rerank(query, results)

        # Filter by confidence threshold
        results = [r for r in results if r.score >= self.confidence_threshold]

        logger.info(f"Found {len(results)} results above threshold")
        return results

    def search_by_file(self, file_path: str, top_k: int = 5) -> list[RetrievalResult]:
        """Search for chunks from a specific file."""
        try:
            results = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="file_path",
                            match=MatchValue(value=file_path)
                        )
                    ]
                ),
                limit=top_k,
                with_payload=True
            )

            return [
                RetrievalResult(
                    chunk_id=p.payload.get("chunk_id", ""),
                    content=p.payload.get("content", ""),
                    source=p.payload.get("source", ""),
                    source_type=p.payload.get("source_type", ""),
                    file_path=p.payload.get("file_path", ""),
                    start_line=p.payload.get("start_line", 0),
                    end_line=p.payload.get("end_line", 0),
                    score=1.0,  # Exact match
                    chunk_type=p.payload.get("chunk_type", ""),
                    header_hierarchy=p.payload.get("header_hierarchy", []),
                    priority=p.payload.get("priority", 1)
                )
                for p in results[0]
            ]
        except Exception as e:
            logger.error(f"Failed to search by file: {e}")
            return []

    def get_related_chunks(
        self,
        chunk_id: str,
        top_k: int = 5
    ) -> list[RetrievalResult]:
        """Find chunks related to a given chunk (same file or similar content)."""
        # First, find the chunk
        try:
            results = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="chunk_id",
                            match=MatchValue(value=chunk_id)
                        )
                    ]
                ),
                limit=1,
                with_payload=True,
                with_vectors=True
            )

            if not results[0]:
                return []

            point = results[0][0]
            file_path = point.payload.get("file_path", "")

            # Search by file first
            file_results = self.search_by_file(file_path, top_k)

            # Then search by vector similarity
            if hasattr(point, 'vector') and point.vector:
                similar = self.client.search(
                    collection_name=self.collection_name,
                    query_vector=point.vector,
                    limit=top_k
                )

                for r in similar:
                    if r.payload.get("chunk_id") != chunk_id:
                        file_results.append(RetrievalResult(
                            chunk_id=r.payload.get("chunk_id", ""),
                            content=r.payload.get("content", ""),
                            source=r.payload.get("source", ""),
                            source_type=r.payload.get("source_type", ""),
                            file_path=r.payload.get("file_path", ""),
                            start_line=r.payload.get("start_line", 0),
                            end_line=r.payload.get("end_line", 0),
                            score=r.score,
                            chunk_type=r.payload.get("chunk_type", ""),
                            header_hierarchy=r.payload.get("header_hierarchy", []),
                            priority=r.payload.get("priority", 1)
                        ))

            # Deduplicate
            seen = set()
            unique_results = []
            for r in file_results:
                if r.chunk_id not in seen and r.chunk_id != chunk_id:
                    seen.add(r.chunk_id)
                    unique_results.append(r)

            return unique_results[:top_k]

        except Exception as e:
            logger.error(f"Failed to get related chunks: {e}")
            return []


class MultiQueryRetriever:
    """
    Decompose complex queries into sub-queries and retrieve in parallel.
    Implements the multi-agent parallel retrieval pattern.
    """

    def __init__(self, base_retriever: HybridRetriever):
        self.retriever = base_retriever

    def decompose_query(self, query: str) -> list[str]:
        """
        Decompose a complex query into simpler sub-queries.

        Heuristics:
        - Split on conjunctions (and, or, also)
        - Identify implicit sub-questions
        - Extract entities and their relationships
        """
        sub_queries = [query]  # Always include original

        # Split on common conjunctions
        conjunctions = [" and ", " or ", " also ", " as well as ", ". "]

        for conj in conjunctions:
            if conj in query.lower():
                parts = query.lower().split(conj)
                sub_queries.extend([p.strip() for p in parts if len(p.strip()) > 10])

        # Extract question patterns
        patterns = [
            r"how (?:do|can|should) I (.+?)\?",
            r"what (?:is|are) (?:the )?(.+?)\?",
            r"where (?:is|are|should) (.+?)\?",
        ]

        import re
        for pattern in patterns:
            matches = re.findall(pattern, query.lower())
            sub_queries.extend(matches)

        # Deduplicate while preserving order
        seen = set()
        unique = []
        for q in sub_queries:
            if q.lower() not in seen:
                seen.add(q.lower())
                unique.append(q)

        return unique

    def search(
        self,
        query: str,
        top_k: int = 10,
        decompose: bool = True
    ) -> list[RetrievalResult]:
        """
        Search with query decomposition and result merging.
        """
        if not decompose:
            return self.retriever.search(query, top_k)

        sub_queries = self.decompose_query(query)
        logger.info(f"Decomposed into {len(sub_queries)} sub-queries")

        # Retrieve for each sub-query
        all_results = []
        for sub_query in sub_queries:
            results = self.retriever.search(
                sub_query,
                top_k=top_k // len(sub_queries) + 1
            )
            all_results.extend(results)

        # Merge and deduplicate
        seen = set()
        merged = []
        for r in sorted(all_results, key=lambda x: x.score, reverse=True):
            if r.chunk_id not in seen:
                seen.add(r.chunk_id)
                merged.append(r)

        return merged[:top_k]


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="RAG Agent Retriever")
    parser.add_argument(
        "--query",
        required=True,
        help="Search query"
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=10,
        help="Number of results"
    )
    parser.add_argument(
        "--source",
        help="Filter by source name"
    )
    parser.add_argument(
        "--source-type",
        choices=["code", "skill", "docs", "config"],
        help="Filter by source type"
    )
    parser.add_argument(
        "--decompose",
        action="store_true",
        help="Decompose query into sub-queries"
    )
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Path to config file"
    )

    args = parser.parse_args()

    retriever = HybridRetriever(config_path=args.config)

    if args.decompose:
        multi_retriever = MultiQueryRetriever(retriever)
        results = multi_retriever.search(
            args.query,
            top_k=args.top_k,
            decompose=True
        )
    else:
        results = retriever.search(
            args.query,
            top_k=args.top_k,
            source_filter=args.source,
            source_type_filter=args.source_type
        )

    print("\n" + "=" * 60)
    print(f"SEARCH RESULTS ({len(results)} found)")
    print("=" * 60)

    for i, result in enumerate(results, 1):
        print(f"\n--- Result {i} (score: {result.score:.4f}) ---")
        print(f"Source: {result.source} ({result.source_type})")
        print(f"File: {result.file_path}:{result.start_line}-{result.end_line}")
        if result.header_hierarchy:
            print(f"Headers: {' > '.join(result.header_hierarchy)}")
        print(f"Content: {result.content[:500]}...")


if __name__ == "__main__":
    main()
