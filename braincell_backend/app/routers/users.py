from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Literal
from app.database import get_db
from app.database.models import User

router = APIRouter(prefix="/api/v1/users", tags=["users"])

class UserSync(BaseModel):
    clerk_user_id: str
    email: str
    full_name: str
    role: Literal["student", "teacher"]

@router.post("/sync")
async def sync_user(
    user_data: UserSync,
    db: AsyncSession = Depends(get_db)
):
    """
    Sync Clerk user to database.
    Creates a new user if doesn't exist, updates if exists.
    """
    try:
        # Check if user already exists
        result = await db.execute(
            select(User).where(User.clerk_user_id == user_data.clerk_user_id)
        )
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Update existing user
            existing_user.email = user_data.email
            existing_user.full_name = user_data.full_name
            existing_user.role = user_data.role
            await db.commit()
            await db.refresh(existing_user)
            return {
                "message": "User updated successfully",
                "user_id": str(existing_user.id),
                "clerk_user_id": existing_user.clerk_user_id,
                "role": existing_user.role
            }
        else:
            # Create new user
            new_user = User(
                clerk_user_id=user_data.clerk_user_id,
                email=user_data.email,
                full_name=user_data.full_name,
                role=user_data.role
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return {
                "message": "User created successfully",
                "user_id": str(new_user.id),
                "clerk_user_id": new_user.clerk_user_id,
                "role": new_user.role
            }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to sync user: {str(e)}")

@router.get("/{clerk_user_id}")
async def get_user(
    clerk_user_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get user by Clerk user ID"""
    result = await db.execute(
        select(User).where(User.clerk_user_id == clerk_user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": str(user.id),
        "clerk_user_id": user.clerk_user_id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }
