#!/usr/bin/env python3
"""
RAG Agent Indexer - Hierarchical Document Indexing Pipeline

Indexes best practices from Next.js 16, React 19, Supabase docs alongside
GenHub project code. Uses hierarchical chunking with parent/child strategy
for optimal retrieval accuracy.
"""

import os
import re
import json
import hashlib
import logging
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

import yaml
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("rag-indexer")


@dataclass
class Chunk:
    """Represents a document chunk with metadata."""
    id: str
    content: str
    source: str
    source_type: str  # 'code', 'skill', 'docs', 'config'
    file_path: str
    start_line: int
    end_line: int
    chunk_type: str  # 'parent' or 'child'
    parent_id: Optional[str] = None
    header_hierarchy: list[str] = field(default_factory=list)
    embedding: Optional[list[float]] = None
    sparse_vector: Optional[dict] = None
    priority: int = 1
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class HierarchicalChunker:
    """
    Hierarchical chunking strategy:
    - Parent chunks: Large sections based on markdown headers
    - Child chunks: Fixed-size with overlap for precise search
    """

    def __init__(
        self,
        parent_strategy: str = "markdown_headers",
        child_chunk_size: int = 500,
        child_overlap: int = 100,
        merge_threshold: int = 2000,
        split_threshold: int = 10000
    ):
        self.parent_strategy = parent_strategy
        self.child_chunk_size = child_chunk_size
        self.child_overlap = child_overlap
        self.merge_threshold = merge_threshold
        self.split_threshold = split_threshold

    def _generate_id(self, content: str, source: str) -> str:
        """Generate unique chunk ID from content hash."""
        hash_input = f"{source}:{content[:500]}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:16]

    def _extract_headers(self, content: str) -> list[tuple[int, int, str, int]]:
        """Extract markdown headers with positions and levels."""
        header_pattern = r'^(#{1,6})\s+(.+)$'
        headers = []

        for i, line in enumerate(content.split('\n')):
            match = re.match(header_pattern, line)
            if match:
                level = len(match.group(1))
                title = match.group(2).strip()
                headers.append((i, level, title, len('\n'.join(content.split('\n')[:i]))))

        return headers

    def _split_by_headers(
        self,
        content: str,
        source: str,
        source_type: str,
        file_path: str
    ) -> list[Chunk]:
        """Split content into parent chunks based on headers."""
        headers = self._extract_headers(content)
        lines = content.split('\n')
        chunks = []

        if not headers:
            # No headers, treat entire content as one chunk
            parent_id = self._generate_id(content, source)
            chunks.append(Chunk(
                id=parent_id,
                content=content,
                source=source,
                source_type=source_type,
                file_path=file_path,
                start_line=1,
                end_line=len(lines),
                chunk_type="parent",
                header_hierarchy=[]
            ))
            return chunks

        # Build header hierarchy and extract sections
        current_hierarchy = []

        for i, (line_num, level, title, _) in enumerate(headers):
            # Find end of this section
            if i + 1 < len(headers):
                end_line = headers[i + 1][0]
            else:
                end_line = len(lines)

            # Update hierarchy
            while len(current_hierarchy) >= level:
                current_hierarchy.pop()
            current_hierarchy.append(title)

            # Extract section content
            section_content = '\n'.join(lines[line_num:end_line])

            # Skip if too small and not a top-level header
            if len(section_content) < self.merge_threshold and level > 2:
                continue

            parent_id = self._generate_id(section_content, f"{source}:{title}")

            chunks.append(Chunk(
                id=parent_id,
                content=section_content,
                source=source,
                source_type=source_type,
                file_path=file_path,
                start_line=line_num + 1,
                end_line=end_line,
                chunk_type="parent",
                header_hierarchy=list(current_hierarchy)
            ))

        return chunks

    def _create_child_chunks(self, parent: Chunk) -> list[Chunk]:
        """Create fixed-size child chunks from parent with overlap."""
        content = parent.content
        words = content.split()
        children = []

        if len(words) <= self.child_chunk_size:
            # Content fits in one child
            child_id = self._generate_id(content, f"{parent.id}:child:0")
            children.append(Chunk(
                id=child_id,
                content=content,
                source=parent.source,
                source_type=parent.source_type,
                file_path=parent.file_path,
                start_line=parent.start_line,
                end_line=parent.end_line,
                chunk_type="child",
                parent_id=parent.id,
                header_hierarchy=parent.header_hierarchy,
                priority=parent.priority
            ))
            return children

        # Split into overlapping chunks
        start = 0
        chunk_num = 0

        while start < len(words):
            end = min(start + self.child_chunk_size, len(words))
            chunk_words = words[start:end]
            chunk_content = ' '.join(chunk_words)

            child_id = self._generate_id(chunk_content, f"{parent.id}:child:{chunk_num}")

            # Estimate line numbers
            progress = start / len(words)
            line_span = parent.end_line - parent.start_line
            est_start = int(parent.start_line + progress * line_span)
            est_end = int(est_start + (self.child_chunk_size / len(words)) * line_span)

            children.append(Chunk(
                id=child_id,
                content=chunk_content,
                source=parent.source,
                source_type=parent.source_type,
                file_path=parent.file_path,
                start_line=est_start,
                end_line=min(est_end, parent.end_line),
                chunk_type="child",
                parent_id=parent.id,
                header_hierarchy=parent.header_hierarchy,
                priority=parent.priority
            ))

            start = end - self.child_overlap
            chunk_num += 1

        return children

    def chunk_document(
        self,
        content: str,
        source: str,
        source_type: str,
        file_path: str,
        priority: int = 1
    ) -> tuple[list[Chunk], list[Chunk]]:
        """
        Chunk a document into parent and child chunks.
        Returns (parent_chunks, child_chunks).
        """
        # Create parent chunks
        parents = self._split_by_headers(content, source, source_type, file_path)

        # Set priority
        for parent in parents:
            parent.priority = priority

        # Create child chunks from each parent
        all_children = []
        for parent in parents:
            children = self._create_child_chunks(parent)
            all_children.extend(children)

        logger.info(f"Chunked {file_path}: {len(parents)} parents, {len(all_children)} children")
        return parents, all_children


class CodeChunker:
    """Specialized chunker for source code files."""

    def __init__(self, chunk_size: int = 100, overlap: int = 20):
        self.chunk_size = chunk_size  # lines
        self.overlap = overlap

    def _generate_id(self, content: str, source: str) -> str:
        hash_input = f"{source}:{content[:500]}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:16]

    def _extract_code_structure(self, content: str, file_ext: str) -> list[dict]:
        """Extract structural elements from code (functions, classes, etc.)."""
        structures = []
        lines = content.split('\n')

        if file_ext in ['.ts', '.tsx', '.js', '.jsx']:
            # TypeScript/JavaScript patterns
            patterns = [
                (r'^(?:export\s+)?(?:async\s+)?function\s+(\w+)', 'function'),
                (r'^(?:export\s+)?class\s+(\w+)', 'class'),
                (r'^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(', 'arrow_function'),
                (r'^(?:export\s+)?interface\s+(\w+)', 'interface'),
                (r'^(?:export\s+)?type\s+(\w+)', 'type'),
            ]

            for i, line in enumerate(lines):
                for pattern, struct_type in patterns:
                    match = re.match(pattern, line.strip())
                    if match:
                        structures.append({
                            'name': match.group(1),
                            'type': struct_type,
                            'line': i + 1
                        })

        return structures

    def chunk_code(
        self,
        content: str,
        source: str,
        file_path: str,
        priority: int = 1
    ) -> tuple[list[Chunk], list[Chunk]]:
        """Chunk source code into hierarchical chunks."""
        file_ext = Path(file_path).suffix
        lines = content.split('\n')
        structures = self._extract_code_structure(content, file_ext)

        parents = []
        children = []

        if not structures:
            # No clear structure, chunk by lines
            parent_id = self._generate_id(content, source)
            parent = Chunk(
                id=parent_id,
                content=content,
                source=source,
                source_type="code",
                file_path=file_path,
                start_line=1,
                end_line=len(lines),
                chunk_type="parent",
                priority=priority
            )
            parents.append(parent)

            # Create line-based children
            for i in range(0, len(lines), self.chunk_size - self.overlap):
                end = min(i + self.chunk_size, len(lines))
                chunk_content = '\n'.join(lines[i:end])

                child_id = self._generate_id(chunk_content, f"{parent_id}:{i}")
                children.append(Chunk(
                    id=child_id,
                    content=chunk_content,
                    source=source,
                    source_type="code",
                    file_path=file_path,
                    start_line=i + 1,
                    end_line=end,
                    chunk_type="child",
                    parent_id=parent_id,
                    priority=priority
                ))
        else:
            # Chunk by code structure
            for i, struct in enumerate(structures):
                # Find end of this structure
                if i + 1 < len(structures):
                    end_line = structures[i + 1]['line'] - 1
                else:
                    end_line = len(lines)

                start_line = struct['line']
                struct_content = '\n'.join(lines[start_line - 1:end_line])

                parent_id = self._generate_id(
                    struct_content,
                    f"{source}:{struct['type']}:{struct['name']}"
                )

                parent = Chunk(
                    id=parent_id,
                    content=struct_content,
                    source=source,
                    source_type="code",
                    file_path=file_path,
                    start_line=start_line,
                    end_line=end_line,
                    chunk_type="parent",
                    header_hierarchy=[struct['type'], struct['name']],
                    priority=priority
                )
                parents.append(parent)

                # Create child if structure is large
                if end_line - start_line > self.chunk_size:
                    for j in range(0, end_line - start_line, self.chunk_size - self.overlap):
                        chunk_start = start_line + j
                        chunk_end = min(chunk_start + self.chunk_size, end_line)
                        chunk_content = '\n'.join(lines[chunk_start - 1:chunk_end])

                        child_id = self._generate_id(chunk_content, f"{parent_id}:{j}")
                        children.append(Chunk(
                            id=child_id,
                            content=chunk_content,
                            source=source,
                            source_type="code",
                            file_path=file_path,
                            start_line=chunk_start,
                            end_line=chunk_end,
                            chunk_type="child",
                            parent_id=parent_id,
                            header_hierarchy=parent.header_hierarchy,
                            priority=priority
                        ))
                else:
                    # Small structure, use as child directly
                    children.append(Chunk(
                        id=self._generate_id(struct_content, f"{parent_id}:0"),
                        content=struct_content,
                        source=source,
                        source_type="code",
                        file_path=file_path,
                        start_line=start_line,
                        end_line=end_line,
                        chunk_type="child",
                        parent_id=parent_id,
                        header_hierarchy=parent.header_hierarchy,
                        priority=priority
                    ))

        logger.info(f"Chunked code {file_path}: {len(parents)} parents, {len(children)} children")
        return parents, children


class EmbeddingGenerator:
    """Generate dense and sparse embeddings for chunks."""

    def __init__(
        self,
        dense_model: str = "all-MiniLM-L6-v2",
        device: str = "cpu"
    ):
        logger.info(f"Loading embedding model: {dense_model}")
        self.dense_model = SentenceTransformer(dense_model, device=device)
        self.bm25_corpus = []
        self.bm25 = None

    def generate_dense(self, texts: list[str]) -> list[list[float]]:
        """Generate dense embeddings using sentence transformer."""
        embeddings = self.dense_model.encode(
            texts,
            show_progress_bar=True,
            convert_to_numpy=True,
            batch_size=32  # Process in small batches to avoid OOM
        )
        return embeddings.tolist()

    def build_bm25_index(self, texts: list[str]) -> None:
        """Build BM25 index for sparse retrieval."""
        tokenized = [text.lower().split() for text in texts]
        self.bm25_corpus = tokenized
        self.bm25 = BM25Okapi(tokenized)
        logger.info(f"Built BM25 index with {len(texts)} documents")

    def get_bm25_scores(self, query: str) -> list[float]:
        """Get BM25 scores for a query."""
        if self.bm25 is None:
            raise ValueError("BM25 index not built. Call build_bm25_index first.")
        tokenized_query = query.lower().split()
        return self.bm25.get_scores(tokenized_query).tolist()


class QdrantIndexer:
    """Manage Qdrant vector database for RAG."""

    def __init__(
        self,
        path: str = "./.qdrant_data",
        collection_name: str = "genhub_rag",
        vector_size: int = 384  # all-MiniLM-L6-v2 dimension
    ):
        self.path = path
        self.collection_name = collection_name
        self.vector_size = vector_size
        self.client = QdrantClient(path=path)
        self._ensure_collection()

    def _ensure_collection(self) -> None:
        """Create collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        exists = any(c.name == self.collection_name for c in collections)

        if not exists:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created collection: {self.collection_name}")
        else:
            logger.info(f"Collection exists: {self.collection_name}")

    def upsert_chunks(self, chunks: list[Chunk]) -> None:
        """Upsert chunks with embeddings to Qdrant."""
        if not chunks:
            return

        points = []
        for i, chunk in enumerate(chunks):
            if chunk.embedding is None:
                logger.warning(f"Chunk {chunk.id} has no embedding, skipping")
                continue

            points.append(PointStruct(
                id=i,  # Using index as ID, could use UUID
                vector=chunk.embedding,
                payload={
                    "chunk_id": chunk.id,
                    "content": chunk.content,
                    "source": chunk.source,
                    "source_type": chunk.source_type,
                    "file_path": chunk.file_path,
                    "start_line": chunk.start_line,
                    "end_line": chunk.end_line,
                    "chunk_type": chunk.chunk_type,
                    "parent_id": chunk.parent_id,
                    "header_hierarchy": chunk.header_hierarchy,
                    "priority": chunk.priority,
                    "created_at": chunk.created_at
                }
            ))

        if points:
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info(f"Upserted {len(points)} chunks to Qdrant")

    def get_collection_info(self) -> dict:
        """Get collection statistics."""
        info = self.client.get_collection(self.collection_name)
        return {
            "name": self.collection_name,
            "points_count": info.points_count,
            "status": str(info.status)
        }


class RAGIndexer:
    """
    Main indexer orchestrating the full indexing pipeline.

    Pipeline:
    1. Scan sources (codebase, skills, external docs)
    2. Chunk documents hierarchically
    3. Generate embeddings (dense + sparse)
    4. Store in Qdrant
    """

    def __init__(self, config_path: str = "config/config.yaml", project_root: str = None):
        self.config = self._load_config(config_path)

        # Project root for resolving relative paths (default to cwd)
        self.project_root = Path(project_root) if project_root else Path.cwd()
        logger.info(f"Project root: {self.project_root}")

        # Initialize components
        indexing_config = self.config.get("indexing", {})
        self.doc_chunker = HierarchicalChunker(
            parent_strategy=indexing_config.get("parent_chunk_strategy", "markdown_headers"),
            child_chunk_size=indexing_config.get("child_chunk_size", 500),
            child_overlap=indexing_config.get("child_chunk_overlap", 100),
            merge_threshold=indexing_config.get("merge_threshold", 2000),
            split_threshold=indexing_config.get("split_threshold", 10000)
        )
        self.code_chunker = CodeChunker()

        retrieval_config = self.config.get("retrieval", {})
        self.embedder = EmbeddingGenerator(
            dense_model=retrieval_config.get("dense_model", "all-mpnet-base-v2")
        )

        # Resolve qdrant path relative to project root
        qdrant_path = retrieval_config.get("qdrant_path", "./.qdrant_data")
        if not Path(qdrant_path).is_absolute():
            qdrant_path = str(self.project_root / qdrant_path)

        self.qdrant = QdrantIndexer(
            path=qdrant_path,
            collection_name=retrieval_config.get("collection_name", "genhub_rag"),
            vector_size=384  # all-MiniLM-L6-v2 dimension
        )

        # Batching for memory efficiency
        self.batch_size = 50  # Process chunks in batches
        self.pending_chunks: list[Chunk] = []

        # Statistics
        self.total_parents = 0
        self.total_children = 0

    def _resolve_path(self, path: str) -> Path:
        """Resolve a path relative to project root."""
        p = Path(path)
        if p.is_absolute():
            return p
        return self.project_root / path

    def _load_config(self, path: str) -> dict:
        """Load configuration from YAML."""
        # Try absolute path first, then relative to script
        config_file = Path(path)
        if not config_file.is_absolute():
            config_file = Path(__file__).parent.parent / path

        if not config_file.exists():
            logger.warning(f"Config not found at {config_file}, using defaults")
            return {}

        with open(config_file) as f:
            return yaml.safe_load(f)

    def _should_exclude_dir(self, dir_path: Path, exclude: list[str]) -> bool:
        """Check if a directory should be excluded from traversal."""
        dir_str = str(dir_path)
        dir_name = dir_path.name

        # Quick check for common excludes
        common_excludes = {'node_modules', '.git', '.next', 'dist', '.venv', '__pycache__'}
        if dir_name in common_excludes:
            return True

        # Check exclude patterns
        for exc in exclude:
            # Handle **/ patterns by checking if dir name matches the base
            if exc.endswith('/**'):
                base = exc[:-3]
                if dir_name == base or dir_str.endswith(f'/{base}') or dir_str == base:
                    return True
            elif '**' in exc:
                # For patterns like .claude/skills/rag-agent/.venv/**
                base_pattern = exc.replace('/**', '').replace('**/', '')
                if base_pattern in dir_str:
                    return True

        return False

    def _should_include_file(self, file_path: Path, patterns: list[str], exclude: list[str]) -> bool:
        """Check if file matches include patterns and not exclude."""
        from fnmatch import fnmatch

        rel_path = str(file_path)

        # Check excludes first
        for exc in exclude:
            # Handle glob-style patterns
            if '**' in exc:
                # Convert ** to work with simple matching
                simple_exc = exc.replace('**/', '').replace('/**', '')
                if simple_exc in rel_path:
                    return False
            elif fnmatch(rel_path, exc):
                return False

        # Check includes
        for pat in patterns:
            if '**' in pat:
                # For **/*.ts style patterns, check the extension
                if pat.startswith('**/'):
                    suffix = pat[3:]  # e.g., "*.ts"
                    if fnmatch(file_path.name, suffix):
                        return True
            elif fnmatch(rel_path, pat):
                return True

        return False

    def _get_source_type(self, file_path: str) -> str:
        """Determine source type from file path."""
        if ".claude/skills" in file_path:
            return "skill"
        elif file_path.endswith(".md"):
            return "docs"
        elif file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
            return "code"
        elif file_path.endswith((".yaml", ".yml", ".json")):
            return "config"
        else:
            return "other"

    def _process_batch(self) -> None:
        """Process pending chunks: embed and store in Qdrant."""
        if not self.pending_chunks:
            return

        chunks = self.pending_chunks
        self.pending_chunks = []

        # Generate embeddings for this batch
        texts = [chunk.content for chunk in chunks]
        logger.info(f"Embedding batch of {len(chunks)} chunks...")
        embeddings = self.embedder.generate_dense(texts)

        # Assign embeddings
        for chunk, embedding in zip(chunks, embeddings):
            chunk.embedding = embedding

        # Store in Qdrant
        logger.info(f"Storing {len(chunks)} chunks to Qdrant...")
        self.qdrant.upsert_chunks(chunks)

    def index_directory(
        self,
        path: str,
        patterns: list[str],
        exclude: list[str],
        source_name: str,
        priority: int = 1
    ) -> None:
        """Index all matching files in a directory."""
        import os

        base_path = Path(path)
        if not base_path.exists():
            logger.warning(f"Path does not exist: {path}")
            return

        logger.info(f"Starting directory scan at: {base_path}")
        logger.info(f"Patterns: {patterns}")
        logger.info(f"Exclude: {exclude}")

        file_count = 0
        try:
            # Use os.walk for better control over directory pruning
            for root, dirs, files in os.walk(base_path):
                root_path = Path(root)
                rel_root = root_path.relative_to(base_path) if root_path != base_path else Path('.')

                # Prune excluded directories in-place (modifying dirs affects os.walk)
                dirs[:] = [d for d in dirs if not self._should_exclude_dir(root_path / d, exclude)]

                for filename in files:
                    file_path = root_path / filename
                    rel_path = rel_root / filename if rel_root != Path('.') else Path(filename)

                    if not self._should_include_file(rel_path, patterns, exclude):
                        continue

                    file_count += 1
                    if file_count % 50 == 0:
                        logger.info(f"Scanned {file_count} files...")

                    try:
                        content = file_path.read_text(encoding="utf-8")
                    except Exception as e:
                        logger.warning(f"Could not read {file_path}: {e}")
                        continue

                    source_type = self._get_source_type(str(file_path))

                    # Choose chunker based on type
                    if source_type == "code":
                        parents, children = self.code_chunker.chunk_code(
                            content=content,
                            source=source_name,
                            file_path=str(rel_path),
                            priority=priority
                        )
                    else:
                        parents, children = self.doc_chunker.chunk_document(
                            content=content,
                            source=source_name,
                            source_type=source_type,
                            file_path=str(rel_path),
                            priority=priority
                        )

                    # Add to pending batch
                    self.pending_chunks.extend(parents)
                    self.pending_chunks.extend(children)
                    self.total_parents += len(parents)
                    self.total_children += len(children)

                    # Process batch when it gets full
                    if len(self.pending_chunks) >= self.batch_size:
                        self._process_batch()

            # Process any remaining chunks
            if self.pending_chunks:
                self._process_batch()

            logger.info(f"Finished scanning {file_count} files in {path}")
        except Exception as e:
            logger.error(f"Error scanning directory {path}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise

    def index_codebase(self) -> None:
        """Index the GenHub codebase."""
        sources = self.config.get("indexing", {}).get("sources", {})

        # Index priority skills first (P0)
        for skill in sources.get("priority_skills", []):
            skill_path = self._resolve_path(skill["path"])
            logger.info(f"Indexing priority skill: {skill['name']} at {skill_path}")
            self.index_directory(
                path=str(skill_path),
                patterns=skill.get("patterns", ["**/*.md"]),
                exclude=[],
                source_name=skill["name"],
                priority=skill.get("priority", 0)
            )

        # Index project instructions
        for instr in sources.get("project_instructions", []):
            if instr.get("type") == "mcp":
                # Skip MCP sources for now (handled at runtime)
                continue

            path = self._resolve_path(instr["path"])
            if path.is_file():
                try:
                    content = path.read_text(encoding="utf-8")
                    parents, children = self.doc_chunker.chunk_document(
                        content=content,
                        source=instr["name"],
                        source_type="docs",
                        file_path=str(path),
                        priority=instr.get("priority", 0)
                    )
                    # Add to batch
                    self.pending_chunks.extend(parents)
                    self.pending_chunks.extend(children)
                    self.total_parents += len(parents)
                    self.total_children += len(children)

                    # Process if batch is full
                    if len(self.pending_chunks) >= self.batch_size:
                        self._process_batch()

                    logger.info(f"Indexed {instr['name']}: {len(parents)} parents, {len(children)} children")
                except Exception as e:
                    logger.warning(f"Could not index {instr['name']}: {e}")

        # Index main codebase
        codebase = sources.get("codebase", {})
        if codebase:
            codebase_path = self._resolve_path(codebase.get("path", "."))
            logger.info(f"Indexing main codebase at: {codebase_path}")
            logger.info(f"Path exists: {codebase_path.exists()}, is_dir: {codebase_path.is_dir()}")

            if not codebase_path.exists() or not codebase_path.is_dir():
                logger.error(f"Invalid codebase path: {codebase_path}")
                return

            self.index_directory(
                path=str(codebase_path),
                patterns=codebase.get("patterns", ["**/*.ts", "**/*.tsx"]),
                exclude=codebase.get("exclude", ["node_modules/**"]),
                source_name="genhub",
                priority=codebase.get("priority", 1)
            )

    def finalize_indexing(self) -> None:
        """Finalize indexing by processing any remaining chunks."""
        # Process any remaining chunks in the batch
        if self.pending_chunks:
            logger.info(f"Processing final batch of {len(self.pending_chunks)} chunks...")
            self._process_batch()

    def run(self) -> dict:
        """Run the full indexing pipeline with streaming/batching."""
        logger.info("Starting RAG indexing pipeline (streaming mode)...")

        # Step 1: Index sources (chunks are embedded and stored as we go)
        self.index_codebase()

        # Step 2: Finalize by processing any remaining chunks
        self.finalize_indexing()

        # Return statistics
        stats = {
            "parents_indexed": self.total_parents,
            "children_indexed": self.total_children,
            "total_chunks": self.total_parents + self.total_children,
            "collection_info": self.qdrant.get_collection_info()
        }

        logger.info(f"Indexing complete: {stats}")
        return stats


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="RAG Agent Indexer")
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Path to config file"
    )
    parser.add_argument(
        "--project-root",
        default=None,
        help="Project root directory (defaults to current working directory)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    indexer = RAGIndexer(config_path=args.config, project_root=args.project_root)
    stats = indexer.run()

    print("\n" + "=" * 50)
    print("INDEXING COMPLETE")
    print("=" * 50)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
