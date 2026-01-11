# 🧬 Orchestrator Cheatsheet - Copy/Paste Ready

## Quick Commands

### Start Everything
```bash
cd ~/hackathon && ./START_SERVICES.sh
```

### Test Pipeline
```bash
cd ~/hackathon/orchestrator && python test_pipeline.py
```

### Interactive Demo
```bash
cd ~/hackathon && python DEMO.py
```

---

## API Calls (Copy & Paste)

### 1. Health Check
```bash
curl http://localhost:7000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Drug Discovery Orchestrator",
  "version": "1.0.0",
  "pipeline": ["Smart-Chem", "BioNeMo", "EBNA1 ADMET"]
}
```

---

### 2. Check Service Status
```bash
# Smart-Chem
curl http://localhost:7000/status/smartchem

# BioNeMo
curl http://localhost:7000/status/bionemo
```

---

### 3. Run Full Pipeline (Quick)
```bash
curl -X POST http://localhost:7000/orchestrate/discover \
  -H "Content-Type: application/json" \
  -d '{
    "target_name": "EBNA1",
    "num_molecules": 5,
    "target_qed": 0.8,
    "target_logp": 2.5,
    "target_sas": 3.0
  }'
```

---

### 4. Run Full Pipeline (Large Scale)
```bash
curl -X POST http://localhost:7000/orchestrate/discover \
  -H "Content-Type: application/json" \
  -d '{
    "target_name": "SARS-CoV-2 Main Protease",
    "num_molecules": 20,
    "target_qed": 0.85,
    "target_logp": 2.0,
    "target_sas": 3.5
  }'
```

---

### 5. With Python (Better Output)
```python
import httpx
import json

url = "http://localhost:7000/orchestrate/discover"
payload = {
    "target_name": "EGFR L858R",
    "num_molecules": 10,
    "target_qed": 0.8,
    "target_logp": 2.5,
    "target_sas": 3.0
}

with httpx.Client(timeout=180.0) as client:
    resp = client.post(url, json=payload)
    result = resp.json()

    print(f"Target: {result['target']}")
    print(f"Generated: {result['generation_stage']['generated']} molecules")
    print(f"Validated: {result['docking_stage']['validated']} molecules")

    print("\nTop 5 Candidates:")
    for candidate in result['top_candidates']:
        print(f"\n#{candidate['rank']}: {candidate['smiles']}")
        print(f"  ADMET Score: {candidate['admet_score']}")
        print(f"  Toxicity Risk: {candidate['toxicity_flag']}")
```

---

## Port Status Checks

### Are Services Running?
```bash
# Check port 8000 (Smart-Chem)
curl -s http://localhost:8000/ && echo "✅ Smart-Chem" || echo "❌ Smart-Chem"

# Check port 5000 (BioNeMo)
curl -s http://localhost:5000/ && echo "✅ BioNeMo" || echo "❌ BioNeMo"

# Check port 7000 (Orchestrator)
curl -s http://localhost:7000/health && echo "✅ Orchestrator" || echo "❌ Orchestrator"
```

---

## If Something Goes Wrong

### Kill Zombie Processes
```bash
# Kill port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null

# Kill port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null

# Kill port 7000
lsof -i :7000 | grep LISTEN | awk '{print $2}' | xargs kill -9 2>/dev/null
```

### Restart Everything
```bash
# Kill all
pkill -f "uvicorn\|python.*app.py\|python.*main.py"

# Wait 2 seconds
sleep 2

# Start fresh
cd ~/hackathon && ./START_SERVICES.sh
```

---

## Demo Talking Points

### Q: "How does the generation work?"
**A:** Smart-Chem uses a Variational Autoencoder trained on SELFIES notation. It samples random latent vectors (128-dim space) and uses a property predictor to guide optimization toward your target QED, LogP, and SAS values. This is all done asynchronously with MongoDB job queues.

### Q: "Why these 3 projects?"
**A:**
- Smart-Chem: Best agentic architecture (async workers, event-driven)
- BioNeMo: State-of-the-art docking (NVIDIA DiffDock AI + RDKit)
- EBNA1: Rigorous validation (found actual EBNA1 inhibitors)

Together they form a complete pipeline: Generate → Validate → Score

### Q: "What makes this agentic?"
**A:** The orchestrator autonomously chains 3 ML pipelines. It:
1. Generates molecules without human guidance
2. Validates them automatically
3. Scores all candidates
4. Returns ranked results

No manual intervention needed. It's fully autonomous.

### Q: "Can you scale this?"
**A:** Yes! Smart-Chem already has MongoDB job queue with background workers. You can horizontally scale the worker processes. BioNeMo and ADMET are stateless, so you can load balance them too.

### Q: "What's the science here?"
**A:** It's a real pharmaceutical pipeline:
- EBNA1 discovered actual inhibitors (Dynasore, Cavosonstat)
- We use Lipinski's rule of 5 for drug-likeness
- RDKit for chemistry validation
- DiffDock for protein-ligand docking
- BBB penetration prediction

---

## Output Example

```
🚀 Starting drug discovery for EBNA1...
  [1/3] Generating molecules with Smart-Chem...
  ✅ Generated 8 molecules

  [2/3] Validating and docking with BioNeMo...
  ✅ Validated 8 molecules

  [3/3] Predicting ADMET properties...
  ✅ Predicted ADMET for 8 molecules

✨ Discovery complete!

🏆 TOP 5 CANDIDATES:

Rank #1
  SMILES: CC(=O)Nc1ccc(O)cc1
  QED Score: 0.89
  ADMET Score: 0.85
  Toxicity Flag: False
  BBB Penetration: True

Rank #2
  SMILES: CCO...
  ...
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `orchestrator/main.py` | Core FastAPI orchestrator (the integration) |
| `orchestrator/test_pipeline.py` | Test client with health checks |
| `DEMO.py` | Interactive demo with 3 scenarios |
| `START_SERVICES.sh` | One-command startup |
| `README.md` | Full documentation |
| `QUICKSTART.txt` | Fast reference |
| `CHEATSHEET.md` | This file (copy-paste ready) |

---

## Timing Estimates

| Stage | Time |
|-------|------|
| Service startup | 10-15 seconds |
| First molecule generation | 20-40 seconds (loading models) |
| Validation & docking | 5-10 seconds |
| ADMET prediction | 2-5 seconds |
| Ranking & output | <1 second |
| **Total first run** | **60-120 seconds** |
| **Subsequent runs** | **30-60 seconds** |

---

## Energy Saving Tips for Demo

- **Pre-warm services**: Run `test_pipeline.py` once before demoing
- **Keep services running**: Don't restart between demos
- **Show the code**: open `orchestrator/main.py` to show 3-stage pipeline
- **Show the results**: JSON output is beautiful and clear
- **Have backup demo**: `DEMO.py` if live pipeline is slow

---

## Common Judge Questions & Answers

**Q: "This is just calling existing APIs, right?"**
A: "The hard part is orchestrating them intelligently. Each project works independently. We built the connective tissue that makes them work together as one platform. Look at main.py - we handle async coordination, error recovery, ranking algorithms, and result compilation."

**Q: "Why not just use one project?"**
A: "Each is best-in-class for its specific function. Using all three gives you the scientific rigor of EBNA1, the agenticity of Smart-Chem, and the enterprise docking of BioNeMo. It's the 'best of all worlds' approach."

**Q: "How is this novel?"**
A: "The novelty is in the orchestration layer and the specific combination. No one has chained these three exact projects before with this async pattern and ranking algorithm."

---

## Pro Tips

1. **Before demoing**, run test_pipeline.py once to warm up the models
2. **Show the orchestrator/main.py file** during demo to prove YOU wrote the glue code
3. **Mention the architecture** - async/event-driven is trendy
4. **Have curl commands ready** if you want to show API directly
5. **Know the limitations**: DiffDock needs NVIDIA API key, EBNA1 uses Lipinski heuristics
6. **Be ready to explain**: Why these 3? Why this architecture? Why agentic?

---

Good luck with the hackathon! 🚀
