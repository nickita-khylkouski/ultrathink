#!/bin/bash
# Docker Setup Validation Script
# This script validates the Docker configuration without building images

set -e

echo "🐳 ULTRATHINK Docker Setup Validation"
echo "======================================"
echo ""

# Check Docker
echo "✓ Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
docker --version
echo ""

# Check Docker Compose
echo "✓ Checking Docker Compose installation..."
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
fi
docker compose version
echo ""

# Validate docker-compose.yml
echo "✓ Validating docker-compose.yml syntax..."
if docker compose config > /dev/null 2>&1; then
    echo "✓ docker-compose.yml is valid"
else
    echo "❌ docker-compose.yml has syntax errors"
    docker compose config
    exit 1
fi
echo ""

# Check Dockerfiles exist
echo "✓ Checking Dockerfiles..."
files=(
    "orchestrator/Dockerfile"
    "frontend/Dockerfile"
    "web/Dockerfile"
    ".dockerignore"
    ".env.docker.example"
    "orchestrator/.env.example"
)

for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        exit 1
    fi
    echo "  ✓ Found: $file"
done
echo ""

# Check .env setup
echo "✓ Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "⚠️  WARNING: .env not found in root directory"
    echo "   Run: cp .env.docker.example .env"
    echo "   Then configure POSTGRES_PASSWORD and SECRET_KEY"
else
    echo "  ✓ .env exists (for docker-compose)"
fi

if [ ! -f "orchestrator/.env" ]; then
    echo "⚠️  WARNING: orchestrator/.env not found"
    echo "   Run: cp orchestrator/.env.example orchestrator/.env"
    echo "   Then configure SECRET_KEY and ALLOWED_ORIGINS"
else
    echo "  ✓ orchestrator/.env exists (for backend)"
fi
echo ""

# Summary
echo "======================================"
echo "✅ Docker setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Configure .env: cp .env.docker.example .env"
echo "2. Configure orchestrator/.env: cp orchestrator/.env.example orchestrator/.env"
echo "3. Generate secrets and update both .env files"
echo "4. Run: docker compose up -d"
echo "5. Access: http://localhost:3000 (frontend)"
echo "6. Access: http://localhost:7001 (backend)"
echo ""
echo "See DOCKER.md for complete documentation."
