#!/bin/bash

# 🧬 COMPLETE STARTUP SCRIPT
# Starts: Smart-Chem + BioNeMo + Orchestrator + Web UI

HACKATHON_DIR=~/hackathon

echo "🚀 Starting Complete Drug Discovery Platform..."
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if services are already running
check_port() {
    nc -z localhost $1 2>/dev/null
}

echo -e "\n${YELLOW}[1/4] Starting Smart-Chem (Port 8000)${NC}"
if check_port 8000; then
    echo "⚠️  Port 8000 already in use, skipping..."
else
    cd "$HACKATHON_DIR/Smart-Chem" 2>/dev/null && {
        echo "📦 Installing dependencies..."
        pip install -q -r requirements.txt 2>/dev/null
        echo -e "${GREEN}✅ Starting Smart-Chem...${NC}"
        uvicorn backend.main:app --host 0.0.0.0 --port 8000 > /tmp/smartchem.log 2>&1 &
        sleep 3
    } || echo "❌ Smart-Chem directory not found"
fi

echo -e "\n${YELLOW}[2/4] Starting BioNeMo (Port 5000)${NC}"
if check_port 5000; then
    echo "⚠️  Port 5000 already in use, skipping..."
else
    cd "$HACKATHON_DIR/bionemo" 2>/dev/null && {
        echo "📦 Installing dependencies..."
        pip install -q flask rdkit requests 2>/dev/null
        echo -e "${GREEN}✅ Starting BioNeMo...${NC}"
        python app.py > /tmp/bionemo.log 2>&1 &
        sleep 3
    } || echo "❌ BioNeMo directory not found"
fi

echo -e "\n${YELLOW}[3/4] Starting Orchestrator (Port 7001)${NC}"
if check_port 7001; then
    echo "⚠️  Port 7001 already in use, skipping..."
else
    cd "$HACKATHON_DIR/orchestrator" 2>/dev/null && {
        echo "📦 Installing dependencies..."
        pip install -q -r requirements.txt 2>/dev/null
        echo -e "${GREEN}✅ Starting Orchestrator...${NC}"
        python main.py > /tmp/orchestrator.log 2>&1 &
        sleep 3
    } || echo "❌ Orchestrator directory not found"
fi

echo -e "\n${YELLOW}[4/4] Starting Web UI Server (Port 3000)${NC}"
if check_port 3000; then
    echo "⚠️  Port 3000 already in use, skipping..."
else
    cd "$HACKATHON_DIR/web" 2>/dev/null && {
        echo -e "${GREEN}✅ Starting Web UI...${NC}"
        python server.py > /tmp/webui.log 2>&1 &
        sleep 2
    } || echo "❌ Web UI directory not found"
fi

echo -e "\n${GREEN}=======================================${NC}"
echo -e "${GREEN}✨ All services started!${NC}"
echo -e "${GREEN}=======================================${NC}\n"

echo -e "${CYAN}📍 SERVICE ENDPOINTS:${NC}"
echo "   • Smart-Chem:    http://localhost:8000"
echo "   • BioNeMo:       http://localhost:5000"
echo "   • Orchestrator:  http://localhost:7001"
echo -e "   • ${YELLOW}Web UI:${NC}          http://localhost:3000 ⭐"
echo ""

echo -e "${CYAN}🎬 NEXT STEPS:${NC}"
echo "   1. Open: http://localhost:3000"
echo "   2. Click: 💓 CHECK HEALTH"
echo "   3. Click: 🚀 RUN DISCOVERY"
echo ""

echo "Press Ctrl+C to stop all services"
echo ""

# Keep script running
wait
