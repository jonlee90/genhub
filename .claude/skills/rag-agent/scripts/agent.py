#!/usr/bin/env python3
"""
RAG Agent - Main Integration Module

Orchestrates the full RAG pipeline:
1. Query clarification and decomposition
2. Hybrid retrieval with parent-child lookup
3. LLM-optimized response synthesis
4. Optimization analysis (optional)

This is the main entry point for the RAG agent skill.
"""

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import yaml

from clarifier import QueryClarifier, ClarifiedQuery
from retriever import HybridRetriever, MultiQueryRetriever, RetrievalResult
from synthesizer import ResponseSynthesizer, OptimizationAnalyzer, SynthesizedResponse
from auto_trigger import AutoTrigger, ComplexityAssessment

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("rag-agent")


@dataclass
class RAGResponse:
    """Complete RAG agent response."""
    query: str
    clarified_query: ClarifiedQuery
    retrieval_results: list[RetrievalResult]
    synthesized_response: SynthesizedResponse
    complexity_assessment: Optional[ComplexityAssessment]
    optimization_recommendations: list[dict]

    def to_markdown(self) -> str:
        """Generate full markdown output."""
        return self.synthesized_response.to_markdown()

    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization."""
        return {
            "query": self.query,
            "clarified_query": {
                "original": self.clarified_query.original_query,
                "clarified": self.clarified_query.clarified_query,
                "sub_queries": self.clarified_query.sub_queries,
                "confidence": self.clarified_query.confidence,
            },
            "retrieval_count": len(self.retrieval_results),
            "sources": list(set(r.source for r in self.retrieval_results)),
            "synthesized": {
                "confidence": self.synthesized_response.confidence,
                "files_to_modify": self.synthesized_response.files_to_modify,
                "blocking_rules": [
                    {"id": r.id, "message": r.message}
                    for r in self.synthesized_response.blocking_rules
                ],
            },
            "complexity": {
                "score": self.complexity_assessment.score if self.complexity_assessment else None,
                "should_trigger": self.complexity_assessment.should_trigger if self.complexity_assessment else None,
            },
            "optimizations": self.optimization_recommendations,
        }


class RAGAgent:
    """
    Main RAG Agent orchestrating the full pipeline.

    Usage:
        agent = RAGAgent()
        response = agent.query("How do I add authentication?")
        print(response.to_markdown())
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config_path = config_path
        self.config = self._load_config()

        # Initialize components
        logger.info("Initializing RAG Agent components...")
        self.clarifier = QueryClarifier(config_path)
        self.retriever = HybridRetriever(config_path)
        self.multi_retriever = MultiQueryRetriever(self.retriever)
        self.synthesizer = ResponseSynthesizer(config_path)
        self.optimizer = OptimizationAnalyzer(config_path)
        self.auto_trigger = AutoTrigger(config_path)

        logger.info("RAG Agent initialized successfully")

    def _load_config(self) -> dict:
        """Load configuration from YAML."""
        config_file = Path(__file__).parent.parent / self.config_path
        if not config_file.exists():
            return {}
        with open(config_file) as f:
            return yaml.safe_load(f)

    def should_auto_trigger(self, query: str) -> tuple[bool, ComplexityAssessment]:
        """
        Check if the query should auto-trigger RAG.

        Returns:
            (should_trigger, assessment)
        """
        return self.auto_trigger.should_trigger(query)

    def query(
        self,
        query: str,
        include_optimization: bool = True,
        decompose_query: bool = True,
        conversation_history: Optional[list[dict]] = None
    ) -> RAGResponse:
        """
        Execute the full RAG pipeline for a query.

        Args:
            query: User's query
            include_optimization: Include optimization analysis
            decompose_query: Decompose complex queries
            conversation_history: Previous conversation for context

        Returns:
            RAGResponse with all components
        """
        logger.info(f"Processing query: {query[:100]}...")

        # Step 1: Assess complexity
        should_trigger, complexity = self.auto_trigger.should_trigger(query)
        logger.info(f"Complexity score: {complexity.score:.2f}")

        # Step 2: Clarify and optimize query
        clarified = self.clarifier.clarify(query, conversation_history)
        logger.info(f"Clarified query confidence: {clarified.confidence:.2f}")

        # Check if clarification is needed
        if not clarified.is_ready():
            logger.warning(f"Query needs clarification: {len(clarified.clarifications_needed)} questions")
            # In production, would ask user for clarification
            # For now, proceed with best effort

        # Step 3: Retrieve relevant context
        if decompose_query and len(clarified.sub_queries) > 1:
            results = self.multi_retriever.search(
                query,
                top_k=self.config.get("retrieval", {}).get("top_k", 10),
                decompose=True
            )
        else:
            results = self.retriever.search(
                clarified.clarified_query,
                top_k=self.config.get("retrieval", {}).get("top_k", 10)
            )

        logger.info(f"Retrieved {len(results)} relevant chunks")

        # Step 4: Synthesize response
        results_dicts = [r.to_dict() for r in results]
        synthesized = self.synthesizer.synthesize(
            query,
            results_dicts,
            clarified.context_hints
        )

        logger.info(f"Synthesized response confidence: {synthesized.confidence:.2f}")

        # Step 5: Optimization analysis (optional)
        optimizations = []
        if include_optimization:
            optimizations = self.optimizer.analyze_for_optimization(results_dicts)
            logger.info(f"Found {len(optimizations)} optimization opportunities")

        return RAGResponse(
            query=query,
            clarified_query=clarified,
            retrieval_results=results,
            synthesized_response=synthesized,
            complexity_assessment=complexity,
            optimization_recommendations=optimizations
        )

    def query_with_clarification(
        self,
        query: str,
        clarification_callback: callable
    ) -> RAGResponse:
        """
        Execute query with interactive clarification.

        Args:
            query: User's query
            clarification_callback: Function to get user input for clarifications
                                   signature: (question: str, options: list) -> str

        Returns:
            RAGResponse after clarification
        """
        # Initial clarification
        clarified = self.clarifier.clarify(query)

        # Handle clarifications
        answers = {}
        for clarification in clarified.clarifications_needed:
            answer = clarification_callback(
                clarification.question,
                clarification.options
            )
            answers[clarification.question] = answer

        # Re-clarify with answers
        if answers:
            clarified = self.clarifier.apply_clarifications(clarified, answers)

        # Now run full query
        return self.query(clarified.clarified_query)

    def analyze_file(self, file_path: str) -> list[dict]:
        """
        Analyze a specific file for optimization opportunities.

        Args:
            file_path: Path to the file

        Returns:
            List of optimization recommendations
        """
        # Retrieve chunks from this file
        results = self.retriever.search_by_file(file_path)
        results_dicts = [r.to_dict() for r in results]

        # Analyze for optimizations
        return self.optimizer.analyze_for_optimization(results_dicts)

    def get_context_for_file(
        self,
        file_path: str,
        purpose: str = "modification"
    ) -> str:
        """
        Get relevant context for working with a specific file.

        Args:
            file_path: Path to the file
            purpose: What you're doing (modification, review, etc.)

        Returns:
            Markdown context for Claude Code
        """
        query = f"Context for {purpose} of {file_path}"

        # Get file chunks
        file_results = self.retriever.search_by_file(file_path)

        # Get related context
        related_query = f"patterns and conventions for files like {file_path}"
        related_results = self.retriever.search(related_query, top_k=5)

        # Combine and synthesize
        all_results = [r.to_dict() for r in file_results + related_results]
        synthesized = self.synthesizer.synthesize(query, all_results)

        return synthesized.to_markdown()


def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="RAG Agent for Claude Code")
    parser.add_argument(
        "--query",
        help="Query to process"
    )
    parser.add_argument(
        "--file",
        help="Analyze specific file"
    )
    parser.add_argument(
        "--context",
        help="Get context for file"
    )
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Path to config file"
    )
    parser.add_argument(
        "--no-optimize",
        action="store_true",
        help="Skip optimization analysis"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output as JSON"
    )
    parser.add_argument(
        "--check-trigger",
        action="store_true",
        help="Only check if query should trigger RAG"
    )

    args = parser.parse_args()

    agent = RAGAgent(config_path=args.config)

    if args.check_trigger and args.query:
        should_trigger, assessment = agent.should_auto_trigger(args.query)
        if args.json:
            print(json.dumps({
                "should_trigger": should_trigger,
                "score": assessment.score,
                "signals": assessment.signals
            }, indent=2))
        else:
            print(f"Should trigger: {should_trigger}")
            print(f"Complexity score: {assessment.score:.2f}")
            for signal in assessment.signals:
                print(f"  - {signal}")
        return

    if args.query:
        response = agent.query(
            args.query,
            include_optimization=not args.no_optimize
        )

        if args.json:
            print(json.dumps(response.to_dict(), indent=2))
        else:
            print(response.to_markdown())

    elif args.file:
        optimizations = agent.analyze_file(args.file)

        if args.json:
            print(json.dumps(optimizations, indent=2))
        else:
            print(f"\n## Optimization Analysis: {args.file}\n")
            for opt in optimizations:
                print(f"### {opt['type']} ({opt['severity']})")
                print(f"- Line: {opt['line']}")
                print(f"- {opt['message']}")
                print(f"- Fix: {opt['pattern']}\n")

    elif args.context:
        context = agent.get_context_for_file(args.context)
        print(context)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
