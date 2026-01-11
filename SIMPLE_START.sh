#!/bin/bash

# Simplest possible startup - all in foreground so you see logs

HACKATHON_DIR=~/hackathon

echo "🚀 STARTING ORCHESTRATOR STACK"
echo "==============================="
echo ""

# Kill any existing processes on ports
echo "🧹 Cleaning up old processes..."
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -i :7001 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null

sleep 1

echo "📦 Installing dependencies..."
cd "$HACKATHON_DIR/Smart-Chem" && pip install -q -r requirements.txt 2>/dev/null
cd "$HACKATHON_DIR/orchestrator" && pip install -q -r requirements.txt 2>/dev/null
cd "$HACKATHON_DIR" && pip install -q flask rdkit requests 2>/dev/null

echo ""
echo "🚀 Starting services in background..."
echo ""

# Start services in background
echo "[1] Starting Orchestrator on port 7001..."
cd "$HACKATHON_DIR/orchestrator" && python main.py > /tmp/orch.log 2>&1 &
ORCH_PID=$!
echo "    PID: $ORCH_PID"

echo "[2] Starting Smart-Chem on port 8000..."
cd "$HACKATHON_DIR/Smart-Chem" && uvicorn backend.main:app --port 8000 > /tmp/sc.log 2>&1 &
SC_PID=$!
echo "    PID: $SC_PID"

echo "[3] Starting BioNeMo on port 5000..."
cd "$HACKATHON_DIR/bionemo" && python app.py > /tmp/bn.log 2>&1 &
BN_PID=$!
echo "    PID: $BN_PID"

echo "[4] Starting Web UI on port 3000..."
cd "$HACKATHON_DIR/web" && python server.py > /tmp/web.log 2>&1 &
WEB_PID=$!
echo "    PID: $WEB_PID"

echo ""
echo "⏳ Waiting for services to start..."
sleep 3

# Check if services are running
echo ""
echo "✅ CHECKING SERVICES..."
echo ""

check_service() {
    local port=$1
    local name=$2
    if nc -z localhost $port 2>/dev/null; then
        echo "   ✅ $name is running on port $port"
    else
        echo "   ❌ $name is NOT running on port $port"
    fi
}

check_service 7001 "Orchestrator"
check_service 8000 "Smart-Chem"
check_service 5000 "BioNeMo"
check_service 3000 "Web UI"

echo ""
echo "==============================="
echo "🌐 OPEN YOUR BROWSER:"
echo "   http://localhost:3000"
echo "==============================="
echo ""
echo "📋 LOGS (if services fail):"
echo "   Orchestrator: tail -f /tmp/orch.log"
echo "   Smart-Chem:   tail -f /tmp/sc.log"
echo "   BioNeMo:      tail -f /tmp/bn.log"
echo "   Web UI:       tail -f /tmp/web.log"
echo ""
echo "🛑 To stop all: pkill -f 'python\|uvicorn'"
echo ""

# Keep running
wait
