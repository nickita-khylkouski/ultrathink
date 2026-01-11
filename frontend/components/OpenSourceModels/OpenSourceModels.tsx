'use client';

import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Badge } from '@/components/shared/Badge';
import { GitBranch, ExternalLink, Star, Code2, Beaker } from 'lucide-react';

interface OpenSourceModel {
  name: string;
  description: string;
  githubUrl: string;
  stars: string;
  category: string;
  features: string[];
  integrated: boolean;
}

const OPEN_SOURCE_MODELS: OpenSourceModel[] = [
  {
    name: 'DeepChem',
    description: 'Democratizing deep learning for drug discovery, quantum chemistry, materials science and biology',
    githubUrl: 'https://github.com/deepchem/deepchem',
    stars: '5.3k',
    category: 'Machine Learning',
    features: ['ADMET prediction', 'Molecular fingerprints', 'Graph convolutions', 'Quantum chemistry'],
    integrated: true,
  },
  {
    name: 'RDKit',
    description: 'Open-source cheminformatics toolkit for molecular manipulation and property calculation',
    githubUrl: 'https://github.com/rdkit/rdkit',
    stars: '2.5k',
    category: 'Cheminformatics',
    features: ['SMILES parsing', 'Molecular descriptors', 'Substructure search', '2D/3D coordinates'],
    integrated: true,
  },
  {
    name: 'OpenChem',
    description: 'Deep learning toolkit for computational chemistry with PyTorch backend',
    githubUrl: 'https://github.com/Mariewelt/OpenChem',
    stars: '650',
    category: 'Deep Learning',
    features: ['Neural fingerprints', 'QSAR modeling', 'Molecular generation', 'PyTorch integration'],
    integrated: false,
  },
  {
    name: 'DeepMol',
    description: 'Machine learning framework for drug discovery with comprehensive preprocessing pipelines',
    githubUrl: 'https://github.com/BioSystemsUM/DeepMol',
    stars: '120',
    category: 'ML Framework',
    features: ['Data preprocessing', 'Feature engineering', 'Model selection', 'Ensemble methods'],
    integrated: false,
  },
  {
    name: 'ODDT',
    description: 'Open Drug Discovery Toolkit for molecular docking and virtual screening',
    githubUrl: 'https://github.com/oddt/oddt',
    stars: '430',
    category: 'Virtual Screening',
    features: ['Molecular docking', 'Scoring functions', 'Interaction fingerprints', 'Druggability prediction'],
    integrated: false,
  },
  {
    name: 'MolGAN',
    description: 'Generative adversarial networks for molecular generation',
    githubUrl: 'https://github.com/nicola-decao/MolGAN',
    stars: '890',
    category: 'Generative AI',
    features: ['De novo design', '100% valid molecules', 'Property optimization', 'Graph-based generation'],
    integrated: true,
  },
  {
    name: 'ESMFold',
    description: 'Meta\'s protein structure prediction (AlphaFold competitor)',
    githubUrl: 'https://github.com/facebookresearch/esm',
    stars: '3.1k',
    category: 'Protein Prediction',
    features: ['Fast structure prediction', 'Language model-based', 'No MSA required', 'High accuracy'],
    integrated: true,
  },
  {
    name: 'PDBFixer',
    description: 'Tool for preparing protein structures for molecular dynamics simulations',
    githubUrl: 'https://github.com/openmm/pdbfixer',
    stars: '340',
    category: 'Protein Preparation',
    features: ['Add missing residues', 'Fix mutations', 'Add hydrogens', 'Optimize pH'],
    integrated: false,
  },
];

export function OpenSourceModels() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(OPEN_SOURCE_MODELS.map(m => m.category)))];
  const filteredModels = selectedCategory === 'All'
    ? OPEN_SOURCE_MODELS
    : OPEN_SOURCE_MODELS.filter(m => m.category === selectedCategory);

  const integratedCount = OPEN_SOURCE_MODELS.filter(m => m.integrated).length;
  const totalCount = OPEN_SOURCE_MODELS.length;

  return (
    <Card className="border-2 border-black">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6" />
            <h2 className="text-xl font-bold">Open-Source Models & Tools</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary">Integrated</p>
            <p className="text-2xl font-bold">{integratedCount}/{totalCount}</p>
          </div>
        </div>

        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          ULTRATHINK integrates cutting-edge open-source tools from the computational chemistry community.
          All models are freely available on GitHub and actively maintained by researchers worldwide.
        </p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b-2 border-black">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-sm border-2 border-black transition-colors ${
                selectedCategory === category
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-panel'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.name}
              className="border-2 border-black p-4 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{model.name}</h3>
                    {model.integrated && (
                      <Badge className="bg-black text-white text-xs px-2 py-0.5">
                        ✓ Integrated
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary font-mono">{model.category}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <Star className="h-3 w-3 fill-current" />
                  {model.stars}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                {model.description}
              </p>

              {/* Features */}
              <div className="mb-4">
                <p className="text-xs font-bold mb-2">Key Features:</p>
                <div className="flex flex-wrap gap-1">
                  {model.features.map((feature) => (
                    <span
                      key={feature}
                      className="text-xs border border-black px-2 py-1 bg-panel"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={model.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-colors flex-1 justify-center"
                >
                  <Code2 className="h-3 w-3" />
                  View on GitHub
                </a>
                {!model.integrated && (
                  <button
                    className="inline-flex items-center gap-1 text-xs border-2 border-black px-3 py-2 hover:bg-black hover:text-white transition-colors"
                    title="Coming soon"
                  >
                    <Beaker className="h-3 w-3" />
                    Integrate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t-2 border-black">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>Open Source Philosophy:</strong> ULTRATHINK is built on the shoulders of giants.
            We integrate the best open-source tools from the research community and give back by making our
            platform freely available for academic use. All integrated models are properly cited and attributed.
          </p>
        </div>
      </div>
    </Card>
  );
}
