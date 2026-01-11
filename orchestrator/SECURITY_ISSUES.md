# 🔒 CRITICAL Security Issues Found

**Date:** January 10, 2026
**Severity:** 🔴 CRITICAL - Multiple security vulnerabilities
**Status:** ⚠️ DOCUMENTED - Requires immediate attention for production use

---

## ⚠️ PRODUCTION WARNING

**DO NOT deploy this code to production without fixing these security issues!**

The current implementation has **9 critical security flaws** that could lead to:
- ❌ Unauthorized data access
- ❌ Data manipulation by unauthorized users
- ❌ Account takeover
- ❌ Information disclosure
- ❌ Denial of service

---

## 🚨 Critical Security Flaws

### Flaw #1: Mass Assignment Vulnerability 🔴 CRITICAL

**Location:** `database/repositories/user_repository.py` lines 93-95

**Vulnerable Code:**
```python
async def update(self, user_id: uuid.UUID, updates: Dict[str, Any]):
    user = await self.get_by_id(user_id)
    for key, value in updates.items():
        if hasattr(user, key):
            setattr(user, key, value)  # ❌ DANGEROUS!
```

**Exploit:**
```python
# Attacker can update ANY field, including:
await user_repo.update(victim_user_id, {
    "hashed_password": attacker_password_hash,  # Account takeover!
    "is_active": False,  # Lock out user!
    "tier": "enterprise",  # Escalate privileges!
    "email": "attacker@evil.com"  # Steal account!
})
```

**Impact:**
- 🔴 Account takeover
- 🔴 Privilege escalation (free → enterprise)
- 🔴 Denial of service (deactivate accounts)

**Fix:**
```python
# Use whitelist of allowed fields
UPDATEABLE_FIELDS = {'full_name', 'institution'}  # Only safe fields

async def update(self, user_id: uuid.UUID, updates: Dict[str, Any]):
    # Check for disallowed fields
    disallowed = set(updates.keys()) - UPDATEABLE_FIELDS
    if disallowed:
        raise HTTPException(403, f"Cannot update: {disallowed}")

    user = await self.get_by_id(user_id)
    for key, value in updates.items():
        setattr(user, key, value)  # ✅ Now safe
```

**See:** `database/security_fixes.py` for secure implementation

---

### Flaw #2: No Authorization Checks 🔴 CRITICAL

**Location:** All routes in `database_routes_example.py`

**Vulnerable Code:**
```python
@router.get("/projects/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    project = await repo.get_by_id(uuid.UUID(project_id))
    return project  # ❌ No check if user owns this project!
```

**Exploit:**
```bash
# Attacker can access ANY project by guessing/enumerating UUIDs
curl http://api.com/projects/victim-project-uuid
# Returns victim's confidential drug research!
```

**Impact:**
- 🔴 Information disclosure
- 🔴 Access to all users' data
- 🔴 Competitive intelligence theft

**Fix:**
```python
def get_current_user_id() -> uuid.UUID:
    """Extract from JWT token"""
    pass

@router.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    project = await repo.get_by_id(uuid.UUID(project_id))

    # ✅ CRITICAL: Check authorization
    if project.user_id != current_user_id:
        raise HTTPException(403, "Access denied")

    return project
```

**Affected Endpoints:**
- ❌ GET `/projects/{id}` - No ownership check
- ❌ GET `/projects/{id}/molecules` - No ownership check
- ❌ GET `/molecules/{id}` - No ownership check
- ❌ POST `/molecules` - Uses hardcoded user ID!

---

### Flaw #3: Hardcoded User IDs 🔴 CRITICAL

**Location:** `database_routes_example.py` lines 74, 109, 210, 345

**Vulnerable Code:**
```python
async def create_project(
    project: ProjectCreate,
    user_id: str = "00000000-0000-0000-0000-000000000001",  # ❌ HARDCODED!
    db: AsyncSession = Depends(get_db)
):
```

**Impact:**
- 🔴 All projects created by same fake user
- 🔴 No real user association
- 🔴 Authentication completely bypassed

**Fix:**
```python
async def create_project(
    project: ProjectCreate,
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],  # ✅ From JWT
    db: AsyncSession = Depends(get_db)
):
    project_data = {
        "user_id": current_user_id,  # ✅ Real authenticated user
        **project.model_dump()
    }
```

---

### Flaw #4: No Input Validation 🔴 HIGH

**Location:** All repository create methods

**Vulnerable Code:**
```python
async def create(self, project_data: Dict[str, Any]):
    project = Project(**project_data)  # ❌ No validation!
    self.session.add(project)
    await self.session.commit()
```

**Exploits:**
```python
# XSS in project name
await repo.create({
    "name": "<script>alert('XSS')</script>",  # Stored XSS!
    "user_id": uuid.uuid4()
})

# SQL injection attempts (caught by SQLAlchemy, but still bad practice)
await repo.create({
    "name": "'; DROP TABLE projects; --",
    "user_id": uuid.uuid4()
})

# Invalid tier value
await repo.create({
    "tier": "super_ultra_mega_tier",  # No validation!
})
```

**Impact:**
- 🔴 Stored XSS attacks
- 🟡 Invalid data in database
- 🟡 Business logic bypass

**Fix:**
```python
def validate_project_name(name: str):
    if not name or len(name) > 255:
        raise HTTPException(400, "Invalid name length")

    dangerous = ['<', '>', '"', "'", '&']
    if any(c in name for c in dangerous):
        raise HTTPException(400, "Name contains invalid characters")

async def create(self, project_data: Dict[str, Any]):
    validate_project_name(project_data['name'])  # ✅ Validate first
    project = Project(**project_data)
    self.session.add(project)
    await self.session.commit()
```

---

### Flaw #5: No Unique Constraint Handling 🔴 HIGH

**Location:** `user_repository.py` create method

**Vulnerable Code:**
```python
async def create(self, user_data: Dict[str, Any]) -> User:
    user = User(**user_data)
    self.session.add(user)
    await self.session.commit()  # ❌ Will crash on duplicate email!
```

**Impact:**
- 🔴 Application crashes (500 error)
- 🔴 Stack traces leak database structure
- 🟡 Poor user experience

**Crash Example:**
```
sqlalchemy.exc.IntegrityError: (psycopg2.errors.UniqueViolation)
duplicate key value violates unique constraint "users_email_key"
DETAIL:  Key (email)=(user@example.com) already exists.
```

**Fix:**
```python
from sqlalchemy.exc import IntegrityError

async def create(self, user_data: Dict[str, Any]) -> User:
    user = User(**user_data)
    self.session.add(user)

    try:
        await self.session.commit()
    except IntegrityError as e:
        await self.session.rollback()

        # Don't leak exact error
        if 'email' in str(e.orig):
            raise HTTPException(409, "Email already registered")
        elif 'username' in str(e.orig):
            raise HTTPException(409, "Username already taken")
        else:
            raise HTTPException(500, "Failed to create user")
```

---

### Flaw #6: Password Hash Exposure 🔴 HIGH

**Location:** All endpoints returning User objects

**Vulnerable Code:**
```python
@app.get("/users/{user_id}")
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await repo.get_by_id(uuid.UUID(user_id))
    return user  # ❌ Returns hashed_password!
```

**Response:**
```json
{
  "id": "...",
  "email": "user@example.com",
  "hashed_password": "$2b$12$KIX...",  # ❌ EXPOSED!
  "tier": "free"
}
```

**Impact:**
- 🔴 Password hashes can be cracked offline
- 🔴 Information disclosure
- 🔴 GDPR/privacy violation

**Fix:**
```python
class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    tier: str
    # Note: hashed_password is NOT included

@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    user = await repo.get_by_id(uuid.UUID(user_id))
    return UserResponse.from_orm(user)  # ✅ Excludes password
```

---

### Flaw #7: No Tier Validation 🟡 MEDIUM

**Location:** `user_repository.py` upgrade_tier

**Vulnerable Code:**
```python
async def upgrade_tier(self, user_id: uuid.UUID, new_tier: str):
    return await self.update(user_id, {"tier": new_tier})  # ❌ No validation!
```

**Exploit:**
```python
# Set invalid tier
await repo.upgrade_tier(user_id, "ultra_mega_premium_plus")
# Or SQL injection attempt
await repo.upgrade_tier(user_id, "'; DROP TABLE users; --")
```

**Fix:**
```python
VALID_TIERS = {'free', 'pro', 'enterprise'}

async def upgrade_tier(self, user_id: uuid.UUID, new_tier: str):
    if new_tier not in VALID_TIERS:
        raise HTTPException(400, f"Invalid tier. Must be: {VALID_TIERS}")

    return await self.update(user_id, {"tier": new_tier})  # ✅ Validated
```

---

### Flaw #8: No Rate Limiting 🟡 MEDIUM

**Location:** All endpoints

**Impact:**
- 🔴 Brute force attacks on authentication
- 🔴 Denial of service (resource exhaustion)
- 🟡 API abuse

**Example Attack:**
```python
# Brute force user enumeration
for i in range(1000000):
    response = requests.get(f"/users/{i}")
    if response.status_code == 200:
        print(f"Found user: {i}")
```

**Fix:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/auth/login")
@limiter.limit("5/minute")  # ✅ Only 5 login attempts per minute
async def login(credentials: LoginRequest):
    pass
```

---

### Flaw #9: Information Leakage in Errors 🟡 MEDIUM

**Location:** Error handling throughout

**Vulnerable Code:**
```python
except Exception as e:
    raise HTTPException(500, detail=str(e))  # ❌ Leaks internals!
```

**Leaked Information:**
```json
{
  "detail": "relation 'molecules' does not exist\nLINE 1: SELECT * FROM molecules WHERE..."
}
```

**Impact:**
- 🟡 Reveals database schema
- 🟡 Reveals table/column names
- 🟡 Aids further attacks

**Fix:**
```python
except IntegrityError:
    # Generic message, log details internally
    logger.error(f"Database integrity error: {e}")
    raise HTTPException(409, "Operation failed due to constraint violation")

except Exception:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(500, "An unexpected error occurred")
```

---

## 📋 Security Checklist

Before deploying to production:

### Authentication & Authorization
- [ ] Implement JWT authentication
- [ ] Add `get_current_user_id()` dependency
- [ ] Add authorization checks to ALL endpoints
- [ ] Verify project/molecule ownership before access
- [ ] Use role-based access control (RBAC)

### Input Validation
- [ ] Validate all user inputs
- [ ] Sanitize inputs to prevent XSS
- [ ] Validate SMILES strings with RDKit
- [ ] Validate tier values against whitelist
- [ ] Validate email format
- [ ] Validate username (alphanumeric only)

### Data Protection
- [ ] Never return `hashed_password` in responses
- [ ] Use Pydantic response models
- [ ] Implement field-level access control
- [ ] Use whitelist for updateable fields
- [ ] Hash all passwords with bcrypt

### Error Handling
- [ ] Handle `IntegrityError` for unique constraints
- [ ] Generic error messages to users
- [ ] Detailed logging for developers
- [ ] No stack traces in production
- [ ] Use custom exception handlers

### Rate Limiting
- [ ] Add rate limiting to authentication endpoints
- [ ] Add rate limiting to expensive operations
- [ ] Different limits for free/pro/enterprise tiers
- [ ] Use Redis for distributed rate limiting

### Database Security
- [ ] Use prepared statements (SQLAlchemy does this)
- [ ] Enable query parameterization
- [ ] Set restrictive database user permissions
- [ ] Regular database backups
- [ ] Encrypt sensitive data at rest

---

## 🛠️ Fixes Provided

### Secure Implementations

**File:** `database/security_fixes.py`

Contains:
- ✅ `SecureUserRepository` - Proper validation & whitelisting
- ✅ `check_project_ownership()` - Authorization helper
- ✅ `check_molecule_ownership()` - Authorization helper
- ✅ `SecureUserResponse` - Excludes sensitive fields
- ✅ Input validation functions
- ✅ Rate limiting example
- ✅ Proper error handling

### Usage Example

```python
from database.security_fixes import (
    SecureUserRepository,
    check_project_ownership,
    SecureUserResponse
)

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    updates: Dict[str, Any],
    current_user_id: Annotated[uuid.UUID, Depends(get_current_user_id)],
    db: AsyncSession = Depends(get_db)
):
    # Only allow users to update themselves
    if uuid.UUID(user_id) != current_user_id:
        raise HTTPException(403, "Can only update your own profile")

    repo = SecureUserRepository(db)
    user = await repo.update(
        uuid.UUID(user_id),
        updates,
        is_admin=False  # Regular user, can't update tier
    )

    return SecureUserResponse.from_user(user)
```

---

## 🎯 Priority Fixes

### Must Fix Before Production (P0)
1. ✅ Implement authentication (JWT)
2. ✅ Add authorization checks to all endpoints
3. ✅ Fix mass assignment vulnerability
4. ✅ Never return hashed passwords
5. ✅ Handle unique constraint violations

### Should Fix Before Production (P1)
6. ✅ Add input validation
7. ✅ Implement rate limiting
8. ✅ Validate tier values
9. ✅ Sanitize error messages

### Nice to Have (P2)
- Add CORS properly
- Implement audit logging
- Add API versioning
- Add request signing
- Implement 2FA

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [SQLAlchemy Security](https://docs.sqlalchemy.org/en/20/faq/security.html)

---

## ⚠️ Disclaimer

**The current codebase is a prototype/development version.**

It demonstrates database patterns and architecture but **MUST NOT** be used in production without implementing the security fixes documented here.

---

**Status:** 🔴 **NOT PRODUCTION READY** - Security fixes required

**Next Steps:**
1. Review this document
2. Implement fixes from `security_fixes.py`
3. Add authentication system
4. Test all security controls
5. Security audit before production deployment
