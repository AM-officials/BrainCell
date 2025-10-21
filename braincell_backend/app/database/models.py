"""Database models for session storage."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class User(Base):
    """
    Clerk Authentication Integration
    Stores user information synced from Clerk
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clerk_user_id = Column(String(255), nullable=False, unique=True, index=True)
    
    # User details
    email = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # 'student' or 'teacher'
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SessionTranscript(Base):
    __tablename__ = "session_transcripts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
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
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    endpoint = Column(String(100), nullable=False)
    total_tokens = Column(Integer)
    prompt_tokens = Column(Integer)
    completion_tokens = Column(Integer)
    latency_ms = Column(Float)
    model = Column(String(100))
    success = Column(Integer, default=1)


class ConceptMastery(Base):
    """
    Feature 2.0: Knowledge Gap Detection
    Tracks student mastery level for each concept
    """
    __tablename__ = "concept_mastery"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(255), nullable=False, index=True)
    concept_id = Column(String(255), nullable=False, index=True)
    concept_name = Column(String(255), nullable=False)
    topic = Column(String(255), nullable=False)
    
    # Mastery tracking
    mastery_level = Column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    attempts = Column(Integer, default=0, nullable=False)
    confused_count = Column(Integer, default=0, nullable=False)  # Times in CONFUSED state
    frustrated_count = Column(Integer, default=0, nullable=False)  # Times in FRUSTRATED state
    
    # Timestamps
    first_encountered = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_assessed = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Composite index for efficient lookups
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )


class Classroom(Base):
    """
    Feature 3.0: Teacher Dashboard
    Represents a classroom managed by a teacher
    """
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    classroom_id = Column(String(255), nullable=False, unique=True, index=True)
    teacher_id = Column(String(255), nullable=False, index=True)
    teacher_name = Column(String(255), nullable=False)
    
    # Classroom details
    name = Column(String(255), nullable=False)
    subject = Column(String(100))
    grade_level = Column(String(50))
    
    # Join code for students
    join_code = Column(String(8), nullable=False, unique=True, index=True)
    
    # Status
    is_active = Column(Integer, default=1, nullable=False)  # 1 = active, 0 = archived
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Student(Base):
    """
    Feature 3.0: Teacher Dashboard
    Represents a student enrolled in a classroom
    """
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(255), nullable=False, index=True)  # Removed unique constraint
    
    # Student details
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    
    # Classroom association
    classroom_id = Column(String(255), nullable=False, index=True)
    
    # Status
    is_active = Column(Integer, default=1, nullable=False)  # 1 = active, 0 = removed
    
    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_active = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Add unique constraint on (student_id, classroom_id) combination
    __table_args__ = (
        UniqueConstraint('student_id', 'classroom_id', name='uq_student_classroom'),
    )
