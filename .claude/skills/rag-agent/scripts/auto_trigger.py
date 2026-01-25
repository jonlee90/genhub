#!/usr/bin/env python3
"""
RAG Agent Auto-Trigger - Complexity Detection for Automatic Invocation

Detects when a query is complex enough to warrant RAG assistance.
Uses multiple signals to calculate a complexity score.
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
logger = logging.getLogger("rag-auto-trigger")


@dataclass
class ComplexityAssessment:
    """Result of complexity assessment."""
    score: float  # 0.0 to 1.0
    should_trigger: bool
    signals: list[str]
    confidence: float
    recommended_approach: str


class ComplexityDetector:
    """
    Detects query complexity using multiple signals.

    Signals:
    - Query length and structure
    - Technical terminology density
    - Multi-step indicators
    - Cross-cutting concerns
    - Architectural decisions
    - Unfamiliar codebase references
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)

        invocation = self.config.get("invocation", {})
        auto_trigger = invocation.get("auto_trigger", {})

        self.enabled = auto_trigger.get("enabled", True)
        self.threshold = auto_trigger.get("complexity_threshold", 0.7)
        self.indicators = auto_trigger.get("indicators", [])
        self.multi_file_threshold = auto_trigger.get("multi_file_threshold", 3)
        self.complexity_signals = auto_trigger.get("complexity_signals", {})

    def _load_config(self, path: str) -> dict:
        """Load configuration from YAML."""
        config_file = Path(__file__).parent.parent / path
        if not config_file.exists():
            return {}
        with open(config_file) as f:
            return yaml.safe_load(f)

    def _check_indicators(self, query: str) -> tuple[float, list[str]]:
        """Check for configured complexity indicators."""
        score = 0.0
        signals = []
        query_lower = query.lower()

        for indicator in self.indicators:
            if indicator.lower() in query_lower:
                score += 0.15
                signals.append(f"Indicator match: '{indicator}'")

        return min(score, 0.4), signals

    def _check_multi_step(self, query: str) -> tuple[float, list[str]]:
        """Check for multi-step task indicators."""
        multi_step_patterns = [
            r"\b(?:first|then|next|after|finally)\b",
            r"\b(?:step \d|phase \d)\b",
            r"\b(?:and then|and also)\b",
            r"\b(?:\d+\.\s+\w)",  # Numbered lists
        ]

        signals = []
        score = 0.0

        for pattern in multi_step_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                score += self.complexity_signals.get("multi_step", 0.3) / 2
                signals.append(f"Multi-step indicator: {pattern}")

        return min(score, 0.3), signals

    def _check_cross_cutting(self, query: str) -> tuple[float, list[str]]:
        """Check for cross-cutting concerns (multiple domains)."""
        domains = {
            "frontend": ["component", "ui", "style", "css", "tailwind", "form", "button"],
            "backend": ["database", "api", "server", "action", "query", "migration"],
            "auth": ["auth", "login", "session", "user", "permission", "role"],
            "testing": ["test", "spec", "mock", "fixture", "e2e", "unit"],
            "deployment": ["deploy", "build", "ci", "cd", "production", "staging"],
        }

        query_lower = query.lower()
        matched_domains = []

        for domain, keywords in domains.items():
            if any(kw in query_lower for kw in keywords):
                matched_domains.append(domain)

        signals = []
        score = 0.0

        if len(matched_domains) >= 2:
            score = self.complexity_signals.get("cross_cutting", 0.4)
            signals.append(f"Cross-cutting: affects {', '.join(matched_domains)}")

        return score, signals

    def _check_architectural(self, query: str) -> tuple[float, list[str]]:
        """Check for architectural decision indicators."""
        arch_keywords = [
            "architecture", "design", "pattern", "structure",
            "refactor", "reorganize", "split", "merge",
            "should i use", "which approach", "best way to",
            "trade-off", "tradeoff", "pros and cons",
        ]

        query_lower = query.lower()
        signals = []
        score = 0.0

        for keyword in arch_keywords:
            if keyword in query_lower:
                score = self.complexity_signals.get("architectural", 0.5)
                signals.append(f"Architectural decision: '{keyword}'")
                break

        return score, signals

    def _check_unfamiliarity(self, query: str) -> tuple[float, list[str]]:
        """Check for indicators of unfamiliar codebase areas."""
        unfamiliar_patterns = [
            r"\b(?:where|which file|where is|find the)\b",
            r"\b(?:how does|what does|explain|understand)\b",
            r"\b(?:never used|first time|new to|unfamiliar)\b",
            r"\b(?:legacy|old code|existing)\b",
        ]

        signals = []
        score = 0.0

        for pattern in unfamiliar_patterns:
            if re.search(pattern, query, re.IGNORECASE):
                score += self.complexity_signals.get("unfamiliar", 0.4) / 2
                signals.append(f"Unfamiliarity signal: {pattern}")

        return min(score, 0.4), signals

    def _check_query_structure(self, query: str) -> tuple[float, list[str]]:
        """Check query structural complexity."""
        signals = []
        score = 0.0

        # Word count
        word_count = len(query.split())
        if word_count > 30:
            score += 0.2
            signals.append(f"Long query: {word_count} words")
        elif word_count > 20:
            score += 0.1
            signals.append(f"Medium query: {word_count} words")

        # Multiple questions
        question_count = query.count("?")
        if question_count > 1:
            score += 0.15 * (question_count - 1)
            signals.append(f"Multiple questions: {question_count}")

        # Multiple sentences
        sentence_count = len(re.split(r'[.!?]+', query))
        if sentence_count > 3:
            score += 0.1
            signals.append(f"Multiple sentences: {sentence_count}")

        return min(score, 0.3), signals

    def _check_file_references(self, query: str) -> tuple[float, list[str]]:
        """Check for multiple file references."""
        # Common file patterns
        file_patterns = [
            r'[\w/]+\.(?:tsx?|jsx?|sql|md|json|yaml)',
            r'app/\w+',
            r'components/\w+',
            r'lib/\w+',
        ]

        files = []
        for pattern in file_patterns:
            matches = re.findall(pattern, query)
            files.extend(matches)

        # Deduplicate
        files = list(set(files))
        signals = []
        score = 0.0

        if len(files) >= self.multi_file_threshold:
            score = 0.4
            signals.append(f"Multiple files referenced: {len(files)}")

        return score, signals

    def assess(
        self,
        query: str,
        conversation_history: Optional[list[dict]] = None
    ) -> ComplexityAssessment:
        """
        Assess the complexity of a query.

        Args:
            query: The user's query
            conversation_history: Previous conversation for context

        Returns:
            ComplexityAssessment with score, signals, and recommendation
        """
        if not self.enabled:
            return ComplexityAssessment(
                score=0.0,
                should_trigger=False,
                signals=["Auto-trigger disabled"],
                confidence=1.0,
                recommended_approach="Manual invocation only"
            )

        all_signals = []
        total_score = 0.0

        # Run all checks
        checks = [
            self._check_indicators,
            self._check_multi_step,
            self._check_cross_cutting,
            self._check_architectural,
            self._check_unfamiliarity,
            self._check_query_structure,
            self._check_file_references,
        ]

        for check in checks:
            score, signals = check(query)
            total_score += score
            all_signals.extend(signals)

        # Normalize score
        total_score = min(total_score, 1.0)

        # Check conversation context
        if conversation_history:
            # Boost if conversation has been long
            if len(conversation_history) > 5:
                total_score += 0.1
                all_signals.append("Extended conversation context")

            # Boost if previous errors/failures
            recent = conversation_history[-3:]
            if any("error" in str(msg).lower() for msg in recent):
                total_score += 0.15
                all_signals.append("Recent errors in conversation")

        total_score = min(total_score, 1.0)

        # Determine recommendation
        if total_score >= self.threshold:
            recommended = "Use RAG agent for comprehensive context"
        elif total_score >= 0.5:
            recommended = "Consider RAG for complex parts, direct approach for simple"
        else:
            recommended = "Direct approach should be sufficient"

        # Calculate confidence based on signal clarity
        confidence = 0.7 + (len(all_signals) * 0.05)
        confidence = min(confidence, 0.95)

        return ComplexityAssessment(
            score=total_score,
            should_trigger=total_score >= self.threshold,
            signals=all_signals,
            confidence=confidence,
            recommended_approach=recommended
        )


class ConversationTracker:
    """Track conversation state for context-aware triggering."""

    def __init__(self):
        self.history: list[dict] = []
        self.error_count: int = 0
        self.file_mentions: set[str] = set()
        self.topics: list[str] = []

    def add_message(self, role: str, content: str) -> None:
        """Add a message to history."""
        self.history.append({
            "role": role,
            "content": content
        })

        # Track errors
        if "error" in content.lower() or "failed" in content.lower():
            self.error_count += 1

        # Track file mentions
        file_pattern = r'[\w/]+\.(?:tsx?|jsx?|sql|md|json|yaml)'
        files = re.findall(file_pattern, content)
        self.file_mentions.update(files)

    def get_context_boost(self) -> float:
        """Get a complexity boost based on conversation context."""
        boost = 0.0

        # Boost for long conversations
        if len(self.history) > 10:
            boost += 0.15
        elif len(self.history) > 5:
            boost += 0.1

        # Boost for errors
        if self.error_count > 2:
            boost += 0.2
        elif self.error_count > 0:
            boost += 0.1

        # Boost for many file references
        if len(self.file_mentions) > 5:
            boost += 0.15

        return min(boost, 0.3)

    def reset(self) -> None:
        """Reset tracking state."""
        self.history = []
        self.error_count = 0
        self.file_mentions = set()
        self.topics = []


class AutoTrigger:
    """
    Main auto-trigger orchestrator.

    Combines complexity detection with conversation tracking
    to decide when to automatically invoke RAG.
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.detector = ComplexityDetector(config_path)
        self.tracker = ConversationTracker()
        self.config = self.detector.config

    def should_trigger(
        self,
        query: str,
        add_to_history: bool = True
    ) -> tuple[bool, ComplexityAssessment]:
        """
        Decide if RAG should be triggered for this query.

        Args:
            query: The user's query
            add_to_history: Whether to add query to conversation history

        Returns:
            (should_trigger, assessment)
        """
        if add_to_history:
            self.tracker.add_message("user", query)

        # Get base assessment
        assessment = self.detector.assess(query, self.tracker.history)

        # Apply context boost
        context_boost = self.tracker.get_context_boost()
        if context_boost > 0:
            assessment.score = min(assessment.score + context_boost, 1.0)
            assessment.signals.append(f"Context boost: +{context_boost:.2f}")
            assessment.should_trigger = assessment.score >= self.detector.threshold

        logger.info(
            f"Query complexity: {assessment.score:.2f} "
            f"(trigger: {assessment.should_trigger})"
        )

        return assessment.should_trigger, assessment

    def record_response(self, response: str) -> None:
        """Record assistant response for context tracking."""
        self.tracker.add_message("assistant", response)

    def reset(self) -> None:
        """Reset conversation tracking."""
        self.tracker.reset()


def main():
    """CLI entry point."""
    import argparse
    import json

    parser = argparse.ArgumentParser(description="RAG Agent Auto-Trigger")
    parser.add_argument(
        "--query",
        required=True,
        help="Query to assess"
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

    trigger = AutoTrigger(config_path=args.config)
    should_trigger, assessment = trigger.should_trigger(args.query)

    if args.json:
        output = {
            "query": args.query,
            "should_trigger": should_trigger,
            "score": round(assessment.score, 3),
            "threshold": trigger.detector.threshold,
            "confidence": round(assessment.confidence, 3),
            "signals": assessment.signals,
            "recommended_approach": assessment.recommended_approach
        }
        print(json.dumps(output, indent=2))
    else:
        print("\n" + "=" * 60)
        print("COMPLEXITY ASSESSMENT")
        print("=" * 60)
        print(f"\nQuery: {args.query[:100]}...")
        print(f"\nScore: {assessment.score:.2f} (threshold: {trigger.detector.threshold})")
        print(f"Should Trigger: {'YES' if should_trigger else 'NO'}")
        print(f"Confidence: {assessment.confidence:.2f}")

        if assessment.signals:
            print(f"\nSignals ({len(assessment.signals)}):")
            for signal in assessment.signals:
                print(f"  - {signal}")

        print(f"\nRecommendation: {assessment.recommended_approach}")


if __name__ == "__main__":
    main()
