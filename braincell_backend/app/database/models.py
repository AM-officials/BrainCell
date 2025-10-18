"""Database models for session storage."""

from __future__ import annotations

from datetime import UTC, datetime

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class SessionTranscript(Base):
    __tablename__ = "session_transcripts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    
    # User input
    query_text = Column(Text, nullable=False)
    text_friction_summary = Column(String(255))
    vocal_state = Column(String(50))
    facial_expression = Column(String(50))
    
    # Cognitive state
    cognitive_state = Column(String(50), nullable=False)
    
    # AI response
    response_type = Column(String(50), nullable=False)
    response_content = Column(Text, nullable=False)
    knowledge_graph_delta = Column(JSON)
    
    # Metrics
    llm_tokens_used = Column(Integer)
    llm_latency_ms = Column(Float)
    success = Column(Integer, default=1)  # 1 = success, 0 = fallback


class UsageMetrics(Base):
    __tablename__ = "usage_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(UTC), nullable=False)
    
    endpoint = Column(String(100), nullable=False)
    total_tokens = Column(Integer)
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)
    latency_ms = Column(Float)
    model = Column(String(100))
    success = Column(Integer, default=1)
