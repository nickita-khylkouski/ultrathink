# 🔗 Secure Database Integration Guide

**Complete guide to integrating the secure database layer into your application**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Integration](#step-by-step-integration)
4. [Testing the Integration](#testing-the-integration)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

**For the impatient - minimum steps to get secure database working:**

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set environment variable
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# 3. Add to main.py
from database_routes_secure import router as secure_db_router
app.include_router(secure_db_router, prefix="/api/v1/db", tags=["database"])

# 4. Start the app
uvicorn main:app --reload --port 7001
```

---

## ✅ Prerequisites

### 1. Dependencies Installed

```bash
pip install -r requirements.txt
```

**Verify critical packages:**
```bash
python -c "import jwt; import passlib; import slowapi; print('✅ All dependencies installed')"
```

### 2. Environment Variables Set

**Required variables in `.env`:**
```bash
# Generate a strong secret key
SECRET_KEY=your-secret-key-here-min-32-chars

# Optional (has defaults)
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Generate SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Copy output to .env
```

### 3. Database Running

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify connection
python validate_setup.py
```

---

## 📝 Step-by-Step Integration

### Step 1: Update main.py - Import Secure Routes

**Add at the top of main.py:**

```python
# Secure database routes (Round 4 implementation)
from database_routes_secure import router as secure_db_router
from database.rate_limiting import limiter, add_rate_limiting
```

### Step 2: Configure Rate Limiting

**Add after `app = FastAPI()` in main.py:**

```python
# Configure rate limiting
app.state.limiter = limiter
add_rate_limiting(app)
```

### Step 3: Include Secure Router

**Add with other routers in main.py:**

```python
# Include secure database routes
app.include_router(
    secure_db_router,
    prefix="/api/v1/db",
    tags=["database-secure"]
)
```

### Step 4: Remove Insecure Routes (if present)

**Remove or comment out:**
```python
# ❌ Remove this if present
# from database_routes_example import router as db_router
# app.include_router(db_router, ...)  # INSECURE!
```

---

## 📦 Complete main.py Integration Example

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Import secure database routes
from database_routes_secure import router as secure_db_router
from database.rate_limiting import limiter, add_rate_limiting

# Create FastAPI app
app = FastAPI(
    title="UltraThink Drugs API",
    description="Drug discovery platform with secure database access",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiting
app.state.limiter = limiter
add_rate_limiting(app)

# Include secure database routes
app.include_router(
    secure_db_router,
    prefix="/api/v1/db",
    tags=["database-secure"]
)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "security": "enabled"}

# Start with: uvicorn main:app --reload --port 7001
```

---

## 🧪 Testing the Integration

### Test 1: Application Starts

```bash
uvicorn main:app --reload --port 7001

# Expected output:
# INFO:     Started server process [12345]
# INFO:     Uvicorn running on http://127.0.0.1:7001
# ✅ No errors about SECRET_KEY or missing imports
```

### Test 2: Health Check

```bash
curl http://localhost:7001/health

# Expected: {"status": "healthy", "security": "enabled"}
```

### Test 3: API Documentation

```bash
# Open in browser:
http://localhost:7001/docs

# Should see:
# - /api/v1/db/auth/login (POST)
# - /api/v1/db/projects (GET, POST)
# - /api/v1/db/molecules (GET, POST)
# - All with 🔒 lock icon (authentication required)
```

### Test 4: Register a User

```bash
curl -X POST http://localhost:7001/api/v1/db/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "SecurePassword123!",
    "full_name": "Test User"
  }'

# Expected: User created with hashed password
```

### Test 5: Login and Get JWT Token

```bash
curl -X POST http://localhost:7001/api/v1/db/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Expected response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "123e4567-...",
    "email": "test@example.com",
    "username": "testuser"
  }
}

# ✅ Note: No "hashed_password" in response (secure!)
```

### Test 6: Use JWT Token for Authenticated Request

```bash
# Save token from Test 5
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

# Create a project (requires authentication)
curl -X POST http://localhost:7001/api/v1/db/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Drug Discovery Project",
    "description": "Testing secure auth",
    "disease_target": "Alzheimer'\''s"
  }'

# Expected: Project created and associated with authenticated user
```

### Test 7: Authorization Check

```bash
# Try to access without token
curl http://localhost:7001/api/v1/db/projects

# Expected: 403 Forbidden or 401 Unauthorized
```

### Test 8: Rate Limiting

```bash
# Try login 10 times in quick succession
for i in {1..10}; do
  curl -X POST http://localhost:7001/api/v1/db/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}';
done

# Expected: First 5 succeed (with 401), then 429 Too Many Requests
```

---

## 🐛 Troubleshooting

### Error: "SECRET_KEY environment variable is required"

**Problem:** SECRET_KEY not set in environment

**Solution:**
```bash
# Option 1: Set in .env file
echo 'SECRET_KEY=your-secret-key-here' >> .env

# Option 2: Set in shell
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Option 3: Set in systemd/supervisor config
Environment="SECRET_KEY=your-secret-key-here"
```

---

### Error: "ModuleNotFoundError: No module named 'jwt'"

**Problem:** PyJWT not installed

**Solution:**
```bash
pip install PyJWT>=2.8.0
# Or
pip install -r requirements.txt
```

---

### Error: "ModuleNotFoundError: No module named 'passlib'"

**Problem:** passlib not installed

**Solution:**
```bash
pip install passlib[bcrypt]>=1.7.4
# Or
pip install -r requirements.txt
```

---

### Error: "Could not validate credentials"

**Problem:** JWT token is invalid or expired

**Solution:**
1. Login again to get a new token
2. Check token hasn't expired (default: 30 minutes)
3. Verify SECRET_KEY hasn't changed

```bash
# Re-login
curl -X POST http://localhost:7001/api/v1/db/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

---

### Error: "Invalid email or password" (but password is correct)

**Problem:** Password hash in database doesn't match the hashing algorithm

**Solution:**
1. Delete old user data created without proper hashing
2. Create new user with current implementation

```bash
# Drop and recreate database (⚠️ deletes all data!)
docker-compose down -v
docker-compose up -d
alembic upgrade head

# Register new user
curl -X POST http://localhost:7001/api/v1/db/auth/register ...
```

---

### Error: Redis connection failed

**Problem:** Redis not running or wrong URL

**Solution:**
```bash
# Check if Redis is running
docker-compose ps redis

# If not, start it
docker-compose up -d redis

# Verify connection
redis-cli ping
# Expected: PONG

# Check REDIS_URL in .env
cat .env | grep REDIS_URL
# Should be: REDIS_URL=redis://localhost:6379/0
```

---

### Rate limiting not working

**Problem:** Rate limiter not properly configured

**Solution:**
```python
# Verify in main.py:
app.state.limiter = limiter  # ✅ Must be set
add_rate_limiting(app)       # ✅ Must be called

# Check Redis is running (rate limiter uses Redis)
docker-compose ps redis
```

---

## 📊 Integration Verification Checklist

Before deploying, verify:

- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] SECRET_KEY set in environment (not hardcoded!)
- [ ] Application starts without errors
- [ ] `/docs` shows secure endpoints with 🔒 lock icons
- [ ] Can register new user
- [ ] Can login and receive JWT token
- [ ] JWT token required for protected endpoints
- [ ] Unauthorized requests return 401/403
- [ ] Rate limiting works (429 after limit exceeded)
- [ ] No `hashed_password` in API responses
- [ ] Redis connection healthy
- [ ] Database connection healthy

---

## 🎯 Next Steps

After successful integration:

1. **Write Tests:** Create tests/test_security_integration.py
2. **Configure Monitoring:** Set up logging for authentication events
3. **Deploy to Staging:** Test in staging environment
4. **Security Audit:** Have security team review
5. **Production Deployment:** Follow PRODUCTION_CHECKLIST.md

---

## 📚 Additional Resources

- **Security Implementation:** SECURITY_FIXES_IMPLEMENTED.md
- **API Documentation:** http://localhost:7001/docs
- **Rate Limiting Details:** database/rate_limiting.py
- **Security Utilities:** database/security.py

---

**Integration Status:** ✅ Ready for production after testing

**Last Updated:** January 10, 2026
