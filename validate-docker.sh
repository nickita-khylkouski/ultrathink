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
if [ ! -f "orchestrator/.env" ]; then
    echo "⚠️  WARNING: orchestrator/.env not found"
    echo "   Run: cp orchestrator/.env.example orchestrator/.env"
    echo "   Then configure SECRET_KEY and ALLOWED_ORIGINS"
else
    echo "  ✓ orchestrator/.env exists"
fi
echo ""

# Summary
echo "======================================"
echo "✅ Docker setup validation complete!"
echo ""
echo "Next steps:"
echo "1. Configure orchestrator/.env (if not done)"
echo "2. Run: docker compose up -d"
echo "3. Access: http://localhost:3000 (frontend)"
echo "4. Access: http://localhost:7001 (backend)"
echo ""
echo "See DOCKER.md for complete documentation."
