# UltraThink Tools Setup

This document lists all the computational chemistry tools used in the UltraThink platform. These tools are excluded from the git repo due to size (~5.5GB total).

## Quick Setup

Clone all tools at once:

```bash
mkdir -p tools && cd tools

# Clone all repositories
git clone https://github.com/swansonk14/admet_ai.git ADMET-AI
git clone https://github.com/MolecularAI/aizynthfinder.git AiZynthFinder
git clone https://github.com/ASKCOS/ASKCOS.git ASKCOS
git clone https://github.com/grimme-lab/crest.git CREST
git clone https://github.com/datamol-io/datamol.git datamol
git clone https://github.com/kexinhuang12345/DeepPurpose.git DeepPurpose
git clone https://github.com/MolecularAI/DockStream.git DockStream
git clone https://github.com/Discngine/fpocket.git fpocket
git clone https://github.com/gnina/gnina.git gnina
git clone https://github.com/MolecularAI/GraphINVENT.git GraphINVENT
git clone https://github.com/BenevolentAI/guacamol.git GuacaMol
git clone https://github.com/samoturk/mol2vec.git mol2vec
git clone https://github.com/datamol-io/molfeat.git molfeat
git clone https://github.com/gncs/molgym.git MolGym
git clone https://github.com/mcs07/MolVS.git MolVS
git clone https://github.com/mordred-descriptor/mordred.git Mordred
git clone https://github.com/molecularsets/moses.git MOSES
git clone https://github.com/wolberlab/OpenMMDL.git OpenMMDL
git clone https://github.com/rdk/p2rank.git P2Rank
git clone https://github.com/mayrf/pkasolver.git pkasolver
git clone https://github.com/pharmai/plip.git PLIP
git clone https://github.com/chemosim-lab/ProLIF.git ProLIF
git clone https://github.com/psi4/psi4.git psi4
git clone https://github.com/hcji/PyFingerprint.git PyFingerprint
git clone https://github.com/MolecularAI/QSARtuna.git QSARtuna
git clone https://github.com/PatWalters/rd_filters.git rd_filters
git clone https://github.com/olsson-group/RL-GraphINVENT.git RL-GraphINVENT
git clone https://github.com/EBjerrum/scikit-mol.git scikit-mol
git clone https://github.com/aspuru-guzik-group/selfies.git SELFIES
git clone https://github.com/mwojcikowski/smina.git smina
git clone https://github.com/swansonk14/SyntheMol.git SyntheMol
git clone https://github.com/DeepGraphLearning/torchdrug.git TorchDrug
git clone https://github.com/torchmd/torchmd-net.git TorchMD-Net
git clone https://github.com/deepmodeling/Uni-Mol.git Uni-Mol
git clone https://github.com/grimme-lab/xtb.git xtb
```

## Reference 3D Viewers (also excluded)

```bash
# From project root
git clone https://github.com/nickvanderwildt/3Dmol.js-examples.git reference-3dmol-examples
git clone https://github.com/3dmol/3Dmol.js.git 3dmol-viewer
git clone https://github.com/nglviewer/ngl.git ngl-viewer
```

## Tool Categories

### ADMET & Property Prediction
| Tool | Description | Install |
|------|-------------|---------|
| ADMET-AI | ADMET property prediction | `pip install admet-ai` |
| pkasolver | pKa prediction | `pip install pkasolver` |
| Mordred | Molecular descriptors | `pip install mordred` |
| molfeat | Molecular featurization | `pip install molfeat` |

### Molecular Generation
| Tool | Description | Install |
|------|-------------|---------|
| GraphINVENT | Graph-based molecule generation | See README |
| RL-GraphINVENT | RL-based generation | See README |
| MOSES | Molecular generation benchmarks | `pip install molsets` |
| GuacaMol | Generation benchmarks | `pip install guacamol` |
| MolGym | RL environment for molecules | See README |

### Docking & Binding
| Tool | Description | Install |
|------|-------------|---------|
| gnina | Deep learning docking | Build from source |
| smina | AutoDock Vina fork | Build from source |
| DockStream | Docking wrapper | `pip install dockstream` |
| fpocket | Pocket detection | Build from source |
| P2Rank | Binding site prediction | Download JAR |
| PLIP | Protein-ligand interactions | `pip install plip` |
| ProLIF | Interaction fingerprints | `pip install prolif` |

### Synthesis Planning
| Tool | Description | Install |
|------|-------------|---------|
| AiZynthFinder | Retrosynthesis | `pip install aizynthfinder` |
| ASKCOS | Synthesis planning | Docker |
| SyntheMol | Synthesizable molecules | See README |

### Quantum Chemistry
| Tool | Description | Install |
|------|-------------|---------|
| psi4 | Quantum chemistry | `conda install psi4 -c psi4` |
| xtb | Extended tight-binding | `conda install xtb -c conda-forge` |
| CREST | Conformer search | Build from source |

### Deep Learning
| Tool | Description | Install |
|------|-------------|---------|
| DeepPurpose | Drug-target interaction | `pip install DeepPurpose` |
| TorchDrug | Drug discovery toolkit | `pip install torchdrug` |
| TorchMD-Net | Neural network potentials | `pip install torchmd-net` |
| Uni-Mol | Universal molecular model | See README |

### Utilities
| Tool | Description | Install |
|------|-------------|---------|
| datamol | Molecular manipulation | `pip install datamol` |
| mol2vec | Molecular embeddings | `pip install mol2vec` |
| MolVS | Molecule standardization | `pip install molvs` |
| scikit-mol | scikit-learn for molecules | `pip install scikit-mol` |
| SELFIES | Robust molecular strings | `pip install selfies` |
| rd_filters | RDKit filters | `pip install rd_filters` |
| PyFingerprint | Fingerprint calculations | See README |
| QSARtuna | QSAR model tuning | See README |
| OpenMMDL | OpenMM workflows | See README |

## Notes

- Most tools require RDKit: `conda install rdkit -c conda-forge`
- Some tools need CUDA for GPU acceleration
- Check individual tool READMEs for specific dependencies
