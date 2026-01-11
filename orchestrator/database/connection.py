"""
Database Connection and Session Management

This module provides async database connection pooling and session management
for the UltraThink Drugs platform. Uses SQLAlchemy 2.0+ async API with asyncpg.

Key Features:
- Async session support for FastAPI coroutines
- Connection pooling with health checks (pool_pre_ping)
- Configurable pool size based on environment
- Dependency injection for FastAPI routes
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator
import os
from contextlib import asynccontextmanager


class DatabaseConfig:
    """
    Database configuration with environment-based settings.

    Environment Variables:
    - DATABASE_URL: Full async PostgreSQL connection string
    - DB_POOL_SIZE: Max connections (default: 20)
    - DB_MAX_OVERFLOW: Extra connections beyond pool_size (default: 10)
    - DB_ECHO: Log SQL queries for debugging (default: False)
    """

    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://ultrathink:dev_password_change_in_prod@localhost:5432/ultrathink_dev"
        )

        # Convert postgres:// to postgresql+asyncpg:// if needed (Heroku compatibility)
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql+asyncpg://", 1)

        self.pool_size = int(os.getenv("DB_POOL_SIZE", "20"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        self.echo = os.getenv("DB_ECHO", "False").lower() == "true"

        # For testing, use NullPool to avoid connection leaks
        self.use_null_pool = os.getenv("DB_USE_NULL_POOL", "False").lower() == "true"


# Global configuration
config = DatabaseConfig()

# Create async engine with connection pooling
engine = create_async_engine(
    config.database_url,
    echo=config.echo,
    poolclass=NullPool if config.use_null_pool else None,
    pool_size=config.pool_size if not config.use_null_pool else None,
    max_overflow=config.max_overflow if not config.use_null_pool else None,
    pool_pre_ping=True,  # Verify connections before using (prevents stale connections)
    pool_recycle=3600,  # Recycle connections after 1 hour
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Don't expire objects after commit (allows access outside transaction)
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions.

    Usage in routes:
        @app.get("/molecules")
        async def get_molecules(db: AsyncSession = Depends(get_db)):
            molecules = await db.execute(select(Molecule))
            return molecules.scalars().all()

    Transaction Management:
    - Session is created for each request
    - Session is automatically closed after request
    - Exceptions trigger rollback
    - Commits are handled by repositories (they control their own transactions)

    Note: Repositories are responsible for calling commit(). This allows:
    - Multiple repository operations in a single transaction
    - Explicit transaction control
    - Better error handling
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # Don't auto-commit - repositories handle this
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context():
    """
    Context manager for database sessions (non-FastAPI usage).

    Usage:
        async with get_db_context() as db:
            molecule = await db.get(Molecule, molecule_id)
            molecule.name = "Updated Name"
            await db.commit()
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables.

    Creates all tables defined in Base.metadata. Should be called on startup
    or use Alembic migrations for production.
    """
    from database.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database engine and all connections.

    Should be called on application shutdown to gracefully close connections.
    """
    await engine.dispose()


# Health check utility
async def check_db_connection() -> bool:
    """
    Verify database connectivity.

    Returns:
        bool: True if database is reachable, False otherwise

    Usage in health check endpoint:
        @app.get("/health")
        async def health():
            db_ok = await check_db_connection()
            return {"status": "healthy" if db_ok else "degraded", "database": db_ok}
    """
    try:
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"Database health check failed: {e}")
        return False
