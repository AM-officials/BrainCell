"""
BrainCell v1.2 - Feature 2.0: Knowledge Gap Detection
Intelligent system to identify student weak spots and learning gaps
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..database.models import ConceptMastery, SessionTranscript
from ..api.schemas import CognitiveState

logger = logging.getLogger(__name__)


async def track_concept_interaction(
    db: AsyncSession,
    student_id: str,
    concept_id: str,
    concept_name: str,
    topic: str,
    cognitive_state: CognitiveState,
) -> None:
    """
    Track every time a student interacts with a concept.
    Updates mastery level based on cognitive state during interaction.
    """
    # Check if concept already tracked
    result = await db.execute(
        select(ConceptMastery).where(
            ConceptMastery.student_id == student_id,
            ConceptMastery.concept_id == concept_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing record
        updates = {
            "attempts": existing.attempts + 1,
            "last_assessed": datetime.now(UTC),
        }

        # Adjust mastery based on cognitive state
        if cognitive_state == CognitiveState.FOCUSED:
            # Positive interaction - increase mastery
            new_mastery = min(1.0, existing.mastery_level + 0.1)
            updates["mastery_level"] = new_mastery
        elif cognitive_state == CognitiveState.CONFUSED:
            # Confusion indicates struggle - decrease mastery slightly
            new_mastery = max(0.0, existing.mastery_level - 0.05)
            updates["mastery_level"] = new_mastery
            updates["confused_count"] = existing.confused_count + 1
        elif cognitive_state == CognitiveState.FRUSTRATED:
            # Frustration indicates significant struggle - decrease more
            new_mastery = max(0.0, existing.mastery_level - 0.1)
            updates["mastery_level"] = new_mastery
            updates["frustrated_count"] = existing.frustrated_count + 1

        await db.execute(
            update(ConceptMastery)
            .where(ConceptMastery.id == existing.id)
            .values(**updates)
        )
    else:
        # Create new tracking record
        initial_mastery = 0.3  # Start at 30% - neutral
        if cognitive_state == CognitiveState.FOCUSED:
            initial_mastery = 0.5  # Started strong
        elif cognitive_state == CognitiveState.CONFUSED:
            initial_mastery = 0.2  # Struggling from start
        elif cognitive_state == CognitiveState.FRUSTRATED:
            initial_mastery = 0.1  # Very difficult

        mastery = ConceptMastery(
            student_id=student_id,
            concept_id=concept_id,
            concept_name=concept_name,
            topic=topic,
            mastery_level=initial_mastery,
            attempts=1,
            confused_count=1 if cognitive_state == CognitiveState.CONFUSED else 0,
            frustrated_count=1 if cognitive_state == CognitiveState.FRUSTRATED else 0,
        )
        db.add(mastery)

    await db.commit()
    logger.info(f"Tracked concept interaction: {student_id} → {concept_name} ({cognitive_state.value})")


async def detect_gaps(
    db: AsyncSession,
    student_id: str,
    topic: str | None = None,
) -> dict[str, Any]:
    """
    Feature 2.0: Core Gap Detection Algorithm
    
    Analyzes student's concept mastery to identify:
    1. Weak concepts (mastery < 0.4)
    2. Struggling concepts (high confused/frustrated counts)
    3. Never-mentioned concepts from knowledge graph
    4. Recommended next topics
    
    Returns a comprehensive learning gap report.
    """
    # Build query
    query = select(ConceptMastery).where(ConceptMastery.student_id == student_id)
    if topic:
        query = query.where(ConceptMastery.topic == topic)
    
    query = query.order_by(ConceptMastery.mastery_level.asc())
    
    result = await db.execute(query)
    all_concepts = result.scalars().all()

    if not all_concepts:
        return {
            "student_id": student_id,
            "topic": topic,
            "total_concepts": 0,
            "gaps": [],
            "struggling": [],
            "strong": [],
            "recommendations": ["Start learning! No data yet."],
            "overall_progress": 0.0,
        }

    # Categorize concepts
    weak_concepts = []  # mastery < 0.4
    struggling_concepts = []  # confused_count > 2 or frustrated_count > 1
    strong_concepts = []  # mastery >= 0.7
    moderate_concepts = []  # 0.4 <= mastery < 0.7

    for concept in all_concepts:
        concept_data = {
            "id": concept.concept_id,
            "name": concept.concept_name,
            "mastery": round(concept.mastery_level, 2),
            "attempts": concept.attempts,
            "confused_count": concept.confused_count,
            "frustrated_count": concept.frustrated_count,
        }

        if concept.mastery_level < 0.4:
            weak_concepts.append(concept_data)
        elif concept.mastery_level >= 0.7:
            strong_concepts.append(concept_data)
        else:
            moderate_concepts.append(concept_data)

        # Also check for struggling patterns
        if concept.confused_count > 2 or concept.frustrated_count > 1:
            struggling_concepts.append(concept_data)

    # Calculate overall progress
    avg_mastery = sum(c.mastery_level for c in all_concepts) / len(all_concepts)

    # Generate recommendations
    recommendations = _generate_recommendations(
        weak_concepts, struggling_concepts, strong_concepts, avg_mastery
    )

    return {
        "student_id": student_id,
        "topic": topic,
        "total_concepts": len(all_concepts),
        "gaps": weak_concepts[:5],  # Top 5 weak areas
        "struggling": struggling_concepts[:5],  # Top 5 struggling areas
        "strong": strong_concepts[:3],  # Top 3 strengths
        "moderate": len(moderate_concepts),
        "recommendations": recommendations,
        "overall_progress": round(avg_mastery * 100, 1),  # As percentage
        "last_updated": datetime.now(UTC).isoformat(),
    }


def _generate_recommendations(
    weak: list[dict],
    struggling: list[dict],
    strong: list[dict],
    avg_mastery: float,
) -> list[str]:
    """Generate actionable learning recommendations based on analysis."""
    recs = []

    if avg_mastery < 0.3:
        recs.append("⚠️ You're in early stages. Focus on building fundamentals before moving forward.")
    elif avg_mastery < 0.5:
        recs.append("📚 You're making progress! Review weak areas before tackling new concepts.")
    elif avg_mastery < 0.7:
        recs.append("🎯 Good momentum! A few more practice sessions will solidify your knowledge.")
    else:
        recs.append("🏆 Excellent progress! You're ready for advanced topics.")

    # Specific weak area recommendations
    if weak:
        weak_names = [c["name"] for c in weak[:3]]
        recs.append(f"🔴 Priority review needed: {', '.join(weak_names)}")

    # Struggling pattern detection
    if struggling:
        struggle_names = [c["name"] for c in struggling[:2]]
        recs.append(f"⚠️ You've been confused about: {', '.join(struggle_names)}. Try a different approach or ask for examples.")

    # Positive reinforcement
    if strong:
        strong_names = [c["name"] for c in strong[:2]]
        recs.append(f"✅ You've mastered: {', '.join(strong_names)}! Build on these strengths.")

    # Default recommendation
    if not recs:
        recs.append("Keep learning! Consistency is key.")

    return recs


async def get_student_progress(
    db: AsyncSession,
    student_id: str,
) -> dict[str, Any]:
    """Get overall student progress across all topics."""
    result = await db.execute(
        select(ConceptMastery).where(ConceptMastery.student_id == student_id)
    )
    all_concepts = result.scalars().all()

    if not all_concepts:
        return {
            "student_id": student_id,
            "total_concepts": 0,
            "avg_mastery": 0.0,
            "topics": [],
        }

    # Group by topic
    topics: dict[str, list] = {}
    for concept in all_concepts:
        if concept.topic not in topics:
            topics[concept.topic] = []
        topics[concept.topic].append(concept.mastery_level)

    # Calculate per-topic averages
    topic_progress = []
    for topic_name, masteries in topics.items():
        avg = sum(masteries) / len(masteries)
        topic_progress.append({
            "topic": topic_name,
            "avg_mastery": round(avg, 2),
            "concepts_count": len(masteries),
        })

    overall_avg = sum(c.mastery_level for c in all_concepts) / len(all_concepts)

    return {
        "student_id": student_id,
        "total_concepts": len(all_concepts),
        "avg_mastery": round(overall_avg, 2),
        "topics": sorted(topic_progress, key=lambda x: x["avg_mastery"], reverse=True),
    }
