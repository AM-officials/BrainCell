from __future__ import annotations

from textwrap import dedent

from ..api.schemas import CognitiveState, ResponseType
from .typing import CognitiveContext

MODALITY_DIRECTIVES: dict[CognitiveState, tuple[ResponseType, str]] = {
    CognitiveState.FOCUSED: (
        ResponseType.TEXT,
        "Deliver a concise textual explanation that builds intuition, then reinforce with a short checklist of key points.",
    ),
    CognitiveState.CONFUSED: (
        ResponseType.DIAGRAM,
        "Use a Mermaid diagram to visualise relationships. Start with a one-sentence anchor explanation, then provide the diagram.",
    ),
    CognitiveState.FRUSTRATED: (
        ResponseType.CODE,
        "Present a small, runnable code sample (JavaScript or Python) with inline comments. Follow with a quick experiment suggestion.",
    ),
}


def build_prompt(context: CognitiveContext) -> tuple[str, ResponseType]:
    response_type, modality_guidance = _preferred_modality(context)

    history_section = _render_history(context.conversation_history)
    objectives_section = _render_bullets(context.learning_objectives, "No explicit objectives logged yet.")
    knowledge_section = _render_bullets(context.knowledge_graph_nodes, "Graph is empty. Introduce foundational concepts.")

    text_friction = context.text_friction_summary or "Not reported"
    vocal = context.vocal_state.value if context.vocal_state else "Not detected"
    facial = context.facial_expression.value if context.facial_expression else "Not detected"
    last_modality = context.last_response_type.value if context.last_response_type else "None yet"

    prompt = dedent(
        f"""
        You are BrainCell, an adaptive learning copilot. Tailor the modality and depth of your response to help the learner break through their current obstacle.

        ## Session Metadata
        - Session ID: {context.session_id}
        - Topic: {context.topic}
        - Cognitive State: {context.cognitive_state.value}
        - Recommended Modality: {response_type.value}
        - Previous Modality: {last_modality}

        ## Learner Signals
        - Text Friction Summary: {text_friction}
        - Vocal State: {vocal}
        - Facial Expression: {facial}

        ## Learner Question
        """.strip()
    )

    prompt += f"\n{context.query_text.strip()}\n"

    prompt += dedent(
        f"""

        ## Conversation History (most recent first)
        {history_section}

        ## Learning Objectives
        {objectives_section}

        ## Knowledge Graph Snapshot
        {knowledge_section}

        ## Modality Guidance
        {modality_guidance}

        ## Output Contract
        - Respond with a **single JSON object** (no Markdown fences) containing keys: `responseType`, `content`, `cognitiveState`, `knowledgeGraphDelta`.
        - `responseType` should normally be {response_type.value!r}. Switch only if the situation demands it and explain briefly inside `content`.
        - `content` must align with the chosen modality (plain text, Mermaid diagram, or executable code) and include actionable next steps.
        - `knowledgeGraphDelta.nodes` should introduce up to 2 new concepts with `id`, `type`, `label`, and `mastered` (boolean).
        - `knowledgeGraphDelta.edges` should link new concepts to prior ones when relevant.
        - Keep JSON valid and concise. Escape newlines as `\n` where necessary.

        Example schema (values are illustrative only):
        {{
            "responseType": "{response_type.value}",
            "content": "...",
            "cognitiveState": "{context.cognitive_state.value}",
            "knowledgeGraphDelta": {{
                "nodes": [
                    {{"id": "node_rnn_backprop", "type": "concept", "label": "Backprop Through Time", "mastered": false}}
                ],
                "edges": [
                    {{"id": "edge_rnn1", "source": "node_root", "target": "node_rnn_backprop", "label": "builds_on"}}
                ]
            }}
        }}

        If information is missing, make a best-effort inference and note assumptions within the `content` field.
        """
    )

    return prompt.strip(), response_type


def _preferred_modality(context: CognitiveContext) -> tuple[ResponseType, str]:
    base_type, guidance = MODALITY_DIRECTIVES.get(
        context.cognitive_state, (ResponseType.TEXT, "Provide a clear textual explanation and highlight key takeaways.")
    )

    if context.last_response_type == base_type and context.cognitive_state == CognitiveState.FOCUSED:
        # Encourage variety in sustained focus to avoid repetition.
        return ResponseType.DIAGRAM, (
            "Learner remains focused after a textual response. Offer a quick visual (Mermaid diagram) to deepen understanding."
        )

    return base_type, guidance


def _render_history(history: list[tuple[str, str]]) -> str:
    if not history:
        return "- (no previous exchanges)"

    limited = list(reversed(history[-6:]))  # Most recent first
    lines = []
    for idx, (role, message) in enumerate(limited, start=1):
        sanitized = " ".join(message.split())
        lines.append(f"- {idx}. {role}: {sanitized}")
    return "\n".join(lines)


def _render_bullets(items: list[str], fallback: str) -> str:
    if not items:
        return f"- {fallback}"
    return "\n".join(f"- {item}" for item in items)
