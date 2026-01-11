# 🚀 RESEARCH MODEL INTEGRATION - IMPLEMENTATION PLAN

## Current State Analysis

### Backend Architecture
- **Framework**: FastAPI (Python) on port 7001
- **Current Generation**: `ShapetheciasEvolution` class with random atomic mutations
- **Mutation Strategy**: Random add/remove of atoms (C, N, O, S, F, Cl, Br)
- **Scoring System**: ADMET-based fitness function
- **AI Integration**: GPT-3.5-turbo for analysis, GPT-4o for novelty assessment
- **Main Endpoints**: `/shapethesias/evolve`, `/shapethesias/continue-evolution`

### Frontend Architecture
- **Single HTML file**: `/web/index.html` (~2400 lines)
- **3 System Tabs**: System 1 (Discovery), System 2 (Evolution), About Us
- **Visualization**: 3Dmol.js (3D) + smilesDrawer (2D)
- **Tool Buttons**: 6 standard + 7 AI tools in System 2
- **Integration Buttons**: System 1 has 🔄 COMPARE, 🏥 USES, 🧬 EVOLVE

### Current Limitations
- ❌ Random mutations generate ~30% invalid molecules
- ❌ No semantic understanding of chemical space
- ❌ No protein structure prediction
- ❌ No advanced docking (would rely on external service)
- ❌ Property constraints during generation not implemented

---

## Phase 1: MolGAN Integration (HIGHEST IMPACT - 2-3 hours)

### Why MolGAN First?
1. **Direct replacement** of current random mutation engine
2. **100% valid molecules** (no filtering needed)
3. **Learned chemistry** from training data
4. **Property constraints** capability
5. **Immediate visible improvement** in generation quality

### Implementation Steps

#### Step 1: Create MolGAN Module
**File**: `/Users/nickita/hackathon/orchestrator/molgan_integration.py`

```python
"""
MolGAN Integration Module
Provides GAN-based molecular generation as alternative to random mutations
"""

class MolGANGenerator:
    """
    Wrapper for MolGAN (Molecular Generative Adversarial Network)
    Paper: "MolGAN: An implicit generative model for small molecular graphs"
    GitHub: https://github.com/nicola-decao/MolGAN
    """

    def __init__(self):
        # Can be either:
        # A) Load pre-trained model from huggingface/zenodo
        # B) Use API call to external MolGAN service
        # C) Use mock implementation for demo
        pass

    def generate_variants(self, parent_smiles: str, num_variants: int = 100,
                         constraints: dict = None) -> List[str]:
        """
        Generate variants from parent molecule with optional property constraints

        Args:
            parent_smiles: Starting molecule SMILES
            num_variants: Number of variants to generate (default 100)
            constraints: Dict with properties like {"admet": {"min": 0.85}}

        Returns:
            List of generated SMILES (100% valid)
        """
        # 1. Encode parent SMILES into latent vector using GAN encoder
        # 2. Sample nearby vectors in latent space
        # 3. Decode vectors back to SMILES using GAN decoder
        # 4. Filter by constraint parameters
        # 5. Score all variants
        # 6. Return top N
        pass

    def get_metadata(self):
        """Return metadata about MolGAN model"""
        return {
            "model": "MolGAN",
            "paper": "MolGAN: An implicit generative model for small molecular graphs",
            "authors": "De Cao & Kipf (DeepMind)",
            "year": 2018,
            "advantages": [
                "100% valid molecule generation",
                "Learned from real chemical data",
                "Property-constrained generation",
                "Fast inference"
            ]
        }
```

#### Step 2: Update Main Backend
**File**: `/Users/nickita/hackathon/orchestrator/main.py`

Add to `GITHUB_TOOLS`:
```python
GITHUB_TOOLS = {
    # ... existing tools ...
    "generation_molgan": "MolGAN (GitHub: nicola-decao/MolGAN)",
    "generation_jtvae": "JTVAE (GitHub: wengong-jin/junction-tree-vae)",
    "docking_diffdock": "DiffDock (GitHub: gcorso/DiffDock)",
}
```

Add new endpoint:
```python
@app.post("/shapethesias/evolve-molgan")
def evolve_with_molgan(parent_smiles: str, num_variants: int = 100,
                       generation: int = 1, property_constraints: dict = None):
    """
    Shapethesias evolution using MolGAN instead of random mutations

    Improvements over random mutations:
    1. 100% valid molecules (no filtering)
    2. Chemically sensible variants
    3. Learned from real drug structures
    4. Property-constrained generation possible
    """
    from molgan_integration import MolGANGenerator

    molgan = MolGANGenerator()

    # Generate variants using MolGAN (not random mutations)
    variants = molgan.generate_variants(
        parent_smiles,
        num_variants=num_variants,
        constraints=property_constraints
    )

    # Score and return top 5 (same as random mutation version)
    # ... rest of scoring logic ...
```

Add selection endpoint:
```python
@app.post("/tools/select-generation-method")
def select_generation_method(method: str):
    """
    Allow user to switch between generation methods:
    - "random": Current random mutations
    - "molgan": GAN-based generation
    - "jtvae": Junction tree VAE
    """
    return {
        "selected_method": method,
        "description": get_method_description(method),
        "advantages": get_method_advantages(method),
        "switch_endpoint": f"/shapethesias/evolve-{method}"
    }
```

#### Step 3: Update Frontend
**File**: `/Users/nickita/hackathon/web/index.html`

Add selector UI in System 2:
```html
<div style="background: #0a2a0a; padding: 10px; margin: 10px 0; border: 1px solid #00ff00;">
    <strong style="color: #00ff88;">🎨 GENERATION METHOD:</strong>
    <select id="generation-method" style="width: 100%; margin-top: 5px;">
        <option value="random">🔀 Random Mutations (Current)</option>
        <option value="molgan">🎨 MolGAN - AI Generation</option>
        <option value="jtvae">🧩 JTVAE - Hierarchical</option>
    </select>
</div>
```

Add button for MolGAN:
```html
<button class="tool-btn" onclick="evolveWithMolGAN()"
    style="width: 100%; margin: 3px 0; background: #662200;">
🎨 AI Molecular Generation (MolGAN)
</button>
```

Add JavaScript function:
```javascript
async function evolveWithMolGAN() {
    if (!selectedVariantS2) {
        updateStatus("❌ Select a variant first", "error");
        return;
    }

    updateStatus("🎨 Generating variants with MolGAN...", "healthy");

    try {
        const response = await fetch(`${API_URL}/shapethesias/evolve-molgan`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                parent_smiles: evolutionState.parent_smiles,
                num_variants: 100,
                generation: evolutionState.generation + 1,
                property_constraints: {
                    "admet": {"min": 0.75}
                }
            })
        });

        const data = await response.json();
        evolutionState.generation = data.generation;
        evolutionState.total_variants += data.top_5_candidates.length;

        displayVariants(data.top_5_candidates, data.generation);
        updateStatus("✅ MolGAN generation complete (100% valid molecules)", "healthy");
    } catch (error) {
        updateStatus(`❌ MolGAN error: ${error.message}`, "error");
    }
}
```

---

## Phase 2: AlphaFold Integration (GAME CHANGER - 4-5 hours)

### Why AlphaFold?
- Predict 3D protein structures from amino acid sequences
- Enable **structure-based docking** instead of blind docking
- Reduces docking calculation time by 1000X
- Can show protein pocket alongside molecule

### Implementation

#### Backend Module
**File**: `/Users/nickita/hackathon/orchestrator/alphafold_integration.py`

```python
class AlphaFoldPredictor:
    """
    Protein structure prediction using AlphaFold
    Paper: "Highly accurate protein structure prediction with AlphaFold3"
    GitHub: https://github.com/google-deepmind/alphafold3
    """

    def predict_structure(self, protein_sequence: str) -> dict:
        """
        Predict 3D structure from amino acid sequence

        Returns: PDB format structure
        """
        pass
```

#### Frontend Addition
- New tab in System 2: "🧬 Protein Structure"
- Input: Protein sequence or PDB ID
- Output: 3D protein visualization alongside molecule
- Combined view: protein pocket + drug molecule

---

## Phase 3: DiffDock Integration (ADVANCED DOCKING - 4-5 hours)

### Why DiffDock?
- Uses diffusion models (like DALL-E) for docking
- Better accuracy than AutoDock Vina
- Faster than traditional docking
- Can combine with AlphaFold for structure-based approach

### Implementation

#### Backend Module
**File**: `/Users/nickita/hackathon/orchestrator/diffdock_integration.py`

```python
class DiffDockPredictor:
    """
    Molecular docking using diffusion models
    Paper: "DiffDock: Diffusion Steps, Twists, and Turns for Molecular Docking"
    GitHub: https://github.com/gcorso/DiffDock
    """

    def dock_molecule(self, smiles: str, protein_pdb: str) -> dict:
        """
        Dock molecule into protein pocket using diffusion models

        Returns: binding affinity, pose, visualization data
        """
        pass
```

---

## Implementation Dependencies

### Option A: Full Implementation (Recommended for Presentation)
```bash
pip install rdkit
pip install torch  # For MolGAN
pip install dm-tree  # MolGAN dependency
# Download pre-trained MolGAN model from zenodo/huggingface
```

### Option B: Lightweight (API-Based)
- Call external MolGAN service via HTTP
- Reduces local dependencies
- Better for scalability

### Option C: Mock Implementation (Demo)
- Create simulated generators that show architecture
- Production-ready code structure
- Can swap in real models later

---

## Frontend Changes Summary

### System 2 New Features

1. **Generation Method Selector**
   - Dropdown to choose between Random/MolGAN/JTVAE
   - Shows method description and advantages

2. **New Tool Buttons**
   - 🎨 AI Molecular Generation (MolGAN)
   - 🧬 Protein Structure Prediction (AlphaFold)
   - 🔥 Advanced Docking (DiffDock)
   - 📊 Property Constraints Editor

3. **Combined Visualization**
   - Left panel: Molecule 3D
   - Right panel: Protein 3D (when available)
   - Shared viewport showing docking pose

4. **Statistics Dashboard Updates**
   - Track which generation method used
   - Show quality metrics (valid % for MolGAN)
   - Compare generation methods side-by-side

---

## Testing & Validation

### Phase 1 Testing (MolGAN)
```python
# Test 1: Verify generated molecules are valid
smiles_list = molgan.generate_variants("CC(=O)Nc1ccc(O)cc1", 100)
for smiles in smiles_list:
    assert Chem.MolFromSmiles(smiles) is not None, f"Invalid: {smiles}"

# Test 2: Verify property constraints work
variants = molgan.generate_variants(
    "CC(=O)Nc1ccc(O)cc1",
    constraints={"admet": {"min": 0.85}}
)
for v in variants:
    assert calculate_admet(v)["admet_score"] >= 0.85

# Test 3: Compare with random mutations
random_variants = random_mutate(100 times)
molgan_variants = molgan_generate(100 times)
assert validity(molgan_variants) > 0.95  # MolGAN should be near 100%
assert validity(random_variants) < 0.80  # Random likely ~30-80%
```

### Integration Tests
- Backend endpoints respond correctly
- Frontend buttons trigger API calls
- 3D visualization updates with new variants
- Statistics dashboard tracks generation method

---

## Rollout Strategy

### Week 1 (Hackathon Phase)
1. Implement MolGAN (core improvement)
2. Add frontend selector
3. Update About page with new tool
4. Demo with MolGAN as primary method

### Week 2 (Post-Hackathon)
1. Implement AlphaFold (protein structure)
2. Implement DiffDock (advanced docking)
3. Add combined visualizations
4. Publish architecture blog post

### Week 3 (Research Grade)
1. Add JTVAE (hierarchical generation)
2. Add binding site prediction
3. Add property interpretability
4. Academic paper submission

---

## Success Metrics

### Phase 1 (MolGAN)
- ✅ 100% valid molecule generation
- ✅ Faster variant generation than random
- ✅ Better ADMET scores on average
- ✅ Frontend selector working
- ✅ API endpoint responding

### Phase 2 (AlphaFold)
- ✅ Protein structure prediction working
- ✅ 3D visualization of protein
- ✅ Docking with structure information

### Phase 3 (DiffDock)
- ✅ Binding affinity predictions
- ✅ Pose visualization
- ✅ Comparison with Vina

---

## File Modifications Summary

| File | Changes | Lines |
|------|---------|-------|
| `main.py` | Add 3 new endpoints, 2 new modules | +150 |
| `index.html` | Add selector UI, new buttons, JS functions | +200 |
| NEW: `molgan_integration.py` | MolGAN wrapper class | ~150 |
| NEW: `alphafold_integration.py` | AlphaFold wrapper class | ~150 |
| NEW: `diffdock_integration.py` | DiffDock wrapper class | ~150 |
| `ABOUT.md` section | Update tool count, add new research models | +50 |

---

## Estimated Time Budget

| Task | Time | Priority |
|------|------|----------|
| MolGAN Integration | 2-3 hours | 🔴 Critical |
| AlphaFold Integration | 4-5 hours | 🟡 High |
| DiffDock Integration | 4-5 hours | 🟡 High |
| JTVAE Integration | 3-4 hours | 🟢 Nice-to-have |
| Binding Site Prediction | 2-3 hours | 🟢 Nice-to-have |
| Documentation & Testing | 2-3 hours | 🟡 Important |
| **TOTAL** | **18-23 hours** | - |

---

## Ready for Approval

This plan provides:
1. ✅ Clear implementation path for research model integration
2. ✅ Prioritization (MolGAN first = biggest impact)
3. ✅ Specific file changes and code structure
4. ✅ Frontend and backend components
5. ✅ Testing strategy
6. ✅ Rollout timeline

**Recommended approach**: Start with Phase 1 (MolGAN) to show research paper integration working, then add more models based on time availability.
