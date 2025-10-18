from __future__ import annotations

import json
import logging
import time
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import Settings, get_settings
from ...database import get_db
from ...database.models import SessionTranscript, UsageMetrics
from ...llm_client import GoogleAIClient, OpenRouterClient
from ...orchestrator import fuse_cognitive_signals
from ...utils.prompt_crafter import build_prompt
from ...utils.typing import CognitiveContext
from ..schemas import (
    AIResponse,
    CognitiveState,
    KnowledgeGraphDelta,
    KnowledgeGraphNode,
    ResponseType,
    UserInput,
)

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> AsyncGenerator[GoogleAIClient | OpenRouterClient, None]:
    # Use Google AI Studio by default
    if settings.model_provider == "google":
        client = GoogleAIClient(api_key=settings.google_api_key, model=settings.model_id)
    else:
        # Fallback to OpenRouter
        client = OpenRouterClient(api_key=settings.openrouter_api_key, model=settings.glm_model_id)
    
    try:
        yield client
    finally:
        await client.aclose()


@router.post("/analyze", response_model=AIResponse)
async def analyze_session(
    payload: UserInput,
    client: Annotated[GoogleAIClient | OpenRouterClient, Depends(get_client)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AIResponse:
    start_time = time.perf_counter()
    
    try:
        cognitive_state = fuse_cognitive_signals(
            text_friction=payload.text_friction,
            vocal_state=payload.vocal_state,
            facial_expression=payload.facial_expression,
        )

        context = _build_cognitive_context(payload, cognitive_state)
        prompt, expected_response = build_prompt(context)

        success = 1
        llm_usage = {}
        
        try:
            llm_payload = await client.complete(prompt, modality=expected_response.value)
            ai_response = _parse_llm_payload(llm_payload.content, cognitive_state)
            llm_usage = llm_payload.usage
        except Exception as exc:  # noqa: BLE001
            logger.exception("LLM content generation failed; returning fallback response", exc_info=exc)
            ai_response = _fallback_response(context, cognitive_state)
            success = 0
        
        latency_ms = (time.perf_counter() - start_time) * 1000
        
        # Persist to database but do not fail the request if persistence fails
        try:
            # Store transcript
            await _store_transcript(db, payload, context, ai_response, llm_usage, latency_ms, success)

            # Log usage metrics
            await _store_metrics(db, payload.session_id, llm_usage, latency_ms, success)

            # Commit all database changes
            await db.commit()
        except Exception as db_exc:  # noqa: BLE001
            # If DB operations fail, rollback and continue returning the AI response
            logger.exception("Database persistence failed; rolling back but returning AI response", exc_info=db_exc)
            await db.rollback()

        return ai_response
        
    except Exception as exc:  # noqa: BLE001
        logger.exception("Request processing failed", exc_info=exc)
        await db.rollback()
        # Return a safe fallback
        return _fallback_response(
            CognitiveContext(
                session_id=payload.session_id,
                topic="General",
                query_text=payload.query_text,
                cognitive_state=CognitiveState.FOCUSED,
                conversation_history=[],
                learning_objectives=[],
                knowledge_graph_nodes=[],
                last_response_type=None,
                text_friction_summary="",
                vocal_state=payload.vocal_state,
                facial_expression=payload.facial_expression,
            ),
            CognitiveState.FOCUSED,
        )


def _build_cognitive_context(payload: UserInput, cognitive_state: CognitiveState) -> CognitiveContext:
    meta = payload.meta or {}

    topic = meta.get("topic") or meta.get("subject") or "General Exploration"
    objectives = _split_meta_list(meta.get("objectives"))
    knowledge_nodes = _split_meta_list(meta.get("knowledgeNodes"))
    history = _parse_history(meta.get("history"))
    text_summary = _summarize_text_friction(payload.text_friction.rephrase_count, payload.text_friction.backspace_count)
    last_response_type = _parse_response_type(meta.get("lastResponseType"))

    return CognitiveContext(
        session_id=payload.session_id,
        topic=topic,
        query_text=payload.query_text,
        cognitive_state=cognitive_state,
        conversation_history=history,
        learning_objectives=objectives,
        knowledge_graph_nodes=knowledge_nodes,
        last_response_type=last_response_type,
        text_friction_summary=text_summary,
        vocal_state=payload.vocal_state,
        facial_expression=payload.facial_expression,
    )


def _summarize_text_friction(rephrase_count: int, backspace_count: int) -> str:
    return f"{rephrase_count} rephrases, {backspace_count} backspaces"


def _split_meta_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    if raw.strip().startswith("["):
        try:
            values = json.loads(raw)
            if isinstance(values, list):
                return [str(item) for item in values if item]
        except json.JSONDecodeError:
            pass
    return [part.strip() for part in raw.split(",") if part.strip()]


def _parse_history(raw: str | None) -> list[tuple[str, str]]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            history: list[tuple[str, str]] = []
            for entry in data[-8:]:
                role = str(entry.get("role", "unknown"))
                content = str(entry.get("content", ""))
                if content.strip():
                    history.append((role, content))
            return history
    except json.JSONDecodeError:
        pass
    return []


def _parse_response_type(raw: str | None) -> ResponseType | None:
    if not raw:
        return None
    try:
        return ResponseType(raw)
    except ValueError:
        return None


def _parse_llm_payload(raw: str, default_state: CognitiveState) -> AIResponse:
    candidate = _extract_json_object(raw)
    if "knowledgeGraphDelta" not in candidate:
        candidate["knowledgeGraphDelta"] = {"nodes": [], "edges": []}
    candidate.setdefault("responseType", ResponseType.TEXT.value)
    candidate.setdefault("cognitiveState", default_state.value)

    try:
        return AIResponse(**candidate)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Invalid LLM payload structure") from exc


def _extract_json_object(raw: str) -> dict[str, Any]:
    raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = raw[start : end + 1]
            return json.loads(snippet)
        raise


def _fallback_response(context: CognitiveContext, cognitive_state: CognitiveState) -> AIResponse:
    headline = "Let’s reset and unpack this together."
    if cognitive_state == CognitiveState.FOCUSED:
        modality = ResponseType.TEXT
        content = (
            f"I'm reinforcing the core idea around {context.topic}. "
            "Here’s a quick recap followed by a suggested next question to deepen your understanding."
        )
    elif cognitive_state == CognitiveState.CONFUSED:
        modality = ResponseType.DIAGRAM
        content = (
            "It seems the concept is still fuzzy. Visualising the flow often helps—picture the main concept as a hub with the sub-components branching out."
        )
    else:
        modality = ResponseType.CODE
        content = (
            "Hands-on practice can break frustration. Below is a small code experiment; tweak the highlighted line and observe how the behaviour changes."
        )

    node_id = f"node_{context.topic.lower().replace(' ', '_')}"
    node = KnowledgeGraphNode(
        id=node_id,
        type="concept",
        label=context.topic,
        mastered=False,
    )

    return AIResponse(
        responseType=modality,
        content=f"{headline}\n\n{content}",
        cognitiveState=cognitive_state,
        knowledgeGraphDelta=KnowledgeGraphDelta(nodes=[node], edges=[]),
    )


async def _store_transcript(
    db: AsyncSession,
    payload: UserInput,
    context: CognitiveContext,
    ai_response: AIResponse,
    llm_usage: dict[str, Any],
    latency_ms: float,
    success: int,
) -> None:
    transcript = SessionTranscript(
        session_id=payload.session_id,
        timestamp=datetime.now(UTC),
        query_text=payload.query_text,
        text_friction_summary=context.text_friction_summary,
        vocal_state=context.vocal_state.value if context.vocal_state else None,
        facial_expression=context.facial_expression.value if context.facial_expression else None,
        cognitive_state=ai_response.cognitive_state.value,
        response_type=ai_response.response_type.value,
        response_content=ai_response.content,
        knowledge_graph_delta=ai_response.knowledge_graph_delta.dict(),
        llm_tokens_used=llm_usage.get("total_tokens"),
        llm_latency_ms=latency_ms,
        success=success,
    )
    db.add(transcript)


async def _store_metrics(
    db: AsyncSession,
    session_id: str,
    llm_usage: dict[str, Any],
    latency_ms: float,
    success: int,
) -> None:
    metrics = UsageMetrics(
        session_id=session_id,
        timestamp=datetime.now(UTC),
        endpoint="/analyze",
        total_tokens=llm_usage.get("total_tokens"),
        prompt_tokens=llm_usage.get("prompt_tokens"),
        completion_tokens=llm_usage.get("completion_tokens"),
        latency_ms=latency_ms,
        model=llm_usage.get("model"),
        success=success,
    )
    db.add(metrics)


@router.get("/provider/health")
async def provider_health(
    client: Annotated[GoogleAIClient | OpenRouterClient, Depends(get_client)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Lightweight provider health probe.

    Attempts a minimal completion and returns provider, model, ok flag,
    and token usage. On failure, returns ok=false with error details.
    """
    try:
        resp = await client.complete("Return a small JSON object acknowledging readiness.", modality="text")
        return {
            "ok": True,
            "provider": settings.model_provider,
            "model": getattr(settings, "model_id", None),
            "usage": resp.usage,
            "sample": resp.content[:200],
        }
    except Exception as exc:  # noqa: BLE001
        logger.exception("Provider health check failed", exc_info=exc)
        return {
            "ok": False,
            "provider": settings.model_provider,
            "model": getattr(settings, "model_id", None),
            "error": str(exc),
        }
