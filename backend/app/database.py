"""Async SQLAlchemy database engine and session configuration."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def init_db():
    """Create all tables for SQLite database."""
    async with engine.begin() as conn:
        # Import all models so they are registered with Base
        from app.models import user, image, annotation, comment, embedding  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)

        # Ensure all user columns exist on users table
        from sqlalchemy import text
        for col_def in [
            "profession VARCHAR(255)",
            "phone_number VARCHAR(50)",
            "address VARCHAR(500)",
            "supporter_comments VARCHAR(2000)",
            "app_tag VARCHAR(50) DEFAULT 'healthlms'",
            "firebase_uid VARCHAR(128)",
            "specialization VARCHAR(255)",
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_def}"))
            except Exception:
                pass


async def get_db():
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()