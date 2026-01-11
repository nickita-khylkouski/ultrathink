# 🧬 AI Drug Discovery Pipeline - Demo Guide

## What You're Looking At

This is a **unified AI-powered drug discovery system** that combines three state-of-the-art techniques:

1. **Molecular Generation** - AI creates novel drug-like molecules with target properties
2. **Molecular Validation** - Checks if molecules are viable and can bind to target proteins
3. **ADMET Prediction** - Predicts drug absorption, distribution, metabolism, and toxicity

Think of it as an automated drug researcher that goes from "what properties do we want?" to "here are the top 5 candidate drugs."

---

## How to Demo This

### Step 1: Open the Web UI
```bash
open http://localhost:3000/index.html
```

### Step 2: Click "💓 CHECK HEALTH"
**What to watch for:**
- ✨ Status bar **glows and flashes** in bright green
- Message updates to show: "✅ Orchestrator Online - 1.0.0"
- This proves all services are connected and ready

### Step 3: Click "🚀 RUN DISCOVERY"
**What happens:**
- Status updates: "🔄 Running demo discovery..."
- After ~2 seconds, Results panel fills with:
  - **5 drug candidates** ranked by ADMET score
  - **QED score** (drug-likeness on scale 0-1)
  - **Molecular weight, LogP, TPSA** (key drug properties)
  - **Toxicity flags** and **BBB penetration** (crosses blood-brain barrier?)

### Step 4: Click Any Candidate
**The 3D Viewer Shows:**
- Candidate name and SMILES string (molecular notation)
- **Atomic composition breakdown** with color-coded atoms:
  - 🔵 Carbon (Gray) - backbone
  - 🔴 Oxygen (Red) - often needed for activity
  - 🔵 Nitrogen (Blue) - key functional groups
  - 🟡 Sulfur (Yellow) - less common but important
- Total count of each atom type

---

## Understanding the Science (In Tech Terms)

### What's EBNA1?
It's a **viral disease target protein**. The system was originally designed to find drugs against this, but you can enter any target name you want.

### What are These Numbers?
- **MW (Molecular Weight)**: Must be <500 to cross cell membranes
- **LogP**: Hydrophobicity (how well it dissolves). Ideal is 0-5
- **HBD/HBA**: Hydrogen bond donors/acceptors. Both should be <5-10
- **TPSA**: Polar surface area. <60 = better cell penetration
- **QED**: "Drug-likeness" score. 0-1 scale, higher is better
- **ADMET**: Likelihood the drug will be absorbed and safe

### Lipinski's Rule of 5
The system checks these criteria (if broken, higher toxicity risk):
- Molecular Weight < 500 ✓
- LogP < 5 ✓
- H-Bond Donors < 5 ✓
- H-Bond Acceptors < 10 ✓

Breaking 2+ rules = 🚩 Toxicity Flag

---

## 🎯 Quick Demo Script (30 seconds)

1. Open browser → `http://localhost:3000/index.html`
2. Watch title: **"🧬 DRUG DISCOVERY ORCHESTRATOR"** with help tooltip
3. Click **"💓 CHECK HEALTH"** → Status bar **glows bright green**
4. Click **"🚀 RUN DISCOVERY"** → Wait 2 seconds for results
5. See **5 drug candidates** with scores
6. Click **Candidate #1** → **3D atomic composition viewer** shows
7. Explain: "We generated 5 molecules, scored them by ADMET, showing the best ones"

---

## UI Features

### Status Bar
- **Larger, bolder** for visibility
- **Glow effect** that pulses on every update
- **Color changes**:
  - 🟢 Green = Success
  - 🔴 Red = Error
  - 🔵 Cyan = Info

### 3D Molecule Viewer
- **Visual atomic composition** with color-coded atoms
- **SVG-based visualization** (works in all browsers)
- Shows SMILES notation for technical users
- Displays molecular properties in readable format

### JSON Output
- Raw API response for validation
- Useful for debugging and technical review

---

## Files Running

| Service | Port | Status |
|---------|------|--------|
| Web UI | 3000 | ✅ Running |
| Orchestrator | 7001 | ✅ Running |
| BioNeMo | 5000 | ✅ Running (optional) |
| Smart-Chem | 8000 | ⚠️ Using demo mode instead |

---

## Key Talking Points for Judges

1. **"Orchestrator Pattern"** - Three separate AI services unified under one API
2. **"Demo Mode"** - Works without external dependencies (Smart-Chem module)
3. **"Real Drug Properties"** - ADMET scores based on actual cheminformatics
4. **"Interactive Visualization"** - Can inspect any candidate molecule in detail
5. **"Scalable"** - Can easily add more services (protein prediction, safety checks, etc.)

---

## Example API Calls

```bash
# Check system health
curl http://localhost:7001/health

# Run demo discovery
curl -X POST http://localhost:7001/orchestrate/demo \
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

## What's New in This Version

✨ **Enhanced Status Feedback**
- Status bar now has glowing border
- Flash animation on every update
- More prominent 16px font size

🎨 **Improved 3D Viewer**
- SVG-based atomic composition visualization
- Color-coded atoms for quick understanding
- Larger viewport (220px height)
- Better layout with separated breakdown section

📝 **Tech-Friendly Labeling**
- Help tooltips explaining concepts
- EBNA1 explained as "viral disease protein"
- Placeholder changed to "e.g., viral protein, disease target"
- Pipeline description in title tooltip

---

## Troubleshooting

**"No feedback when clicking CHECK HEALTH"**
→ Watch the status box - it has a **glowing border that flashes**. If you still don't see it, check browser console for errors.

**"3D viewer doesn't show"**
→ It displays atomic composition when you click a candidate. Try clicking "#1 - Paracetamol" - you should see colored atoms listed.

**"Getting errors?"**
→ Make sure orchestrator is running: `ps aux | grep main.py`

---

Made for AGI House Hackathon 🚀
