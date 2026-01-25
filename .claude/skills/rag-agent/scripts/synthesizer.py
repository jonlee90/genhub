#!/usr/bin/env python3
"""
RAG Agent Synthesizer - LLM-Optimized Response Generation

Synthesizes retrieved context into structured responses optimized for
Claude Code consumption. Includes file references, blocking rules,
and skill mappings.
"""

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import yaml

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("rag-synthesizer")


@dataclass
class FileReference:
    """Reference to a specific file location."""
    file_path: str
    start_line: int
    end_line: int
    description: str
    relevance_score: float

    def to_markdown(self) -> str:
        if self.start_line == self.end_line:
            return f"- `{self.file_path}:{self.start_line}` - {self.description}"
        return f"- `{self.file_path}:{self.start_line}-{self.end_line}` - {self.description}"


@dataclass
class BlockingRule:
    """A blocking rule from project conventions."""
    id: str
    pattern: str
    message: str
    severity: str  # 'error' or 'warning'


@dataclass
class SkillMapping:
    """Mapping of file patterns to required skills."""
    pattern: str
    skills: list[str]
    rules: list[str]


@dataclass
class SynthesizedResponse:
    """The final synthesized response optimized for Claude Code."""
    problem_context: str
    code_locations: list[FileReference]
    patterns_and_constraints: list[str]
    solution_approach: list[str]
    files_to_modify: list[dict]
    verification_steps: list[str]
    blocking_rules: list[BlockingRule]
    skill_mappings: list[SkillMapping]
    sources: list[str]
    confidence: float

    def to_markdown(self) -> str:
        """Generate Claude Code optimized markdown output."""
        sections = []

        # Problem Context
        sections.append("## Problem Context\n")
        sections.append(self.problem_context + "\n")

        # Relevant Code Locations
        if self.code_locations:
            sections.append("\n## Relevant Code Locations\n")
            for loc in sorted(self.code_locations, key=lambda x: -x.relevance_score)[:10]:
                sections.append(loc.to_markdown())
            sections.append("")

        # Key Patterns & Constraints
        if self.patterns_and_constraints:
            sections.append("\n## Key Patterns & Constraints\n")
            for pattern in self.patterns_and_constraints:
                sections.append(f"- {pattern}")
            sections.append("")

        # Applicable Blocking Rules
        if self.blocking_rules:
            sections.append("\n## Applicable Blocking Rules\n")
            for rule in self.blocking_rules:
                icon = "🚫" if rule.severity == "error" else "⚠️"
                sections.append(f"- {icon} **{rule.id}**: {rule.message}")
            sections.append("")

        # Required Skills
        if self.skill_mappings:
            sections.append("\n## Required Skills\n")
            seen = set()
            for mapping in self.skill_mappings:
                for skill in mapping.skills:
                    if skill not in seen:
                        seen.add(skill)
                        sections.append(f"- Load `{skill}` for {mapping.pattern} files")
            sections.append("")

        # Solution Approach
        if self.solution_approach:
            sections.append("\n## Solution Approach\n")
            for i, step in enumerate(self.solution_approach, 1):
                sections.append(f"{i}. {step}")
            sections.append("")

        # Files to Modify
        if self.files_to_modify:
            sections.append("\n## Files to Modify\n")
            sections.append("| File | Change Type | Description |")
            sections.append("|------|-------------|-------------|")
            for f in self.files_to_modify:
                sections.append(
                    f"| `{f['path']}` | {f['change_type']} | {f['description']} |"
                )
            sections.append("")

        # Verification Steps
        if self.verification_steps:
            sections.append("\n## Verification\n")
            for step in self.verification_steps:
                sections.append(f"- [ ] {step}")
            sections.append("")

        # Sources
        if self.sources:
            sections.append("\n---\n")
            sections.append("*Sources: " + ", ".join(self.sources[:5]) + "*")

        return "\n".join(sections)


class ResponseSynthesizer:
    """
    Synthesizes retrieval results into Claude Code optimized responses.

    Output Optimization Principles:
    1. Front-load critical info - Most important context first
    2. Use structured format - Tables, bullet points over prose
    3. Include actionable paths - file:line for easy navigation
    4. Respect token budget - Trim verbose explanations
    5. Match Claude Code patterns - Follow CLAUDE.md conventions
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.blocking_rules = self._load_blocking_rules()
        self.skill_mappings = self._load_skill_mappings()

    def _load_config(self, path: str) -> dict:
        """Load configuration from YAML."""
        config_file = Path(__file__).parent.parent / path
        if not config_file.exists():
            return {}
        with open(config_file) as f:
            return yaml.safe_load(f)

    def _load_blocking_rules(self) -> list[BlockingRule]:
        """Load blocking rules from config."""
        rules_config = self.config.get("blocking_rules", [])
        return [
            BlockingRule(
                id=r["id"],
                pattern=r["pattern"],
                message=r["message"],
                severity=r.get("severity", "error")
            )
            for r in rules_config
        ]

    def _load_skill_mappings(self) -> list[SkillMapping]:
        """Load skill mappings from config."""
        mappings_config = self.config.get("skill_mapping", {}).get("patterns", {})
        return [
            SkillMapping(
                pattern=pattern,
                skills=data.get("skills", []),
                rules=data.get("rules", [])
            )
            for pattern, data in mappings_config.items()
        ]

    def _extract_file_references(
        self,
        results: list[dict]
    ) -> list[FileReference]:
        """Extract file references from retrieval results."""
        refs = []

        for result in results:
            # Skip if no file path
            if not result.get("file_path"):
                continue

            # Create description from content preview
            content = result.get("content", "")
            description = self._summarize_content(content)

            refs.append(FileReference(
                file_path=result["file_path"],
                start_line=result.get("start_line", 1),
                end_line=result.get("end_line", 1),
                description=description,
                relevance_score=result.get("score", 0.5)
            ))

        return refs

    def _summarize_content(self, content: str, max_length: int = 100) -> str:
        """Create a short summary of content."""
        # Remove code blocks
        content = re.sub(r'```[\s\S]*?```', '', content)
        # Remove markdown formatting
        content = re.sub(r'[#*_`\[\]]', '', content)
        # Clean whitespace
        content = ' '.join(content.split())
        # Truncate
        if len(content) > max_length:
            content = content[:max_length - 3] + "..."
        return content

    def _identify_blocking_rules(
        self,
        query: str,
        results: list[dict]
    ) -> list[BlockingRule]:
        """Identify applicable blocking rules based on query and results."""
        applicable = []

        # Check query for relevant terms
        query_lower = query.lower()

        # Supabase in client check
        if "client" in query_lower and any(
            term in query_lower for term in ["supabase", "database", "db"]
        ):
            applicable.append(next(
                (r for r in self.blocking_rules if r.id == "no-supabase-client"),
                None
            ))

        # Modal check
        if "modal" in query_lower or "dialog" in query_lower:
            applicable.append(next(
                (r for r in self.blocking_rules if r.id == "responsive-modal"),
                None
            ))

        # Icon check
        if "icon" in query_lower:
            applicable.append(next(
                (r for r in self.blocking_rules if r.id == "lucide-icons"),
                None
            ))

        # Check results for file patterns
        for result in results:
            file_path = result.get("file_path", "")
            if file_path.endswith(".tsx") or file_path.endswith(".jsx"):
                # Check for client component with DB
                content = result.get("content", "")
                if "use client" in content and "supabase" in content.lower():
                    applicable.append(next(
                        (r for r in self.blocking_rules if r.id == "no-supabase-client"),
                        None
                    ))

        # Filter None values and deduplicate
        return [r for r in applicable if r is not None]

    def _identify_skill_mappings(
        self,
        query: str,
        results: list[dict]
    ) -> list[SkillMapping]:
        """Identify required skills based on file patterns."""
        applicable = []

        from fnmatch import fnmatch

        # Check each result's file path
        for result in results:
            file_path = result.get("file_path", "")
            for mapping in self.skill_mappings:
                if fnmatch(file_path, mapping.pattern):
                    if mapping not in applicable:
                        applicable.append(mapping)

        return applicable

    def _extract_patterns(
        self,
        results: list[dict],
        query: str
    ) -> list[str]:
        """Extract key patterns and constraints from results."""
        patterns = []

        # Look for pattern mentions in content
        pattern_indicators = [
            "should", "must", "always", "never", "use",
            "pattern", "convention", "best practice"
        ]

        for result in results:
            content = result.get("content", "")
            source_type = result.get("source_type", "")

            # Prioritize skill/docs sources for patterns
            if source_type not in ["skill", "docs"]:
                continue

            # Extract sentences with pattern indicators
            sentences = re.split(r'[.!?]', content)
            for sent in sentences:
                sent = sent.strip()
                if any(ind in sent.lower() for ind in pattern_indicators):
                    if 10 < len(sent) < 200:
                        patterns.append(sent)

        # Deduplicate and limit
        seen = set()
        unique = []
        for p in patterns:
            p_normalized = p.lower()
            if p_normalized not in seen:
                seen.add(p_normalized)
                unique.append(p)

        return unique[:5]

    def _generate_solution_approach(
        self,
        query: str,
        results: list[dict],
        skill_mappings: list[SkillMapping]
    ) -> list[str]:
        """Generate step-by-step solution approach."""
        steps = []

        # Step 1: Load required skills
        skills_needed = set()
        for mapping in skill_mappings:
            skills_needed.update(mapping.skills)

        if skills_needed:
            steps.append(
                f"Load required skills: {', '.join(skills_needed)}"
            )

        # Step 2: Determine primary action type
        query_lower = query.lower()

        if "implement" in query_lower or "add" in query_lower:
            steps.append("Identify the target location for new code")
            steps.append("Review existing patterns in similar files")
            steps.append("Implement following project conventions")
            steps.append("Add appropriate tests")

        elif "fix" in query_lower or "debug" in query_lower:
            steps.append("Reproduce the issue to understand root cause")
            steps.append("Identify the problematic code location")
            steps.append("Apply fix following existing patterns")
            steps.append("Verify fix doesn't introduce regressions")

        elif "refactor" in query_lower:
            steps.append("Analyze current implementation")
            steps.append("Identify optimization opportunities")
            steps.append("Create incremental changes")
            steps.append("Ensure backwards compatibility")

        elif "optimize" in query_lower:
            steps.append("Profile current performance")
            steps.append("Identify bottlenecks")
            steps.append("Apply optimizations from best practices")
            steps.append("Benchmark improvements")

        else:
            # Generic approach
            steps.append("Analyze requirements and constraints")
            steps.append("Review related code and patterns")
            steps.append("Implement solution following conventions")
            steps.append("Validate with build and tests")

        return steps

    def _generate_files_to_modify(
        self,
        results: list[dict]
    ) -> list[dict]:
        """Generate list of files to modify."""
        files = []
        seen = set()

        for result in results:
            file_path = result.get("file_path", "")
            if not file_path or file_path in seen:
                continue
            seen.add(file_path)

            # Determine change type based on source type
            source_type = result.get("source_type", "")
            if source_type == "code":
                change_type = "Edit"
                description = "Modify existing implementation"
            elif source_type == "skill":
                change_type = "Reference"
                description = "Apply patterns from this skill"
            else:
                change_type = "Review"
                description = "Review for relevant context"

            files.append({
                "path": file_path,
                "change_type": change_type,
                "description": description
            })

        # Limit to top 10
        return files[:10]

    def _generate_verification_steps(
        self,
        query: str,
        skill_mappings: list[SkillMapping]
    ) -> list[str]:
        """Generate verification steps."""
        steps = [
            "Run `npm run build` - verify no TypeScript errors",
            "Run `npm run lint` - verify code style",
        ]

        # Add skill-specific checks
        has_react_skill = any(
            "vercel-react-best-practices" in m.skills
            for m in skill_mappings
        )

        if has_react_skill:
            steps.append("Check mobile view (44px touch targets)")
            steps.append("Verify dark mode styling")

        has_db_skill = any(
            "postgres-best-practices" in str(m.skills)
            for m in skill_mappings
        )

        if has_db_skill:
            steps.append("Verify RLS policies are in place")
            steps.append("Test with authenticated user")

        return steps

    def synthesize(
        self,
        query: str,
        results: list[dict],
        context_hints: Optional[list[str]] = None
    ) -> SynthesizedResponse:
        """
        Synthesize retrieval results into Claude Code optimized response.

        Args:
            query: The original user query
            results: List of retrieval result dicts
            context_hints: Additional context from clarification

        Returns:
            SynthesizedResponse ready for markdown output
        """
        logger.info(f"Synthesizing response for: {query[:100]}...")

        # Extract components
        code_locations = self._extract_file_references(results)
        blocking_rules = self._identify_blocking_rules(query, results)
        skill_mappings = self._identify_skill_mappings(query, results)
        patterns = self._extract_patterns(results, query)
        solution_steps = self._generate_solution_approach(
            query, results, skill_mappings
        )
        files_to_modify = self._generate_files_to_modify(results)
        verification = self._generate_verification_steps(query, skill_mappings)

        # Build problem context
        problem_context = f"Query: {query}"
        if context_hints:
            problem_context += f"\n\nContext: {'. '.join(context_hints)}"

        # Calculate confidence
        confidence = min(
            0.5 + (len(results) * 0.05),  # More results = higher confidence
            0.95
        )
        if blocking_rules:
            confidence -= 0.05 * len(blocking_rules)

        # Extract sources
        sources = list(set(r.get("source", "unknown") for r in results))

        return SynthesizedResponse(
            problem_context=problem_context,
            code_locations=code_locations,
            patterns_and_constraints=patterns,
            solution_approach=solution_steps,
            files_to_modify=files_to_modify,
            verification_steps=verification,
            blocking_rules=blocking_rules,
            skill_mappings=skill_mappings,
            sources=sources,
            confidence=confidence
        )


class OptimizationAnalyzer:
    """
    Analyzes codebase for optimization opportunities.
    Implements the "aggressive refactoring" mode from the plan.
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        self.config = self._load_config(config_path)
        self.optimization_config = self.config.get("optimization", {})

    def _load_config(self, path: str) -> dict:
        config_file = Path(__file__).parent.parent / path
        if not config_file.exists():
            return {}
        with open(config_file) as f:
            return yaml.safe_load(f)

    def analyze_for_optimization(
        self,
        results: list[dict]
    ) -> list[dict]:
        """
        Analyze retrieved code for optimization opportunities.

        Returns list of optimization recommendations.
        """
        recommendations = []
        targets = self.optimization_config.get("targets", {})

        for result in results:
            if result.get("source_type") != "code":
                continue

            content = result.get("content", "")
            file_path = result.get("file_path", "")

            # Check for Server Component opportunities
            if targets.get("server_components", {}).get("enabled"):
                if "'use client'" in content:
                    # Check if doing data fetching
                    if any(term in content for term in ["fetch(", "useEffect", "useSWR"]):
                        recommendations.append({
                            "type": "server_component_conversion",
                            "file": file_path,
                            "line": result.get("start_line", 1),
                            "severity": "high",
                            "message": "Client component with data fetching - convert to Server Component",
                            "pattern": "Move fetch to Server Component, pass data as props"
                        })

            # Check for Server Action opportunities
            if targets.get("server_actions", {}).get("enabled"):
                if "supabase" in content.lower() and "'use client'" in content:
                    recommendations.append({
                        "type": "server_action_migration",
                        "file": file_path,
                        "line": result.get("start_line", 1),
                        "severity": "critical",
                        "message": "Direct Supabase call in client component - move to Server Action",
                        "pattern": "Create Server Action in app/actions/, call from client"
                    })

            # Check for barrel import issues
            if targets.get("barrel_imports", {}).get("enabled"):
                barrel_imports = re.findall(
                    r"import .+ from ['\"]@/(?:components|lib|utils)['\"]",
                    content
                )
                if barrel_imports:
                    recommendations.append({
                        "type": "barrel_import_elimination",
                        "file": file_path,
                        "line": result.get("start_line", 1),
                        "severity": "medium",
                        "message": "Barrel import detected - use direct imports",
                        "pattern": "Import directly from component file"
                    })

            # Check for missing dynamic imports
            if targets.get("dynamic_imports", {}).get("enabled"):
                heavy_imports = re.findall(
                    r"import .+ from ['\"](?:@react-pdf|chart\.js|monaco-editor)",
                    content
                )
                if heavy_imports:
                    recommendations.append({
                        "type": "dynamic_import_needed",
                        "file": file_path,
                        "line": result.get("start_line", 1),
                        "severity": "medium",
                        "message": "Heavy library import - use dynamic()",
                        "pattern": "Use next/dynamic with ssr: false"
                    })

        return recommendations


def main():
    """CLI entry point."""
    import argparse
    import json

    parser = argparse.ArgumentParser(description="RAG Agent Synthesizer")
    parser.add_argument(
        "--query",
        required=True,
        help="User query"
    )
    parser.add_argument(
        "--results",
        required=True,
        help="Path to JSON file with retrieval results"
    )
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Path to config file"
    )
    parser.add_argument(
        "--analyze",
        action="store_true",
        help="Include optimization analysis"
    )
    parser.add_argument(
        "--output",
        choices=["markdown", "json"],
        default="markdown",
        help="Output format"
    )

    args = parser.parse_args()

    # Load results
    with open(args.results) as f:
        results = json.load(f)

    synthesizer = ResponseSynthesizer(config_path=args.config)
    response = synthesizer.synthesize(args.query, results)

    if args.analyze:
        analyzer = OptimizationAnalyzer(config_path=args.config)
        optimizations = analyzer.analyze_for_optimization(results)

        if optimizations:
            print("\n## Optimization Opportunities\n")
            for opt in optimizations:
                print(f"- **{opt['type']}** ({opt['severity']})")
                print(f"  - File: `{opt['file']}:{opt['line']}`")
                print(f"  - {opt['message']}")
                print(f"  - Pattern: {opt['pattern']}")
            print()

    if args.output == "markdown":
        print(response.to_markdown())
    else:
        output = {
            "problem_context": response.problem_context,
            "code_locations": [
                loc.to_markdown() for loc in response.code_locations
            ],
            "patterns_and_constraints": response.patterns_and_constraints,
            "solution_approach": response.solution_approach,
            "files_to_modify": response.files_to_modify,
            "verification_steps": response.verification_steps,
            "blocking_rules": [
                {"id": r.id, "message": r.message, "severity": r.severity}
                for r in response.blocking_rules
            ],
            "skill_mappings": [
                {"pattern": m.pattern, "skills": m.skills}
                for m in response.skill_mappings
            ],
            "sources": response.sources,
            "confidence": response.confidence
        }
        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
