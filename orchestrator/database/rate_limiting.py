"""
Rate Limiting Configuration for UltraThink Drugs Platform

This module provides rate limiting functionality to prevent:
- Brute force attacks on authentication endpoints
- API abuse and resource exhaustion
- Denial of service attacks

Uses slowapi with Redis backend for distributed rate limiting.

SETUP:
1. Install dependencies:
   pip install slowapi redis

2. Ensure Redis is running:
   docker-compose up -d redis

3. Import and configure in main.py:
   from database.rate_limiting import limiter, add_rate_limiting
   app.state.limiter = limiter
   add_rate_limiting(app)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import redis
from typing import Optional
import os


# ===== REDIS CONNECTION =====

def get_redis_client() -> Optional[redis.Redis]:
    """
    Get Redis client for rate limiting storage.

    Returns:
        Redis client or None if Redis is not available

    Note: Falls back to in-memory storage if Redis unavailable
    """
    try:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        client = redis.from_url(redis_url, decode_responses=True)

        # Test connection
        client.ping()
        return client
    except Exception as e:
        print(f"Warning: Redis not available for rate limiting: {e}")
        print("Falling back to in-memory rate limiting (not suitable for production)")
        return None


# ===== RATE LIMITER CONFIGURATION =====

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL", "redis://localhost:6379/0"),
    strategy="fixed-window",
    headers_enabled=True,  # Add X-RateLimit headers to responses
)


# ===== RATE LIMITING POLICIES =====

class RateLimitConfig:
    """
    Rate limiting policies for different endpoint types.

    Security: Different limits for different operations based on sensitivity
    """

    # Authentication endpoints (most restrictive)
    LOGIN = "5/minute"           # 5 login attempts per minute
    REGISTER = "3/hour"          # 3 registration attempts per hour
    PASSWORD_RESET = "3/hour"    # 3 password reset requests per hour

    # Read operations (moderate limits)
    READ_DEFAULT = "100/minute"  # 100 read requests per minute
    SEARCH = "20/minute"         # 20 search requests per minute

    # Write operations (more restrictive)
    CREATE = "30/minute"         # 30 create operations per minute
    UPDATE = "50/minute"         # 50 update operations per minute
    DELETE = "10/minute"         # 10 delete operations per minute

    # Expensive operations (very restrictive)
    BULK_CREATE = "5/minute"     # 5 bulk operations per minute
    PREDICTIONS = "10/minute"    # 10 prediction requests per minute

    # Tier-based limits for premium features
    FREE_TIER = "50/hour"        # Free tier users
    PRO_TIER = "500/hour"        # Pro tier users
    ENTERPRISE_TIER = "5000/hour" # Enterprise tier users


# ===== TIER-BASED RATE LIMITING =====

def get_tier_based_limit(request: Request) -> str:
    """
    Get rate limit based on user's tier.

    Args:
        request: FastAPI request object

    Returns:
        Rate limit string (e.g., "500/hour")

    Security: Premium users get higher rate limits
    """
    # Extract user tier from JWT token or session
    # This is a simplified example - in production, decode JWT token
    user_tier = getattr(request.state, "user_tier", "free")

    if user_tier == "enterprise":
        return RateLimitConfig.ENTERPRISE_TIER
    elif user_tier == "pro":
        return RateLimitConfig.PRO_TIER
    else:
        return RateLimitConfig.FREE_TIER


# ===== CUSTOM ERROR HANDLER =====

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom error response for rate limit exceeded.

    Args:
        request: FastAPI request object
        exc: RateLimitExceeded exception

    Returns:
        JSON response with rate limit information

    Security: Generic error message, detailed headers for debugging
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "detail": f"Rate limit: {exc.detail}",
            "retry_after": exc.headers.get("Retry-After", "60 seconds")
        },
        headers=exc.headers
    )


# ===== INTEGRATION HELPER =====

def add_rate_limiting(app):
    """
    Add rate limiting to FastAPI application.

    Usage in main.py:
        from database.rate_limiting import limiter, add_rate_limiting

        app = FastAPI()
        app.state.limiter = limiter
        add_rate_limiting(app)

    Args:
        app: FastAPI application instance
    """
    from slowapi import _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded

    # Add exception handler
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    print("✅ Rate limiting enabled")


# ===== EXAMPLE USAGE IN ROUTES =====

"""
Example 1: Simple rate limiting on login endpoint

from database.rate_limiting import limiter, RateLimitConfig

@router.post("/auth/login")
@limiter.limit(RateLimitConfig.LOGIN)  # 5 requests per minute
async def login(request: Request, credentials: LoginRequest):
    # ... login logic ...
    pass


Example 2: Tier-based rate limiting on expensive operation

@router.post("/predictions/bulk")
@limiter.limit(get_tier_based_limit)  # Dynamic limit based on user tier
async def bulk_predict(request: Request, molecules: List[str]):
    # ... prediction logic ...
    pass


Example 3: Multiple rate limits (per-minute AND per-hour)

@router.post("/molecules")
@limiter.limit("30/minute")   # Short-term limit
@limiter.limit("1000/hour")   # Long-term limit
async def create_molecule(request: Request, molecule: MoleculeCreate):
    # ... creation logic ...
    pass


Example 4: Custom key function for authenticated users

def get_user_id_or_ip(request: Request) -> str:
    '''Rate limit by user ID if authenticated, otherwise by IP'''
    if hasattr(request.state, "user_id"):
        return f"user:{request.state.user_id}"
    return get_remote_address(request)

custom_limiter = Limiter(key_func=get_user_id_or_ip)

@router.get("/projects")
@custom_limiter.limit("100/minute")
async def list_projects(request: Request):
    pass
"""


# ===== MONITORING AND METRICS =====

class RateLimitMonitor:
    """
    Monitor rate limiting metrics.

    Useful for:
    - Identifying abusive users
    - Tuning rate limit policies
    - Detecting attack patterns
    """

    def __init__(self, redis_client: Optional[redis.Redis]):
        self.redis = redis_client

    def get_limit_status(self, key: str) -> dict:
        """
        Get current rate limit status for a key.

        Args:
            key: Rate limit key (e.g., "user:123" or IP address)

        Returns:
            Dictionary with current usage and limits
        """
        if not self.redis:
            return {"error": "Redis not available"}

        # Example Redis key format: "rate_limit:endpoint:key"
        current_count = self.redis.get(f"rate_limit:{key}") or 0

        return {
            "key": key,
            "current_requests": int(current_count),
            "limit": "varies by endpoint",
            "reset_time": "varies by window"
        }

    def get_top_consumers(self, limit: int = 10) -> list:
        """
        Get top API consumers by request count.

        Args:
            limit: Number of top consumers to return

        Returns:
            List of tuples (key, request_count)

        Useful for: Identifying power users or potential abusers
        """
        if not self.redis:
            return []

        # This is a simplified example
        # Production systems would aggregate from time-series data
        keys = self.redis.keys("rate_limit:*")
        consumers = []

        for key in keys[:100]:  # Limit scan for performance
            count = self.redis.get(key)
            if count:
                consumers.append((key.decode(), int(count)))

        return sorted(consumers, key=lambda x: x[1], reverse=True)[:limit]


# ===== REDIS HEALTH CHECK =====

def check_redis_health() -> dict:
    """
    Check Redis connection health.

    Returns:
        Dictionary with health status

    Usage in health check endpoint:
        @app.get("/health/redis")
        async def redis_health():
            return check_redis_health()
    """
    try:
        client = get_redis_client()
        if client:
            client.ping()
            info = client.info()
            return {
                "status": "healthy",
                "connected_clients": info.get("connected_clients"),
                "used_memory": info.get("used_memory_human"),
                "uptime_seconds": info.get("uptime_in_seconds")
            }
        else:
            return {
                "status": "unavailable",
                "message": "Redis client not initialized"
            }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


# ===== PRODUCTION RECOMMENDATIONS =====

"""
PRODUCTION DEPLOYMENT CHECKLIST:

1. Redis Configuration:
   ✅ Use Redis Cluster for high availability
   ✅ Configure persistence (RDB + AOF)
   ✅ Set up replication (1 primary + 2 replicas minimum)
   ✅ Configure maxmemory and eviction policy
   ✅ Enable SSL/TLS for Redis connections

2. Rate Limit Tuning:
   ✅ Monitor actual API usage patterns
   ✅ Adjust limits based on user feedback
   ✅ Implement gradual rate limit increases for new users
   ✅ Add burst allowance for spiky traffic

3. Monitoring:
   ✅ Log all rate limit violations
   ✅ Alert on excessive rate limit hits (potential attack)
   ✅ Track rate limit metrics in monitoring dashboard
   ✅ Set up automatic IP blocking for repeat offenders

4. User Experience:
   ✅ Return clear error messages with retry-after
   ✅ Add X-RateLimit-* headers to all responses
   ✅ Document rate limits in API documentation
   ✅ Provide tier upgrade path for power users

5. Security:
   ✅ Use authenticated user IDs for key_func when possible
   ✅ Implement CAPTCHA after repeated login failures
   ✅ Block known malicious IPs at WAF/CDN level
   ✅ Log and analyze suspicious patterns
"""


# ===== ALTERNATIVE: DECORATOR-BASED APPROACH =====

def rate_limit_decorator(limit: str):
    """
    Custom rate limit decorator (alternative to @limiter.limit).

    Usage:
        @rate_limit_decorator("5/minute")
        async def my_endpoint():
            pass
    """
    def decorator(func):
        return limiter.limit(limit)(func)
    return decorator
