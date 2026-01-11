# 🧬 Git Clones Summary - AI Drug Discovery Pipeline

This document lists all the real GitHub repositories that have been cloned into this hackathon project.

---

## Core Drug Discovery Services (Original Clones)

### 1. **Smart-Chem** - Molecular Generation
**GitHub:** https://github.com/NishCode17/Smart-Chem
**Location:** `/Users/nickita/hackathon/Smart-Chem/`
**Purpose:** AI-powered molecular generation with targeted properties (VAE-based)
**Status:** ✓ Real git clone (commits from Dec 2025)
```bash
cd /Users/nickita/hackathon/Smart-Chem
git remote -v  # Shows: origin https://github.com/NishCode17/Smart-Chem.git
```

---

### 2. **AI-driven Virtual Screening Drug Discovery for EBNA1**
**GitHub:** https://github.com/akshata2025/AI-driven-Virtual_screening-Drug_discovery-for-EBNA1-Multiple_sclerosis
**Location:** `/Users/nickita/hackathon/ebna1/`
**Purpose:** Complete ML pipeline for drug discovery (Jupyter notebooks with ML models)
**Status:** ✓ Real git clone (recent commits from 2025)
```bash
cd /Users/nickita/hackathon/ebna1
git remote -v  # Shows: origin https://github.com/akshata2025/...
```

---

### 3. **BioNeMo Validation Screener** - Protein-Ligand Docking
**GitHub:** https://github.com/Gourab79/BioNeMo-Validation-Screener
**Location:** `/Users/nickita/hackathon/bionemo/`
**Purpose:** NVIDIA DiffDock integration for molecular validation and docking
**Status:** ✓ Real git clone (recent commits)
```bash
cd /Users/nickita/hackathon/bionemo
git remote -v  # Shows: origin https://github.com/Gourab79/BioNeMo-Validation-Screener.git
```

---

## 3D Molecular Visualization Libraries (New Clones)

### 4. **3Dmol.js** - Interactive 3D Molecular Viewer ⭐ ACTIVE
**GitHub:** https://github.com/3dmol/3Dmol.js
**Location:** `/Users/nickita/hackathon/3dmol-viewer/`
**Purpose:** WebGL-based 3D structure visualization for drug candidates
**Status:** ✓ Real git clone (1150 files, actively maintained)
**Integration:** ✅ Integrated into web UI
**Why Chosen:**
- Easiest web integration (2 lines of code)
- NIH-funded development (ensures reliability)
- Works with PubChem API for automatic 3D generation
- ~886 stars on GitHub
- Supports multiple molecular formats (PDB, SDF, MOL2, etc.)

```bash
cd /Users/nickita/hackathon/3dmol-viewer
git remote -v  # Shows: origin https://github.com/3dmol/3Dmol.js.git
git log --oneline | head -3
```

**How It's Used in Your App:**
```javascript
// Web UI loads 3Dmol.js library from CDN
<script src="https://3Dmol.csb.pitt.edu/build/3Dmol-min.js"></script>

// When you click a drug candidate:
1. User clicks candidate → display3DMolecule(smiles)
2. SMILES string sent to PubChem REST API
3. PubChem generates 3D structure (SDF format)
4. 3Dmol.js renders interactive 3D visualization
5. User can rotate, zoom, inspect atomic interactions
```

---

### 5. **Mol* (Molstar)** - Advanced Biomolecular Visualization
**GitHub:** https://github.com/molstar/molstar
**Location:** `/Users/nickita/hackathon/molstar-viewer/`
**Purpose:** Industry-standard 3D structure viewer (used by PDB, RCSB, AlphaFold)
**Status:** ✓ Real git clone (large repository, actively maintained)
**Why Available:**
- Better for analyzing large protein complexes
- Can handle 100s of superimposed structures simultaneously
- Professional-grade for final presentations
- ~853 stars on GitHub

```bash
cd /Users/nickita/hackathon/molstar-viewer
git remote -v  # Shows: origin https://github.com/molstar/molstar.git
```

---

### 6. **NGL Viewer** - High-Performance Molecular Viewer
**GitHub:** https://github.com/nglviewer/ngl
**Location:** `/Users/nickita/hackathon/ngl-viewer/`
**Purpose:** WebGL-based viewer optimized for very large molecular complexes
**Status:** ✓ Real git clone (1128 files, actively maintained)
**Why Available:**
- Mobile-friendly visualization
- Excellent for millions of atoms
- Used in computational chemistry workflows
- ~698 stars on GitHub
- Great for docking result visualization

```bash
cd /Users/nickita/hackathon/ngl-viewer
git remote -v  # Shows: origin https://github.com/nglviewer/ngl.git
```

---

## File Structure

```
/Users/nickita/hackathon/
├── Smart-Chem/                 ← Git clone: Molecular generation
├── ebna1/                       ← Git clone: ML pipeline for ADMET
├── bionemo/                     ← Git clone: Protein docking
├── 3dmol-viewer/                ← Git clone: 3D visualization ⭐
├── molstar-viewer/              ← Git clone: Advanced visualization
├── ngl-viewer/                  ← Git clone: High-perf visualization
├── orchestrator/                ← Your FastAPI service
├── web/                         ← Your web UI (uses 3Dmol.js)
├── GIT_CLONES_SUMMARY.md        ← This file
├── DEMO_GUIDE.md                ← How to demo
└── QUICK_DEMO.sh                ← Start all services
```

---

## What 3Dmol.js Does For You

When you click a drug candidate in the web UI:

1. **SMILES Input:** `CC(=O)Nc1ccc(O)cc1` (Paracetamol)

2. **3D Generation:** Sent to PubChem API
   ```
   GET https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/{SMILES}/SDF?record_type=3d
   ```

3. **3D Visualization:** 3Dmol.js renders:
   - **Cartoon representation:** Shows secondary structure
   - **Stick model:** Shows atomic bonds
   - **Color coding:** Standard element colors
   - **Interactive:** Rotate, zoom, pan with mouse
   - **Style options:** Can show surfaces, ribbons, etc.

4. **Below the viewer:**
   - Atomic composition breakdown (C, O, N, S, etc. counts)
   - Chemical properties
   - Reference to 3Dmol.js source

---

## How to Access Each Viewer

All three viewers are available in your `/Users/nickita/hackathon/` directory for reference or advanced integration:

**Option 1: Use 3Dmol.js (Current) - ACTIVE**
```bash
# Your web UI automatically uses it
open http://localhost:3000/index.html
# Click a candidate → see 3D structure
```

**Option 2: Explore Molstar Locally**
```bash
cd /Users/nickita/hackathon/molstar-viewer
# Check documentation for custom integration
cat README.md | grep -i "integration\|quickstart"
```

**Option 3: Use NGL Viewer**
```bash
cd /Users/nickita/hackathon/ngl-viewer
# Review documentation for specialized use cases
cat README.md | head -50
```

---

## Verification

To verify all clones are real and connected to their GitHub origins:

```bash
#!/bin/bash
echo "Verifying all git clones..."
for dir in Smart-Chem ebna1 bionemo 3dmol-viewer molstar-viewer ngl-viewer; do
    echo ""
    echo "Checking $dir..."
    cd "/Users/nickita/hackathon/$dir"
    echo "  Remote: $(git remote -v | grep fetch | cut -d' ' -f1-2)"
    echo "  Commits: $(git rev-parse HEAD)"
    echo "  Latest: $(git log -1 --format=%ai)"
done
```

Run this to confirm everything is genuinely cloned!

---

## Integration Summary

| Library | Status | Use Case | Web Integration |
|---------|--------|----------|-----------------|
| 3Dmol.js | ✅ Active | Interactive 3D viewing of drug candidates | **Integrated in web UI** |
| Molstar | ✓ Available | Advanced protein analysis & comparison | Available for custom use |
| NGL Viewer | ✓ Available | High-performance large structure viewing | Available for custom use |
| Smart-Chem | ✓ Cloned | Molecular generation (VAE-based) | Via orchestrator API |
| EBNA1 ML | ✓ Cloned | ADMET prediction & ML models | Via orchestrator API |
| BioNeMo | ✓ Cloned | Protein-ligand docking | Via orchestrator API |

---

## Next Steps

1. **Test the current setup:**
   ```bash
   bash /Users/nickita/hackathon/QUICK_DEMO.sh
   open http://localhost:3000/index.html
   ```

2. **Click a candidate to see 3D viewer in action:**
   - You'll see an interactive 3D molecular structure
   - Rotating it will work (drag with mouse)
   - Atomic composition shown below

3. **Optional: Advanced Integration**
   - If you need better protein visualization → Use Molstar
   - If you need mobile-friendly views → Use NGL Viewer
   - For production → Keep 3Dmol.js (best balance)

---

Made for AGI House Hackathon 🚀
Real Git Clones ✓ | Real 3D Visualization ✓ | Production Ready ✓
