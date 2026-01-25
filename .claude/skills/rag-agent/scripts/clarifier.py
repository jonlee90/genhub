#!/usr/bin/env python3
"""
RAG Agent Clarifier - Query Clarification and Decomposition

Transforms vague or complex queries into retrieval-optimized queries.
Supports human-in-the-loop clarification for ambiguous inputs.
"""

import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("rag-clarifier")


@dataclass
class ClarificationRequest:
    """Request for user clarification."""
    question: str
    options: list[str]
    context: str
    required: bool = True


@dataclass
class ClarifiedQuery:
    """Result of query clarification."""
    original_query: str
    clarified_query: str
    sub_queries: list[str]
    context_hints: list[str]
    file_patterns: list[str]
    clarifications_needed: list[ClarificationRequest]
    confidence: float

    def is_ready(self) -> bool:
        """Check if query is ready for retrieval."""
        return len(self.clarifications_needed) == 0 and self.confidence >= 0.7


class QueryAnalyzer:
    """Analyze queries for ambiguity and complexity."""

    # Query type patterns
    PATTERNS = {
        "how_to": r"how (?:do|can|should|to) (?:I|we|you)\s+(.+)",
        "what_is": r"what (?:is|are|was|were)\s+(.+)",
        "where_is": r"where (?:is|are|should|can)\s+(.+)",
        "why_does": r"why (?:does|do|did|is|are)\s+(.+)",
        "can_i": r"can (?:I|we|you)\s+(.+)",
        "implement": r"implement\s+(.+)",
        "fix": r"fix\s+(.+)",
        "debug": r"debug\s+(.+)",
        "optimize": r"optimize\s+(.+)",
        "refactor": r"refactor\s+(.+)",
    }

    # Ambiguity signals
    AMBIGUOUS_TERMS = [
        "this", "that", "it", "thing", "stuff", "something",
        "the thing", "the one", "previous", "earlier", "last"
    ]

    # Technical context hints
    TECH_CONTEXT = {
        "server component": ["rendering-*", "async-*", "Next.js"],
        "server action": ["app/actions/*", "postgres-*", "mutations"],
        "client component": ["use client", "rendering-*", "hooks"],
        "authentication": ["auth", "session", "login", "Auth.js"],
        "database": ["supabase", "postgres", "RLS", "migrations"],
        "modal": ["ResponsiveModal", "dialog", "sheet"],
        "form": ["react-hook-form", "validation", "zod"],
        "table": ["data table", "columns", "sorting", "filtering"],
        "performance": ["bundle", "LCP", "FID", "CLS", "rerender"],
        "testing": ["jest", "testing-library", "vitest", "e2e"],
    }

    # File pattern mapping
    FILE_PATTERNS = {
        "component": ["components/**/*.tsx", "app/**/*.tsx"],
        "server action": ["app/actions/*.ts"],
        "api route": ["app/api/**/*.ts"],
        "hook": ["hooks/**/*.ts", "lib/**/*.ts"],
        "type": ["types/**/*.ts"],
        "style": ["**/*.css", "tailwind.config.*"],
        "config": ["*.config.*", ".env*"],
        "migration": ["supabase/migrations/*.sql"],
    }

    def __init__(self):
        self.compiled_patterns = {
            name: re.compile(pattern, re.IGNORECASE)
            for name, pattern in self.PATTERNS.items()
        }

    def detect_query_type(self, query: str) -> tuple[str, Optional[str]]:
        """Detect the type of query and extract the subject."""
        for name, pattern in self.compiled_patterns.items():
            match = pattern.search(query)
            if match:
                return name, match.group(1)
        return "general", None

    def detect_ambiguity(self, query: str) -> list[str]:
        """Detect ambiguous terms that need clarification."""
        ambiguous = []
        query_lower = query.lower()

        for term in self.AMBIGUOUS_TERMS:
            if term in query_lower:
                ambiguous.append(term)

        return ambiguous

    def extract_tech_context(self, query: str) -> list[str]:
        """Extract technical context hints from query."""
        contexts = []
        query_lower = query.lower()

        for term, hints in self.TECH_CONTEXT.items():
            if term in query_lower:
                contexts.extend(hints)

        return list(set(contexts))

    def suggest_file_patterns(self, query: str) -> list[str]:
        """Suggest relevant file patterns based on query."""
        patterns = []
        query_lower = query.lower()

        for term, file_patterns in self.FILE_PATTERNS.items():
            if term in query_lower:
                patterns.extend(file_patterns)

        # Default patterns if none found
        if not patterns:
            if "component" in query_lower or "ui" in query_lower:
                patterns = self.FILE_PATTERNS["component"]
            elif "action" in query_lower or "database" in query_lower:
                patterns = self.FILE_PATTERNS["server action"]

        return list(set(patterns))

    def calculate_complexity(self, query: str) -> float:
        """Calculate query complexity score (0-1)."""
        score = 0.0

        # Length factor
        word_count = len(query.split())
        if word_count > 20:
            score += 0.3
        elif word_count > 10:
            score += 0.2

        # Multiple questions
        if query.count("?") > 1:
            score += 0.2

        # Conjunctions (multiple parts)
        conjunctions = [" and ", " or ", " also ", " as well as "]
        if any(conj in query.lower() for conj in conjunctions):
            score += 0.2

        # Technical complexity
        tech_terms = len(self.extract_tech_context(query))
        score += min(tech_terms * 0.1, 0.3)

        return min(score, 1.0)


class QueryDecomposer:
    """Decompose complex queries into simpler sub-queries."""

    def __init__(self, analyzer: QueryAnalyzer):
        self.analyzer = analyzer

    def decompose(self, query: str) -> list[str]:
        """
        Decompose a complex query into sub-queries.

        Strategies:
        1. Split on conjunctions
        2. Extract implicit sub-questions
        3. Separate concerns (what vs how)
        """
        sub_queries = []

        # Always include the original
        sub_queries.append(query)

        # Split on conjunctions
        for conj in [" and ", " or ", " also ", " as well as "]:
            if conj in query.lower():
                parts = re.split(re.escape(conj), query, flags=re.IGNORECASE)
                for part in parts:
                    part = part.strip()
                    if len(part) > 10:
                        sub_queries.append(part)

        # Split on sentence boundaries
        sentences = re.split(r'[.?!]+', query)
        for sent in sentences:
            sent = sent.strip()
            if len(sent) > 10 and sent not in sub_queries:
                sub_queries.append(sent)

        # Extract "how" and "what" separately
        query_type, subject = self.analyzer.detect_query_type(query)
        if subject and query_type in ["how_to", "implement"]:
            # Add a "what is" variant
            sub_queries.append(f"what is {subject}")
            # Add a "where is" variant
            sub_queries.append(f"where is {subject} in the codebase")

        # Deduplicate while preserving order
        seen = set()
        unique = []
        for q in sub_queries:
            q_normalized = q.lower().strip()
            if q_normalized not in seen and len(q_normalized) > 5:
                seen.add(q_normalized)
                unique.append(q)

        return unique


class QueryOptimizer:
    """Optimize queries for retrieval."""

    # Technical synonyms for expansion
    SYNONYMS = {
        "component": ["component", "tsx", "react"],
        "server action": ["server action", "use server", "mutation"],
        "hook": ["hook", "use", "custom hook"],
        "api": ["api", "route", "endpoint"],
        "auth": ["auth", "authentication", "login", "session"],
        "modal": ["modal", "dialog", "sheet", "drawer"],
        "table": ["table", "datagrid", "data table"],
    }

    def optimize(self, query: str, context_hints: list[str]) -> str:
        """
        Optimize a query for better retrieval.

        Strategies:
        1. Expand technical terms
        2. Add context hints
        3. Remove noise words
        """
        # Remove noise words
        noise_words = ["please", "help", "me", "i need", "i want", "could you"]
        optimized = query
        for noise in noise_words:
            optimized = re.sub(rf"\b{noise}\b", "", optimized, flags=re.IGNORECASE)

        # Clean up whitespace
        optimized = " ".join(optimized.split())

        # Add context hints if not already present
        for hint in context_hints[:2]:  # Limit hints
            if hint.lower() not in optimized.lower():
                optimized = f"{optimized} {hint}"

        return optimized.strip()


class QueryClarifier:
    """
    Main clarifier orchestrating query analysis, decomposition, and optimization.
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.analyzer = QueryAnalyzer()
        self.decomposer = QueryDecomposer(self.analyzer)
        self.optimizer = QueryOptimizer()

    def _load_config(self, path: str) -> dict:
        """Load configuration from YAML."""
        config_file = Path(__file__).parent.parent / path
        if not config_file.exists():
            return {}
        with open(config_file) as f:
            return yaml.safe_load(f)

    def clarify(
        self,
        query: str,
        conversation_history: Optional[list[dict]] = None
    ) -> ClarifiedQuery:
        """
        Clarify a query for optimal retrieval.

        Args:
            query: The user's query
            conversation_history: Previous messages for context

        Returns:
            ClarifiedQuery with optimized queries and any clarifications needed
        """
        # Analyze the query
        query_type, subject = self.analyzer.detect_query_type(query)
        ambiguous_terms = self.analyzer.detect_ambiguity(query)
        context_hints = self.analyzer.extract_tech_context(query)
        file_patterns = self.analyzer.suggest_file_patterns(query)
        complexity = self.analyzer.calculate_complexity(query)

        # Build clarification requests for ambiguous terms
        clarifications_needed = []
        for term in ambiguous_terms:
            clarifications_needed.append(ClarificationRequest(
                question=f"What does '{term}' refer to?",
                options=self._suggest_options(term, query, conversation_history),
                context=f"Found ambiguous reference: '{term}'",
                required=True
            ))

        # Decompose if complex
        if complexity > 0.5:
            sub_queries = self.decomposer.decompose(query)
        else:
            sub_queries = [query]

        # Optimize the main query
        clarified_query = self.optimizer.optimize(query, context_hints)

        # Calculate confidence
        confidence = 1.0 - (len(ambiguous_terms) * 0.2) - (complexity * 0.2)
        confidence = max(confidence, 0.0)

        return ClarifiedQuery(
            original_query=query,
            clarified_query=clarified_query,
            sub_queries=sub_queries,
            context_hints=context_hints,
            file_patterns=file_patterns,
            clarifications_needed=clarifications_needed,
            confidence=confidence
        )

    def _suggest_options(
        self,
        term: str,
        query: str,
        history: Optional[list[dict]]
    ) -> list[str]:
        """Suggest options for ambiguous terms."""
        # Default generic options
        options = [
            "A specific component in the UI",
            "A server action or API route",
            "A database table or query",
            "Something from the previous conversation"
        ]

        # Try to infer from conversation history
        if history:
            recent_files = []
            recent_topics = []
            for msg in history[-5:]:  # Last 5 messages
                content = msg.get("content", "")
                # Extract file references
                file_matches = re.findall(r'[\w/]+\.(?:tsx?|jsx?|sql|md)', content)
                recent_files.extend(file_matches)
                # Extract component/function names
                name_matches = re.findall(r'\b[A-Z][a-zA-Z]+(?:Component|Action|Hook)\b', content)
                recent_topics.extend(name_matches)

            if recent_files:
                options.insert(0, f"File: {recent_files[-1]}")
            if recent_topics:
                options.insert(0, f"Symbol: {recent_topics[-1]}")

        return options[:4]  # Limit to 4 options

    def apply_clarifications(
        self,
        original: ClarifiedQuery,
        answers: dict[str, str]
    ) -> ClarifiedQuery:
        """
        Apply user's clarification answers and re-clarify.

        Args:
            original: The original ClarifiedQuery
            answers: Dict mapping question to user's answer

        Returns:
            Updated ClarifiedQuery with clarifications resolved
        """
        # Build context from answers
        context_additions = list(answers.values())

        # Re-optimize with additional context
        new_query = f"{original.original_query}. Context: {'. '.join(context_additions)}"

        return self.clarify(new_query)


def main():
    """CLI entry point."""
    import argparse
    import json

    parser = argparse.ArgumentParser(description="RAG Agent Query Clarifier")
    parser.add_argument(
        "--query",
        required=True,
        help="Query to clarify"
    )
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Path to config file"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )

    args = parser.parse_args()

    clarifier = QueryClarifier(config_path=args.config)
    result = clarifier.clarify(args.query)

    if args.json:
        output = {
            "original_query": result.original_query,
            "clarified_query": result.clarified_query,
            "sub_queries": result.sub_queries,
            "context_hints": result.context_hints,
            "file_patterns": result.file_patterns,
            "confidence": result.confidence,
            "is_ready": result.is_ready(),
            "clarifications_needed": [
                {
                    "question": c.question,
                    "options": c.options,
                    "context": c.context
                }
                for c in result.clarifications_needed
            ]
        }
        print(json.dumps(output, indent=2))
    else:
        print("\n" + "=" * 60)
        print("QUERY CLARIFICATION")
        print("=" * 60)
        print(f"\nOriginal: {result.original_query}")
        print(f"Clarified: {result.clarified_query}")
        print(f"Confidence: {result.confidence:.2f}")
        print(f"Ready: {result.is_ready()}")

        if result.sub_queries:
            print(f"\nSub-queries ({len(result.sub_queries)}):")
            for i, sq in enumerate(result.sub_queries, 1):
                print(f"  {i}. {sq}")

        if result.context_hints:
            print(f"\nContext hints: {', '.join(result.context_hints)}")

        if result.file_patterns:
            print(f"\nFile patterns: {', '.join(result.file_patterns)}")

        if result.clarifications_needed:
            print(f"\nClarifications needed ({len(result.clarifications_needed)}):")
            for c in result.clarifications_needed:
                print(f"  Q: {c.question}")
                for opt in c.options:
                    print(f"     - {opt}")


if __name__ == "__main__":
    main()
