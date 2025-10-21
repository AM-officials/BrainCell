from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class CognitiveState(str, Enum):
    FOCUSED = "FOCUSED"
    CONFUSED = "CONFUSED"
    FRUSTRATED = "FRUSTRATED"


class ResponseType(str, Enum):
    TEXT = "text"
    DIAGRAM = "diagram"
    CODE = "code"


class FacialExpression(str, Enum):
    FEAR = "fear"
    SAD = "sad"
    ANGRY = "angry"
    SURPRISE = "surprise"
    NEUTRAL = "neutral"
    HAPPY = "happy"


class VocalState(str, Enum):
    CALM = "calm"
    HESITANT = "hesitant"
    STRESSED = "stressed"
    FRUSTRATED = "frustrated"


class TextFriction(BaseModel):
    rephrase_count: int = Field(ge=0, alias="rephraseCount")
    backspace_count: int = Field(ge=0, alias="backspaceCount")

    class Config:
        allow_population_by_field_name = True


class UserInput(BaseModel):
    session_id: str = Field(..., alias="sessionId")
    query_text: str = Field(..., alias="queryText")
    text_friction: TextFriction = Field(..., alias="text_friction")
    audio_blob: str | None = Field(None, alias="audioBlob")
    facial_expression: FacialExpression | None = Field(None, alias="facial_expression")
    vocal_state: VocalState | None = Field(None, alias="vocal_state")
    meta: dict[str, str]

    class Config:
        allow_population_by_field_name = True


class KnowledgeGraphNode(BaseModel):
    id: str
    type: Literal["concept", "mastered", "note"]
    label: str
    mastered: bool


class KnowledgeGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None


class KnowledgeGraphDelta(BaseModel):
    nodes: list[KnowledgeGraphNode] = Field(default_factory=list)
    edges: list[KnowledgeGraphEdge] = Field(default_factory=list)


class AIResponse(BaseModel):
    response_type: ResponseType = Field(..., alias="responseType")
    content: str
    cognitive_state: CognitiveState = Field(..., alias="cognitiveState")
    knowledge_graph_delta: KnowledgeGraphDelta = Field(..., alias="knowledgeGraphDelta")
    metrics: dict | None = None

    class Config:
        allow_population_by_field_name = True
