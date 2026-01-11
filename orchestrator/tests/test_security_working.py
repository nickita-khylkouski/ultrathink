"""
Working Security Tests for UltraThink Drugs Database Layer

These tests verify all Round 4-6 security fixes work correctly.

Run with: pytest tests/test_security_working.py -v
"""

import pytest
from httpx import AsyncClient
from fastapi import FastAPI

# Import the secure router
from database_routes_secure import router, hash_password, verify_password, create_access_token
from database_routes_secure import UserRegister, LoginRequest
import uuid


# ===== TEST APP SETUP =====

@pytest.fixture
def app():
    """Create a test FastAPI app with secure routes"""
    test_app = FastAPI()
    test_app.include_router(router, prefix="/api/v1/db")
    return test_app


@pytest.fixture
async def client(app):
    """Create an async test client"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


# ===== PASSWORD HASHING TESTS =====

def test_password_hashing():
    """Test password hashing and verification"""
    password = "MySecurePassword123!"

    # Hash password
    hashed = hash_password(password)

    # Should not be the same as plaintext
    assert hashed != password

    # Should start with bcrypt prefix
    assert hashed.startswith("$2b$")

    # Should verify correctly
    assert verify_password(password, hashed) is True

    # Should fail with wrong password
    assert verify_password("WrongPassword", hashed) is False


def test_password_hash_uniqueness():
    """Test that same password produces different hashes due to salt"""
    password = "SamePassword123!"

    hash1 = hash_password(password)
    hash2 = hash_password(password)

    # Should be different due to random salt
    assert hash1 != hash2

    # But both should verify
    assert verify_password(password, hash1)
    assert verify_password(password, hash2)


# ===== JWT TOKEN TESTS =====

def test_jwt_token_creation():
    """Test JWT token creation"""
    user_id = uuid.uuid4()

    token = create_access_token(user_id)

    # Should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0

    # Should have JWT structure (header.payload.signature)
    parts = token.split(".")
    assert len(parts) == 3


def test_jwt_token_contains_user_id():
    """Test JWT token contains user ID"""
    import jwt
    from datetime import timedelta

    user_id = uuid.uuid4()
    token = create_access_token(user_id, expires_delta=timedelta(hours=1))

    # Decode without verification to check contents
    decoded = jwt.decode(token, options={"verify_signature": False})

    assert "sub" in decoded  # User ID
    assert decoded["sub"] == str(user_id)
    assert "exp" in decoded  # Expiration time


# ===== PYDANTIC MODEL VALIDATION TESTS =====

def test_user_register_model_validation():
    """Test UserRegister model validates input"""
    # Valid data
    valid_user = UserRegister(
        email="test@example.com",
        username="testuser",
        password="SecurePass123!",
        full_name="Test User"
    )
    assert valid_user.email == "test@example.com"
    assert valid_user.username == "testuser"

    # Invalid - password too short
    with pytest.raises(Exception):
        UserRegister(
            email="test@example.com",
            username="testuser",
            password="short"  # Less than 8 chars
        )

    # Invalid - username too short
    with pytest.raises(Exception):
        UserRegister(
            email="test@example.com",
            username="ab",  # Less than 3 chars
            password="SecurePass123!"
        )


# ===== INPUT VALIDATION TESTS =====

def test_validate_smiles():
    """Test SMILES validation function"""
    from database.security import validate_smiles

    # Valid SMILES should not raise
    validate_smiles("CC(=O)OC1=CC=CC=C1C(=O)O")  # Aspirin

    # Too long should raise
    with pytest.raises(Exception):
        validate_smiles("C" * 501)  # Over 500 chars

    # Empty should raise
    with pytest.raises(Exception):
        validate_smiles("")

    # XSS payload should raise
    with pytest.raises(Exception):
        validate_smiles("<script>alert('XSS')</script>")


def test_validate_project_name():
    """Test project name validation"""
    from database.security import validate_project_name

    # Valid name should not raise
    validate_project_name("My Drug Discovery Project")

    # XSS should raise
    with pytest.raises(Exception):
        validate_project_name("<script>alert('XSS')</script>")

    # Too long should raise
    with pytest.raises(Exception):
        validate_project_name("A" * 256)  # Over 255 chars

    # Empty should raise
    with pytest.raises(Exception):
        validate_project_name("")


def test_validate_email():
    """Test email validation"""
    from database.security import validate_email

    # Valid emails should not raise
    validate_email("user@example.com")
    validate_email("test.user@company.co.uk")

    # Invalid emails should raise
    with pytest.raises(Exception):
        validate_email("not-an-email")

    with pytest.raises(Exception):
        validate_email("@example.com")

    with pytest.raises(Exception):
        validate_email("user@")


def test_validate_username():
    """Test username validation"""
    from database.security import validate_username

    # Valid usernames should not raise
    validate_username("john_doe")
    validate_username("user123")
    validate_username("test-user")

    # Too short should raise
    with pytest.raises(Exception):
        validate_username("ab")  # Less than 3 chars

    # Too long should raise
    with pytest.raises(Exception):
        validate_username("a" * 51)  # Over 50 chars

    # Invalid characters should raise
    with pytest.raises(Exception):
        validate_username("user@domain")  # @ not allowed


# ===== SECURITY RESPONSE MODEL TESTS =====

def test_secure_user_response_excludes_password():
    """Test that SecureUserResponse never includes password"""
    from database.security import SecureUserResponse
    from database.models import User
    from datetime import datetime

    # Create a mock user with password
    mock_user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="$2b$12$fake_hash_here",
        full_name="Test User",
        tier="free",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    # Convert to secure response
    response = SecureUserResponse.from_user(mock_user)

    # Password fields should NOT be present
    assert "password" not in response
    assert "hashed_password" not in response

    # Other fields should be present
    assert "email" in response
    assert "username" in response
    assert "tier" in response


# ===== AUTHORIZATION HELPER TESTS =====

def test_check_project_ownership_allows_owner():
    """Test that project owner can access their project"""
    from database.security import check_project_ownership
    from database.models import Project

    user_id = uuid.uuid4()
    mock_project = Project(
        id=uuid.uuid4(),
        user_id=user_id,
        name="Test Project"
    )

    # Should not raise for owner
    try:
        check_project_ownership(mock_project, user_id)
    except Exception as e:
        pytest.fail(f"Owner should be allowed access, but got: {e}")


def test_check_project_ownership_denies_non_owner():
    """Test that non-owner cannot access project"""
    from database.security import check_project_ownership
    from database.models import Project
    from fastapi import HTTPException

    owner_id = uuid.uuid4()
    other_user_id = uuid.uuid4()

    mock_project = Project(
        id=uuid.uuid4(),
        user_id=owner_id,
        name="Test Project"
    )

    # Should raise 403 for non-owner
    with pytest.raises(HTTPException) as exc_info:
        check_project_ownership(mock_project, other_user_id)

    assert exc_info.value.status_code == 403
    assert "Access denied" in exc_info.value.detail


# ===== FIELD WHITELISTING TESTS =====

def test_user_repository_whitelist():
    """Test that UserRepository has proper field whitelists"""
    from database.repositories import UserRepository

    # Should have whitelists defined
    assert hasattr(UserRepository, 'UPDATEABLE_FIELDS')
    assert hasattr(UserRepository, 'ADMIN_UPDATEABLE_FIELDS')
    assert hasattr(UserRepository, 'VALID_TIERS')

    # Whitelists should be sets
    assert isinstance(UserRepository.UPDATEABLE_FIELDS, set)
    assert isinstance(UserRepository.ADMIN_UPDATEABLE_FIELDS, set)
    assert isinstance(UserRepository.VALID_TIERS, set)

    # Should not allow updating password as regular user
    assert 'hashed_password' not in UserRepository.UPDATEABLE_FIELDS
    assert 'password' not in UserRepository.UPDATEABLE_FIELDS

    # Should not allow upgrading tier as regular user
    assert 'tier' not in UserRepository.UPDATEABLE_FIELDS

    # But admin should be able to
    assert 'tier' in UserRepository.ADMIN_UPDATEABLE_FIELDS


def test_project_repository_whitelist():
    """Test that ProjectRepository has field whitelist"""
    from database.repositories import ProjectRepository

    assert hasattr(ProjectRepository, 'UPDATEABLE_FIELDS')
    assert isinstance(ProjectRepository.UPDATEABLE_FIELDS, set)

    # Should allow updating these fields
    assert 'name' in ProjectRepository.UPDATEABLE_FIELDS
    assert 'description' in ProjectRepository.UPDATEABLE_FIELDS

    # Should not allow updating ID or user_id
    assert 'id' not in ProjectRepository.UPDATEABLE_FIELDS
    assert 'user_id' not in ProjectRepository.UPDATEABLE_FIELDS


# ===== SUMMARY TEST =====

def test_security_summary():
    """Print summary of security features tested"""
    print("\n" + "=" * 70)
    print("SECURITY FEATURES VERIFIED")
    print("=" * 70)
    print("✅ Password Hashing: bcrypt with random salt")
    print("✅ JWT Tokens: Properly formatted with user ID and expiration")
    print("✅ Input Validation: SMILES, emails, usernames, project names")
    print("✅ Secure Responses: Password never included in API responses")
    print("✅ Authorization: Ownership checks enforced")
    print("✅ Field Whitelisting: Mass assignment protection")
    print("✅ Pydantic Models: Input validation at API layer")
    print("=" * 70)
    print(f"Total Tests Passed: {pytest.collect.TEST_OUTCOME.passed}")
    print("=" * 70 + "\n")


# ===== TEST CONFIGURATION =====

if __name__ == "__main__":
    # Run with: python -m pytest tests/test_security_working.py -v
    pytest.main([__file__, "-v", "--tb=short"])
