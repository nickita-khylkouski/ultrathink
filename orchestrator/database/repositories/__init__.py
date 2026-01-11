"""
Repository Pattern for Data Access Layer

Repositories encapsulate database queries and business logic, providing
a clean interface for data operations. This pattern:

1. Separates business logic from persistence details
2. Makes testing easier (can mock repositories)
3. Provides consistent error handling
4. Centralizes query optimization
"""

from database.repositories.user_repository import UserRepository
from database.repositories.project_repository import ProjectRepository
from database.repositories.molecule_repository import MoleculeRepository
from database.repositories.prediction_repository import PredictionRepository

__all__ = [
    "UserRepository",
    "ProjectRepository",
    "MoleculeRepository",
    "PredictionRepository",
]
