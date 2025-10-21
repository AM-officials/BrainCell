"""
Database migration: Add users table for Clerk authentication

Run this script to add the users table to your existing database:
python braincell_backend/migrations/add_users_table.py
"""

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("braincell_backend/.env")

DATABASE_URL = os.getenv("DATABASE_URL")

async def add_users_table():
    """Add users table to the database"""
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Create users table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Create index on clerk_user_id
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id 
            ON users(clerk_user_id)
        """))
        
        print("✅ Users table created successfully!")
    
    await engine.dispose()

if __name__ == "__main__":
    print("Running database migration: Add users table")
    asyncio.run(add_users_table())
    print("Migration complete!")
