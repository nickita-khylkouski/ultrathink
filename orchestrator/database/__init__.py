"""
UltraThink Drugs Database Package

This package provides ORM models, database connections, and repository
patterns for the drug discovery platform.

Modules:
- models: SQLAlchemy ORM model definitions
- connection: Async database engine and session management
- repositories: Data access layer with business logic
"""

from database.models import (
    Base,
    User,
    Project,
    Molecule,
    ADMETPrediction,
    ProteinStructure,
    DockingResult,
    ActivityLog,
)
from database.connection import (
    engine,
    AsyncSessionLocal,
    get_db,
    get_db_context,
    init_db,
    close_db,
    check_db_connection,
)

__all__ = [
    # Models
    "Base",
    "User",
    "Project",
    "Molecule",
    "ADMETPrediction",
    "ProteinStructure",
    "DockingResult",
    "ActivityLog",
    # Connection
    "engine",
    "AsyncSessionLocal",
    "get_db",
    "get_db_context",
    "init_db",
    "close_db",
    "check_db_connection",
]
