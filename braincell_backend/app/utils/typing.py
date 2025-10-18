from __future__ import annotations

from dataclasses import dataclass, field

from ..api.schemas import CognitiveState, FacialExpression, ResponseType, VocalState


@dataclass(slots=True)
class CognitiveContext:
    session_id: str
    topic: str
    query_text: str
    cognitive_state: CognitiveState
    conversation_history: list[tuple[str, str]] = field(default_factory=list)
    learning_objectives: list[str] = field(default_factory=list)
    knowledge_graph_nodes: list[str] = field(default_factory=list)
    last_response_type: ResponseType | None = None
    text_friction_summary: str | None = None
    vocal_state: VocalState | None = None
    facial_expression: FacialExpression | None = None
