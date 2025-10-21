"""
Feature 3.0: Teacher Dashboard API Routes
Handles classroom management, student enrollment, and analytics.
"""

from __future__ import annotations

import secrets
import string
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...database import get_db
from ...database.models import Classroom, ConceptMastery, SessionTranscript, Student

router = APIRouter(prefix="/api/v1/classroom", tags=["classroom"])


# ============================================================================
# Request/Response Models
# ============================================================================


class CreateClassroomRequest(BaseModel):
    """Request to create a new classroom."""
    teacher_id: str = Field(..., description="Unique teacher identifier")
    teacher_name: str = Field(..., description="Teacher's display name")
    name: str = Field(..., description="Classroom name (e.g., 'Physics 101')")
    subject: str | None = Field(None, description="Subject being taught")
    grade_level: str | None = Field(None, description="Grade level (e.g., '10th')")


class ClassroomResponse(BaseModel):
    """Response with classroom details."""
    classroom_id: str
    teacher_id: str
    teacher_name: str
    name: str
    subject: str | None
    grade_level: str | None
    join_code: str
    is_active: bool
    created_at: str
    student_count: int = 0


class JoinClassroomRequest(BaseModel):
    """Request for a student to join a classroom."""
    join_code: str = Field(..., description="8-character classroom join code")
    student_id: str = Field(..., description="Student's unique ID (from auth)")
    student_name: str = Field(..., description="Student's display name")
    student_email: str | None = Field(None, description="Student's email (optional)")


class StudentResponse(BaseModel):
    """Response with student details."""
    student_id: str
    name: str
    email: str | None
    classroom_id: str
    is_active: bool
    joined_at: str
    last_active: str


class ConceptMasteryStats(BaseModel):
    """Statistics for a single concept across the classroom."""
    concept_id: str
    concept_name: str
    topic: str
    avg_mastery: float
    total_attempts: int
    students_struggling: int  # mastery < 0.4
    students_mastered: int  # mastery >= 0.7


class StudentAnalytics(BaseModel):
    """Analytics for a single student."""
    student_id: str
    student_name: str
    total_sessions: int
    avg_mastery: float
    concepts_struggling: int
    concepts_mastered: int
    total_confused_count: int
    total_frustrated_count: int
    last_active: str
    needs_help: bool


class ClassroomAnalytics(BaseModel):
    """Comprehensive analytics for a classroom."""
    classroom_id: str
    classroom_name: str
    total_students: int
    active_students: int
    
    # Concept-level analytics
    concepts: list[ConceptMasteryStats]
    most_confused_topics: list[str]
    
    # Student-level analytics
    students_needing_help: list[StudentAnalytics]
    
    # Overall metrics
    avg_class_mastery: float
    total_sessions: int


# ============================================================================
# Utility Functions
# ============================================================================


def generate_join_code() -> str:
    """Generate a unique 8-character alphanumeric join code."""
    # Use uppercase letters and digits (avoid confusing characters like O, 0, I, 1)
    chars = string.ascii_uppercase.replace('O', '').replace('I', '') + string.digits.replace('0', '').replace('1', '')
    return ''.join(secrets.choice(chars) for _ in range(8))


async def get_classroom_by_id(db: AsyncSession, classroom_id: str) -> Classroom | None:
    """Fetch a classroom by its ID."""
    result = await db.execute(
        select(Classroom).where(Classroom.classroom_id == classroom_id)
    )
    return result.scalar_one_or_none()


async def get_classroom_by_join_code(db: AsyncSession, join_code: str) -> Classroom | None:
    """Fetch a classroom by its join code."""
    result = await db.execute(
        select(Classroom).where(Classroom.join_code == join_code.upper())
    )
    return result.scalar_one_or_none()


# ============================================================================
# Classroom Management Endpoints
# ============================================================================


@router.post("/create", response_model=ClassroomResponse)
async def create_classroom(
    request: CreateClassroomRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new classroom with a unique join code.
    
    Teachers use this to set up their virtual classroom. Students can then
    join using the generated join code.
    """
    # Generate unique classroom ID and join code
    classroom_id = f"class_{secrets.token_urlsafe(16)}"
    
    # Keep generating join codes until we find a unique one
    while True:
        join_code = generate_join_code()
        existing = await get_classroom_by_join_code(db, join_code)
        if not existing:
            break
    
    # Create classroom
    classroom = Classroom(
        classroom_id=classroom_id,
        teacher_id=request.teacher_id,
        teacher_name=request.teacher_name,
        name=request.name,
        subject=request.subject,
        grade_level=request.grade_level,
        join_code=join_code,
        is_active=1,
    )
    
    db.add(classroom)
    await db.commit()
    await db.refresh(classroom)
    
    return ClassroomResponse(
        classroom_id=classroom.classroom_id,
        teacher_id=classroom.teacher_id,
        teacher_name=classroom.teacher_name,
        name=classroom.name,
        subject=classroom.subject,
        grade_level=classroom.grade_level,
        join_code=classroom.join_code,
        is_active=bool(classroom.is_active),
        created_at=classroom.created_at.isoformat(),
        student_count=0,
    )


@router.get("/teacher/{teacher_id}", response_model=list[ClassroomResponse])
async def get_teacher_classrooms(
    teacher_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get all classrooms for a specific teacher.
    
    Returns active and archived classrooms with student counts.
    """
    # Fetch all classrooms for this teacher
    result = await db.execute(
        select(Classroom).where(Classroom.teacher_id == teacher_id)
    )
    classrooms = result.scalars().all()
    
    # Get student counts for each classroom
    response = []
    for classroom in classrooms:
        # Count active students
        student_count_result = await db.execute(
            select(func.count(Student.id))
            .where(Student.classroom_id == classroom.classroom_id)
            .where(Student.is_active == 1)
        )
        student_count = student_count_result.scalar() or 0
        
        response.append(ClassroomResponse(
            classroom_id=classroom.classroom_id,
            teacher_id=classroom.teacher_id,
            teacher_name=classroom.teacher_name,
            name=classroom.name,
            subject=classroom.subject,
            grade_level=classroom.grade_level,
            join_code=classroom.join_code,
            is_active=bool(classroom.is_active),
            created_at=classroom.created_at.isoformat(),
            student_count=student_count,
        ))
    
    return response


@router.get("/{classroom_id}/students", response_model=list[StudentResponse])
async def get_classroom_students(
    classroom_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get all students in a classroom.
    
    Returns the student roster with activity timestamps.
    """
    # Verify classroom exists
    classroom = await get_classroom_by_id(db, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Fetch all students
    result = await db.execute(
        select(Student)
        .where(Student.classroom_id == classroom_id)
        .where(Student.is_active == 1)
    )
    students = result.scalars().all()
    
    return [
        StudentResponse(
            student_id=student.student_id,
            name=student.name,
            email=student.email,
            classroom_id=student.classroom_id,
            is_active=bool(student.is_active),
            joined_at=student.joined_at.isoformat(),
            last_active=student.last_active.isoformat(),
        )
        for student in students
    ]


# ============================================================================
# Student Enrollment Endpoints
# ============================================================================


class JoinClassroomResponse(BaseModel):
    """Response for joining a classroom."""
    success: bool
    message: str
    classroom_id: str
    classroom_name: str
    student_id: str
    join_code: str
    already_joined: bool = False


@router.post("/join", response_model=JoinClassroomResponse)
async def join_classroom(
    request: JoinClassroomRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Student joins a classroom using a join code.
    
    Students can join multiple classrooms - one row per classroom.
    Prevents duplicate joins to the same classroom.
    """
    # Find classroom by join code
    classroom = await get_classroom_by_join_code(db, request.join_code)
    if not classroom or not classroom.is_active:
        raise HTTPException(status_code=404, detail="Invalid join code or classroom is not active")
    
    # Check if student already in THIS classroom
    existing_enrollment_result = await db.execute(
        select(Student).where(
            Student.student_id == request.student_id,
            Student.classroom_id == classroom.classroom_id
        )
    )
    existing_enrollment = existing_enrollment_result.scalar_one_or_none()

    if existing_enrollment:
        # Student already in this classroom - just reactivate if needed
        if not existing_enrollment.is_active:
            existing_enrollment.is_active = 1
        existing_enrollment.last_active = datetime.now(UTC)
        existing_enrollment.name = request.student_name
        existing_enrollment.email = request.student_email
        await db.commit()
        await db.refresh(existing_enrollment)

        return JoinClassroomResponse(
            success=True,
            message=f"Already joined {classroom.name}",
            classroom_id=classroom.classroom_id,
            classroom_name=classroom.name,
            student_id=existing_enrollment.student_id,
            join_code=classroom.join_code,
            already_joined=True,
        )
    
    # Create new enrollment for this student in this classroom
    student = Student(
        student_id=request.student_id,
        name=request.student_name,
        email=request.student_email,
        classroom_id=classroom.classroom_id,
        is_active=1,
    )
    
    db.add(student)
    await db.commit()
    await db.refresh(student)
    
    return JoinClassroomResponse(
        success=True,
        message=f"Successfully joined {classroom.name}",
        classroom_id=classroom.classroom_id,
        classroom_name=classroom.name,
        student_id=student.student_id,
        join_code=classroom.join_code,
        already_joined=False,
    )


# ============================================================================
# Analytics Endpoints
# ============================================================================


@router.get("/{classroom_id}/analytics", response_model=ClassroomAnalytics)
async def get_classroom_analytics(
    classroom_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get comprehensive analytics for a classroom.
    
    Returns:
    - Concept mastery statistics (avg mastery, struggling students)
    - Student performance data (who needs help)
    - Most confused topics across the class
    """
    # Verify classroom exists
    classroom = await get_classroom_by_id(db, classroom_id)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Get all students in classroom
    students_result = await db.execute(
        select(Student).where(Student.classroom_id == classroom_id).where(Student.is_active == 1)
    )
    students = students_result.scalars().all()
    student_ids = [s.student_id for s in students]
    
    if not student_ids:
        # No students yet, return empty analytics
        return ClassroomAnalytics(
            classroom_id=classroom_id,
            classroom_name=classroom.name,
            total_students=0,
            active_students=0,
            concepts=[],
            most_confused_topics=[],
            students_needing_help=[],
            avg_class_mastery=0.0,
            total_sessions=0,
        )
    
    # ========================================================================
    # Concept-Level Analytics
    # ========================================================================
    
    # Get all concept mastery records for these students
    concepts_result = await db.execute(
        select(
            ConceptMastery.concept_id,
            ConceptMastery.concept_name,
            ConceptMastery.topic,
            func.avg(ConceptMastery.mastery_level).label('avg_mastery'),
            func.sum(ConceptMastery.attempts).label('total_attempts'),
            func.sum(case((ConceptMastery.mastery_level < 0.4, 1), else_=0)).label('struggling'),
            func.sum(case((ConceptMastery.mastery_level >= 0.7, 1), else_=0)).label('mastered'),
        )
        .where(ConceptMastery.student_id.in_(student_ids))
        .group_by(ConceptMastery.concept_id, ConceptMastery.concept_name, ConceptMastery.topic)
    )
    concepts_data = concepts_result.all()
    
    concept_stats = [
        ConceptMasteryStats(
            concept_id=row[0],
            concept_name=row[1],
            topic=row[2],
            avg_mastery=round(float(row[3] or 0), 2),
            total_attempts=int(row[4] or 0),
            students_struggling=int(row[5] or 0),
            students_mastered=int(row[6] or 0),
        )
        for row in concepts_data
    ]
    
    # Find most confused topics (lowest avg mastery + high confused counts)
    confused_topics_result = await db.execute(
        select(
            ConceptMastery.topic,
            func.avg(ConceptMastery.mastery_level).label('avg_mastery'),
            func.sum(ConceptMastery.confused_count + ConceptMastery.frustrated_count).label('confusion_total'),
        )
        .where(ConceptMastery.student_id.in_(student_ids))
        .group_by(ConceptMastery.topic)
        .order_by(func.avg(ConceptMastery.mastery_level).asc(), func.sum(ConceptMastery.confused_count + ConceptMastery.frustrated_count).desc())
        .limit(5)
    )
    most_confused_topics = [row[0] for row in confused_topics_result]
    
    # ========================================================================
    # Student-Level Analytics
    # ========================================================================
    
    students_needing_help = []
    
    for student in students:
        # Get mastery stats for this student
        mastery_result = await db.execute(
            select(
                func.avg(ConceptMastery.mastery_level).label('avg_mastery'),
                func.sum(case((ConceptMastery.mastery_level < 0.4, 1), else_=0)).label('struggling'),
                func.sum(case((ConceptMastery.mastery_level >= 0.7, 1), else_=0)).label('mastered'),
                func.sum(ConceptMastery.confused_count).label('total_confused'),
                func.sum(ConceptMastery.frustrated_count).label('total_frustrated'),
            )
            .where(ConceptMastery.student_id == student.student_id)
        )
        mastery_row = mastery_result.first()
        
        # Get session count
        session_result = await db.execute(
            select(func.count(func.distinct(SessionTranscript.session_id)))
            .where(SessionTranscript.session_id.like(f"{student.student_id}%"))
        )
        session_count = session_result.scalar() or 0
        
        if mastery_row and mastery_row[0] is not None:
            avg_mastery = float(mastery_row[0])
            struggling = int(mastery_row[1] or 0)
            mastered = int(mastery_row[2] or 0)
            confused = int(mastery_row[3] or 0)
            frustrated = int(mastery_row[4] or 0)
            
            # Student needs help if: low avg mastery OR high confusion/frustration
            needs_help = avg_mastery < 0.5 or confused > 5 or frustrated > 3
            
            if needs_help:
                students_needing_help.append(StudentAnalytics(
                    student_id=student.student_id,
                    student_name=student.name,
                    total_sessions=session_count,
                    avg_mastery=round(avg_mastery, 2),
                    concepts_struggling=struggling,
                    concepts_mastered=mastered,
                    total_confused_count=confused,
                    total_frustrated_count=frustrated,
                    last_active=student.last_active.isoformat(),
                    needs_help=True,
                ))
    
    # Sort by most help needed (lowest mastery + highest confusion)
    students_needing_help.sort(key=lambda s: (s.avg_mastery, -s.total_confused_count - s.total_frustrated_count))
    
    # ========================================================================
    # Overall Metrics
    # ========================================================================
    
    # Calculate class-wide average mastery
    class_mastery_result = await db.execute(
        select(func.avg(ConceptMastery.mastery_level))
        .where(ConceptMastery.student_id.in_(student_ids))
    )
    avg_class_mastery = float(class_mastery_result.scalar() or 0)
    
    # Count total unique sessions
    total_sessions_result = await db.execute(
        select(func.count(func.distinct(SessionTranscript.session_id)))
        .where(SessionTranscript.session_id.in_([f"{sid}_%" for sid in student_ids]))
    )
    total_sessions = total_sessions_result.scalar() or 0
    
    return ClassroomAnalytics(
        classroom_id=classroom_id,
        classroom_name=classroom.name,
        total_students=len(students),
        active_students=len(students),
        concepts=concept_stats,
        most_confused_topics=most_confused_topics,
        students_needing_help=students_needing_help,
        avg_class_mastery=round(avg_class_mastery, 2),
        total_sessions=total_sessions,
    )
