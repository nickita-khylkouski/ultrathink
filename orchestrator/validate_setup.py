#!/usr/bin/env python3
"""
Database Setup Validation Script

Checks if all database components are properly configured and working.
Run after setup to verify everything is correct.

Usage:
    python3 validate_setup.py
"""

import asyncio
import sys
import os
from typing import List, Tuple

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


class ValidationCheck:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.passed = False
        self.error = None


async def check_imports() -> Tuple[bool, str]:
    """Check if all required modules can be imported"""
    try:
        import sqlalchemy
        import asyncpg
        import alembic
        import redis
        import pytest
        import rdkit
        return True, "All required modules installed"
    except ImportError as e:
        return False, f"Missing module: {e.name}. Run: pip install -r requirements.txt"


async def check_env_file() -> Tuple[bool, str]:
    """Check if .env file exists and has required variables"""
    if not os.path.exists('.env'):
        return False, ".env file not found. Copy .env.template to .env"

    # Check for critical variables
    from dotenv import load_dotenv
    load_dotenv()

    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        return False, "DATABASE_URL not set in .env"

    return True, ".env file configured"


async def check_database_connection() -> Tuple[bool, str]:
    """Check if database is reachable"""
    try:
        sys.path.insert(0, '.')
        from database import check_db_connection

        if await check_db_connection():
            return True, "Database connection successful"
        else:
            return False, "Database connection failed. Is PostgreSQL running?"
    except Exception as e:
        return False, f"Database connection error: {str(e)}"


async def check_database_models() -> Tuple[bool, str]:
    """Check if database models can be imported"""
    try:
        from database.models import (
            User, Project, Molecule, ADMETPrediction,
            ProteinStructure, DockingResult, ActivityLog
        )
        return True, "All 7 database models imported successfully"
    except Exception as e:
        return False, f"Model import error: {str(e)}"


async def check_repositories() -> Tuple[bool, str]:
    """Check if repositories can be imported"""
    try:
        from database.repositories import (
            UserRepository, ProjectRepository,
            MoleculeRepository, PredictionRepository
        )
        return True, "All 4 repositories imported successfully"
    except Exception as e:
        return False, f"Repository import error: {str(e)}"


async def check_database_tables() -> Tuple[bool, str]:
    """Check if database tables exist"""
    try:
        from database import get_db_context
        from sqlalchemy import text

        async with get_db_context() as db:
            result = await db.execute(text("""
                SELECT COUNT(*)
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name IN ('users', 'projects', 'molecules', 'admet_predictions')
            """))
            count = result.scalar()

            if count >= 4:
                return True, f"{count} database tables found"
            else:
                return False, f"Only {count} tables found. Run: alembic upgrade head"
    except Exception as e:
        return False, f"Table check error: {str(e)}"


async def check_alembic() -> Tuple[bool, str]:
    """Check if Alembic is configured correctly"""
    try:
        if not os.path.exists('alembic'):
            return False, "alembic/ directory not found"

        if not os.path.exists('alembic.ini'):
            return False, "alembic.ini not found"

        # Try to get current revision
        from alembic.config import Config
        from alembic.script import ScriptDirectory

        config = Config("alembic.ini")
        script = ScriptDirectory.from_config(config)

        return True, "Alembic configured correctly"
    except Exception as e:
        return False, f"Alembic check error: {str(e)}"


async def check_docker_services() -> Tuple[bool, str]:
    """Check if Docker services are running"""
    try:
        import subprocess

        result = subprocess.run(
            ['docker-compose', 'ps', '--services', '--filter', 'status=running'],
            capture_output=True,
            text=True,
            check=True
        )

        running_services = result.stdout.strip().split('\n')

        if 'postgres' in running_services:
            return True, f"{len(running_services)} Docker services running"
        else:
            return False, "PostgreSQL not running. Run: docker-compose up -d"
    except FileNotFoundError:
        return False, "docker-compose not found. Install Docker Desktop"
    except Exception as e:
        return False, f"Docker check error: {str(e)}"


async def check_redis() -> Tuple[bool, str]:
    """Check if Redis is accessible"""
    try:
        import redis as redis_client

        r = redis_client.Redis(host='localhost', port=6379, decode_responses=True)
        r.ping()
        return True, "Redis connection successful"
    except Exception as e:
        return False, f"Redis connection failed: {str(e)}"


async def test_crud_operations() -> Tuple[bool, str]:
    """Test basic CRUD operations"""
    try:
        from database import get_db_context
        from database.repositories import ProjectRepository
        import uuid

        async with get_db_context() as db:
            repo = ProjectRepository(db)

            # Create
            project = await repo.create({
                "user_id": uuid.uuid4(),
                "name": "Validation Test Project",
                "description": "Auto-created by validation script"
            })

            # Read
            fetched = await repo.get_by_id(project.id)
            if not fetched:
                return False, "Failed to fetch created project"

            # Update
            updated = await repo.update(project.id, {"description": "Updated"})
            if updated.description != "Updated":
                return False, "Failed to update project"

            # Delete
            deleted = await repo.delete(project.id)
            if not deleted:
                return False, "Failed to delete project"

            return True, "CRUD operations working correctly"
    except Exception as e:
        return False, f"CRUD test error: {str(e)}"


async def main():
    """Run all validation checks"""
    print(f"{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}🔍 UltraThink Drugs - Database Setup Validation{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}\n")

    # Define all checks
    checks = [
        ("Python Modules", "Check if all dependencies are installed", check_imports),
        ("Environment File", "Check if .env is configured", check_env_file),
        ("Docker Services", "Check if PostgreSQL is running", check_docker_services),
        ("Database Connection", "Test database connectivity", check_database_connection),
        ("Database Models", "Check if ORM models load", check_database_models),
        ("Repositories", "Check if repositories load", check_repositories),
        ("Alembic Setup", "Check if migrations are configured", check_alembic),
        ("Database Tables", "Check if tables exist", check_database_tables),
        ("Redis Connection", "Test Redis connectivity", check_redis),
        ("CRUD Operations", "Test database operations", test_crud_operations),
    ]

    results = []
    passed_count = 0

    for name, description, check_func in checks:
        print(f"📋 {name}: {description}...", end=' ')

        try:
            passed, message = await check_func()
            results.append((name, passed, message))

            if passed:
                print(f"{GREEN}✓{RESET} {message}")
                passed_count += 1
            else:
                print(f"{RED}✗{RESET} {message}")
        except Exception as e:
            print(f"{RED}✗{RESET} Unexpected error: {str(e)}")
            results.append((name, False, f"Unexpected error: {str(e)}"))

    # Print summary
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}📊 Validation Summary{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}\n")

    total = len(checks)
    percentage = (passed_count / total) * 100

    if passed_count == total:
        print(f"{GREEN}✅ All checks passed! ({passed_count}/{total}){RESET}")
        print(f"\n{GREEN}🎉 Your database setup is complete and working correctly!{RESET}\n")
        print("Next steps:")
        print("  1. Start application: uvicorn main:app --reload --port 7001")
        print("  2. Visit: http://localhost:7001/health")
        print("  3. Run tests: pytest tests/test_database.py -v")
        return 0
    else:
        failed_count = total - passed_count
        print(f"{YELLOW}⚠️  {passed_count}/{total} checks passed ({percentage:.0f}%){RESET}")
        print(f"{RED}❌ {failed_count} check(s) failed{RESET}\n")

        print("Failed checks:")
        for name, passed, message in results:
            if not passed:
                print(f"  {RED}✗{RESET} {name}: {message}")

        print(f"\n{YELLOW}Please fix the issues above and run validation again.{RESET}")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
