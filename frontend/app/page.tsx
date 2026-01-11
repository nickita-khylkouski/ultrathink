'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import { useProteinStore } from '@/store/useProteinStore';
import { useMolGANStore } from '@/store/useMolGANStore';
import { DiscoveryForm } from '@/components/DiscoveryForm';
import { ESMFoldForm } from '@/components/ESMFoldForm';
import { MolGANForm } from '@/components/MolGANForm';
import { CandidatesList } from '@/components/CandidatesList';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { MoleculeViewer } from '@/components/MoleculeViewer';
import { ProteinViewer } from '@/components/ProteinViewer';
import { PubMedSearch } from '@/components/PubMedSearch/PubMedSearch';
import { OpenSourceModels } from '@/components/OpenSourceModels/OpenSourceModels';
import { ChEMBLSearch } from '@/components/ChEMBLSearch/ChEMBLSearch';
import { MolecularDocking } from '@/components/MolecularDocking/MolecularDocking';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts/KeyboardShortcuts';
import { Card } from '@/components/shared/Card';
// Use individual imports to avoid Next.js barrel optimization issues
import { Activity } from 'lucide-react';
import { XCircle } from 'lucide-react';
import { FlaskConical } from 'lucide-react';
import { Dna } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { Code2 } from 'lucide-react';
import { Database } from 'lucide-react';
import { Target } from 'lucide-react';

type SystemTab = 'discovery' | 'esmfold' | 'molgan' | 'research' | 'models' | 'chembl' | 'docking';

export default function Home() {
  const { isOnline, checkHealth, statusMessage } = useAppStore();
  const { selectedCandidate, loadCandidates } = useDiscoveryStore();
  const { currentProtein } = useProteinStore();
  const { selectedVariant, variants, setSelectedVariant } = useMolGANStore();
  const [currentSystem, setCurrentSystem] = useState<SystemTab>('discovery');

  // Check health on mount
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved candidates on mount
  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <header className="mb-8 pb-6 border-b-4 border-black">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2 font-serif">
                ULTRATHINK
              </h1>
              <p className="text-sm text-text-secondary max-w-2xl leading-relaxed">
                Open-Source Computational Drug Discovery Platform
                <br />
                Integrating ADMET Screening, Protein Structure Prediction, Molecular Evolution, and Research Literature
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3 border-2 border-black px-4 py-2 bg-white">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Activity className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-mono">
                  {isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div className={`w-2 h-2 ${isOnline ? 'bg-black' : 'bg-text-muted'}`} />
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-4 p-3 border-l-4 border-black bg-panel">
            <p className="text-xs font-mono text-text-secondary">{statusMessage}</p>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-0 mb-6 border-2 border-black" role="tablist">
          <button
            role="tab"
            onClick={() => setCurrentSystem('discovery')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-r-2 border-black transition-colors ${
              currentSystem === 'discovery'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            ADMET Screening
          </button>

          <button
            role="tab"
            onClick={() => setCurrentSystem('esmfold')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-r-2 border-black transition-colors ${
              currentSystem === 'esmfold'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <Dna className="h-4 w-4" />
            Protein Structure
          </button>

          <button
            role="tab"
            onClick={() => setCurrentSystem('molgan')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-r-2 border-black transition-colors ${
              currentSystem === 'molgan'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Evolution
          </button>

          <button
            role="tab"
            onClick={() => setCurrentSystem('research')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-r-2 border-black transition-colors ${
              currentSystem === 'research'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Research Papers
          </button>

          <button
            role="tab"
            onClick={() => setCurrentSystem('models')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-r-2 border-black transition-colors ${
              currentSystem === 'models'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Open-Source Models
          </button>

          <button
            role="tab"
            onClick={() => setCurrentSystem('chembl')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-r-2 border-black transition-colors ${
              currentSystem === 'chembl'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <Database className="h-4 w-4" />
            ChEMBL Database
          </button>

          <button
            role="tab"
            onClick={() => setCurrentSystem('docking')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors ${
              currentSystem === 'docking'
                ? 'bg-black text-white'
                : 'bg-white text-black hover:bg-panel'
            }`}
          >
            <Target className="h-4 w-4" />
            Docking
          </button>
        </div>

        {/* SYSTEM 1: ADMET Screening */}
        {currentSystem === 'discovery' && (
          <div role="tabpanel">
            <div className="p-4 mb-6 border-l-4 border-black bg-panel">
              <p className="text-sm font-bold mb-1">SYSTEM 1: TRADITIONAL ADMET SCREENING</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Screen existing drug candidates for ADMET properties (Absorption, Distribution, Metabolism, Excretion, Toxicity).
                Uses RDKit for molecular descriptors and machine learning models for property prediction.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-2 border-black">
                <div className="p-4">
                  <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                    Discovery Controls
                  </h3>
                  <DiscoveryForm />
                </div>
              </Card>

              <Card className="border-2 border-black lg:col-span-2">
                <div className="p-4">
                  <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                    Drug Candidates
                  </h3>
                  <CandidatesList />
                </div>
              </Card>

              {selectedCandidate && (
                <>
                  <Card className="border-2 border-black lg:col-span-2">
                    <div className="p-4">
                      <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                        3D Molecular Structure
                      </h3>
                      <MoleculeViewer smiles={selectedCandidate.smiles} />
                    </div>
                  </Card>

                  <Card className="border-2 border-black">
                    <div className="p-4">
                      <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                        Properties
                      </h3>
                      <PropertiesPanel />
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        )}

        {/* SYSTEM 2: Protein Structure */}
        {currentSystem === 'esmfold' && (
          <div role="tabpanel">
            <div className="p-4 mb-6 border-l-4 border-black bg-panel">
              <p className="text-sm font-bold mb-1">SYSTEM 2: PROTEIN STRUCTURE PREDICTION</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Predict protein 3D structures from sequence using Meta's ESMFold (AlphaFold competitor).
                Fetches experimental structures from RCSB PDB database when available.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-2 border-black">
                <div className="p-4">
                  <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                    ESMFold Controls
                  </h3>
                  <ESMFoldForm />
                </div>
              </Card>

              {currentProtein && (
                <Card className="border-2 border-black lg:col-span-2">
                  <div className="p-4">
                    <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                      Protein Structure: {currentProtein.name}
                    </h3>
                    <ProteinViewer pdbData={currentProtein.pdb} />
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* SYSTEM 3: Molecular Evolution */}
        {currentSystem === 'molgan' && (
          <div role="tabpanel">
            <div className="p-4 mb-6 border-l-4 border-black bg-panel">
              <p className="text-sm font-bold mb-1">SYSTEM 3: SHAPETHESIAS EVOLUTIONARY ALGORITHM</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Evolve molecules through generations using proprietary Shapethesias algorithm.
                Combines MolGAN generative AI with ADMET-guided selection for optimized drug candidates.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-2 border-black">
                <div className="p-4">
                  <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                    Evolution Controls
                  </h3>
                  <MolGANForm />
                </div>
              </Card>

              <Card className="border-2 border-black lg:col-span-2">
                <div className="p-4">
                  <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                    Evolved Variants ({variants.length})
                  </h3>
                  {variants.length > 0 ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto">
                        {variants.slice(0, 10).map((variant, idx) => (
                          <div
                            key={idx}
                            className={`border-2 border-black ${
                              selectedVariant?.smiles === variant.smiles
                                ? 'bg-black text-white'
                                : 'bg-white'
                            }`}
                          >
                            <button
                              onClick={() => setSelectedVariant(variant)}
                              className="w-full p-3 text-left hover:bg-panel transition-colors"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <p className="text-xs font-mono flex-1">{variant.smiles}</p>
                                {idx === 0 && (
                                  <span className="text-xs font-bold bg-panel px-2 py-1 border border-black ml-2">
                                    🏆 BEST
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span>
                                  Rank #{variant.rank} | Gen {variant.generation}
                                </span>
                                <span className="font-mono font-bold">
                                  ADMET: {(variant.admet_score * 100).toFixed(1)}%
                                </span>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary text-center py-8">
                      No variants generated yet. Use the controls to evolve molecules.
                    </p>
                  )}
                </div>
              </Card>

              {selectedVariant && (
                <Card className="border-2 border-black lg:col-span-3">
                  <div className="p-4">
                    <h3 className="font-bold mb-4 text-lg border-b-2 border-black pb-2">
                      Selected Variant Visualization
                    </h3>
                    <MoleculeViewer smiles={selectedVariant.smiles} />
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* NEW: Research Papers Tab */}
        {currentSystem === 'research' && (
          <div role="tabpanel">
            <PubMedSearch />
          </div>
        )}

        {/* NEW: Open-Source Models Tab */}
        {currentSystem === 'models' && (
          <div role="tabpanel">
            <OpenSourceModels />
          </div>
        )}

        {/* NEW: ChEMBL Database Tab */}
        {currentSystem === 'chembl' && (
          <div role="tabpanel">
            <ChEMBLSearch />
          </div>
        )}

        {/* NEW: Molecular Docking Tab */}
        {currentSystem === 'docking' && (
          <div role="tabpanel">
            <MolecularDocking />
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t-2 border-black text-center">
          <p className="text-xs text-text-secondary">
            ULTRATHINK v2.0 | Open-Source Computational Drug Discovery Platform
            <br />
            Built with DeepChem, RDKit, ESMFold, MolGAN, PubMed, ChEMBL, and AutoDock Vina
            <br />
            <span className="font-mono text-xs">Press ? for keyboard shortcuts</span>
          </p>
        </footer>

        {/* Keyboard Shortcuts */}
        <KeyboardShortcuts onTabChange={(tab) => setCurrentSystem(tab as SystemTab)} />
      </div>
    </div>
  );
}
