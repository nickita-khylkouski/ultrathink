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
import { Card } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Activity, XCircle, Pill, Dna, Zap } from 'lucide-react';

type SystemTab = 'discovery' | 'esmfold' | 'molgan';

export default function Home() {
  const { isOnline, checkHealth, statusMessage } = useAppStore();
  const { selectedCandidate, loadCandidates } = useDiscoveryStore();
  const { currentProtein, clearError: clearProteinError } = useProteinStore();
  const { selectedVariant, variants, setSelectedVariant, clearError: clearMolGANError } = useMolGANStore();
  const [currentSystem, setCurrentSystem] = useState<SystemTab>('discovery');

  // Check health on mount
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Load saved candidates on mount
  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-[1600px] mx-auto">
        {/* Connection Status Indicator */}
        <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-panel px-3 py-2 rounded-full border border-gray-700">
          <div
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              isOnline ? 'bg-primary shadow-[0_0_10px_#00ff00]' : 'bg-danger shadow-[0_0_10px_#ff0000]'
            }`}
          />
          <span className="text-xs">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-secondary mb-2">
            🧬 AI DRUG DISCOVERY PLATFORM 🔬
          </h1>
          <p className="text-xs text-gray-500">
            Three Systems: Drug Screening • Protein Prediction • Molecular Evolution
          </p>
        </header>

        {/* Status Bar */}
        <div
          className={`p-4 mb-5 border-2 rounded font-bold shadow-lg ${
            isOnline
              ? 'bg-panel border-primary shadow-primary/50'
              : 'bg-red-900/20 border-danger shadow-danger/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Activity className="h-5 w-5 text-primary" />
            ) : (
              <XCircle className="h-5 w-5 text-danger" />
            )}
            <span>{statusMessage}</span>
          </div>
        </div>

        {/* System Tabs */}
        <div className="flex gap-3 mb-5 border-b-2 border-primary pb-2" role="tablist" aria-label="AI Systems">
          <button
            role="tab"
            aria-selected={currentSystem === 'discovery'}
            aria-controls="discovery-panel"
            id="discovery-tab"
            onClick={() => setCurrentSystem('discovery')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t transition-all ${
              currentSystem === 'discovery'
                ? 'bg-primary text-black'
                : 'bg-transparent text-primary hover:bg-primary/20'
            }`}
          >
            <Pill className="h-4 w-4" aria-hidden="true" />
            System 1: Drug Discovery
          </button>
          <button
            role="tab"
            aria-selected={currentSystem === 'esmfold'}
            aria-controls="esmfold-panel"
            id="esmfold-tab"
            onClick={() => setCurrentSystem('esmfold')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t transition-all ${
              currentSystem === 'esmfold'
                ? 'bg-primary text-black'
                : 'bg-transparent text-primary hover:bg-primary/20'
            }`}
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            ESMFold: Protein Structure
          </button>
          <button
            role="tab"
            aria-selected={currentSystem === 'molgan'}
            aria-controls="molgan-panel"
            id="molgan-tab"
            onClick={() => setCurrentSystem('molgan')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t transition-all ${
              currentSystem === 'molgan'
                ? 'bg-primary text-black'
                : 'bg-transparent text-primary hover:bg-primary/20'
            }`}
          >
            <Dna className="h-4 w-4" aria-hidden="true" />
            MolGAN: Evolution
          </button>
        </div>

        {/* SYSTEM 1: Drug Discovery */}
        {currentSystem === 'discovery' && (
          <div role="tabpanel" id="discovery-panel" aria-labelledby="discovery-tab">
            <div className="bg-green-900/20 border-l-4 border-primary p-3 mb-5 text-xs leading-relaxed">
              <strong className="text-warning">💊 SYSTEM 1: TRADITIONAL DRUG SCREENING</strong>
              <br />
              Find the BEST existing drug for your disease using AI
              <br />
              <br />
              <strong className="text-warning">🎯 THE PROBLEM:</strong> Drug discovery takes 10-15 YEARS and costs $2-3 BILLION per drug. Our AI finds candidates in SECONDS.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card title="🎯 DISCOVERY CONTROLS" className="max-h-[700px] overflow-y-auto">
                <DiscoveryForm />
              </Card>

              <Card title="🏆 CANDIDATES" className="max-h-[700px] overflow-y-auto">
                <CandidatesList />
              </Card>

              <Card title="📋 PROPERTIES" className="max-h-[700px] overflow-y-auto">
                <PropertiesPanel />
              </Card>
            </div>

            {selectedCandidate && (
              <div className="mt-4">
                <Card title="🧬 3D MOLECULAR STRUCTURE">
                  <div className="flex justify-center">
                    <MoleculeViewer
                      smiles={selectedCandidate.smiles}
                      width={600}
                      height={400}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* SYSTEM 2: ESMFold */}
        {currentSystem === 'esmfold' && (
          <div role="tabpanel" id="esmfold-panel" aria-labelledby="esmfold-tab">
            <div className="bg-blue-900/20 border-l-4 border-accent p-3 mb-5 text-xs leading-relaxed">
              <strong className="text-accent">⚡ ESMFOLD: PROTEIN STRUCTURE PREDICTION</strong>
              <br />
              Predict 3D protein structures from amino acid sequences using Meta's ESMFold
              <br />
              <br />
              <strong className="text-warning">🎯 THE INNOVATION:</strong> Traditional methods take hours/days. ESMFold predicts structures in SECONDS with AlphaFold2-level accuracy.
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="⚡ PROTEIN PREDICTION" className="max-h-[700px] overflow-y-auto">
                <ESMFoldForm />
              </Card>

              <Card title="📊 PREDICTION RESULTS" className="max-h-[700px] overflow-y-auto">
                {currentProtein ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-secondary font-bold mb-2">🧬 PROTEIN INFO</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Name:</span>
                          <span className="font-bold">{currentProtein.protein_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Length:</span>
                          <span>{currentProtein.sequence.length} residues</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Confidence:</span>
                          <span className="font-bold text-primary">
                            {(currentProtein.prediction_confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Processing Time:</span>
                          <span>{currentProtein.processing_time.toFixed(2)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>👈 Enter a protein sequence to predict its structure</p>
                  </div>
                )}
              </Card>
            </div>

            {currentProtein && (
              <div className="mt-4">
                <Card title="🧬 3D PROTEIN STRUCTURE">
                  <div className="flex justify-center">
                    <ProteinViewer
                      pdbData={currentProtein.pdb_structure}
                      width={800}
                      height={500}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* SYSTEM 3: MolGAN Evolution */}
        {currentSystem === 'molgan' && (
          <div role="tabpanel" id="molgan-panel" aria-labelledby="molgan-tab">
            <div className="bg-yellow-900/20 border-l-4 border-warning p-3 mb-5 text-xs leading-relaxed">
              <strong className="text-warning">🧬 MOLGAN: SHAPETHESIAS EVOLUTIONARY ALGORITHM</strong>
              <br />
              Generate NEW drugs that don't exist yet using generative AI and evolutionary mutation
              <br />
              <br />
              <strong className="text-accent">🚢 THE SHIP OF THESEUS:</strong> "If you replace all parts of a ship, is it still the same ship?" Start with Aspirin, mutate it 100 times per generation. Eventually you get a completely different molecule. But is it still aspirin?
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card title="🧬 EVOLUTION CONTROLS" className="max-h-[700px] overflow-y-auto">
                <MolGANForm />
              </Card>

              <Card title="🎲 VARIANTS" className="max-h-[700px] overflow-y-auto">
                {variants.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-primary text-sm font-bold mb-3">
                      🏆 {variants.length} Variants Generated
                    </div>
                    {variants.slice(0, 10).map((variant) => (
                      <div
                        key={variant.rank}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedVariant(variant)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedVariant(variant);
                          }
                        }}
                        aria-pressed={selectedVariant?.rank === variant.rank}
                        aria-label={`Variant ${variant.rank}, ADMET score ${variant.admet_score.toFixed(2)}, ${(variant.similarity_to_parent * 100).toFixed(1)}% similar to parent`}
                        className={`
                          bg-panel p-3 border-l-4 cursor-pointer rounded transition-all
                          ${selectedVariant?.rank === variant.rank ? 'border-secondary bg-panel/80' : 'border-primary'}
                          hover:bg-panel/80 hover:border-secondary
                          focus:outline-none focus:ring-2 focus:ring-secondary
                        `}
                      >
                        <div className="font-bold text-sm mb-1 text-primary">
                          #{variant.rank} | ADMET: {variant.admet_score.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Similarity: {(variant.similarity_to_parent * 100).toFixed(1)}%
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="good">
                            MW: {variant.descriptors.mw.toFixed(0)}
                          </Badge>
                          <Badge variant="info">
                            LogP: {variant.descriptors.logp.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>👈 Enter a parent SMILES and click EVOLVE</p>
                  </div>
                )}
              </Card>

              <Card title="📋 VARIANT INFO" className="max-h-[700px] overflow-y-auto">
                {selectedVariant ? (
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-secondary font-bold mb-2">🧬 MOLECULAR INFO</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>ADMET Score:</span>
                          <span className="font-bold">{selectedVariant.admet_score.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Similarity:</span>
                          <span>{(selectedVariant.similarity_to_parent * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mutations:</span>
                          <span>{selectedVariant.mutations.length}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-secondary font-bold mb-2">🔬 PROPERTIES</h4>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Molecular Weight:</span>
                          <span>{selectedVariant.descriptors.mw.toFixed(2)} Da</span>
                        </div>
                        <div className="flex justify-between">
                          <span>LogP:</span>
                          <span>{selectedVariant.descriptors.logp.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TPSA:</span>
                          <span>{selectedVariant.descriptors.tpsa.toFixed(2)} Ų</span>
                        </div>
                        <div className="flex justify-between">
                          <span>QED:</span>
                          <span>{selectedVariant.descriptors.qed.toFixed(3)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <p>👈 Click a variant to view details</p>
                  </div>
                )}
              </Card>
            </div>

            {selectedVariant && (
              <div className="mt-4">
                <Card title="🧬 3D VARIANT STRUCTURE">
                  <div className="flex justify-center">
                    <MoleculeViewer
                      smiles={selectedVariant.smiles}
                      width={600}
                      height={400}
                    />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts Info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            ⌨️ Shortcuts: <kbd className="px-1 border border-gray-600 rounded">Enter</kbd> = Submit |{' '}
            <kbd className="px-1 border border-gray-600 rounded">Ctrl+D</kbd> = Download |{' '}
            <kbd className="px-1 border border-gray-600 rounded">Ctrl+K</kbd> = Clear
          </p>
        </div>

        {/* Sources for Research */}
        <div className="mt-6 text-xs text-gray-600 border-t border-gray-800 pt-4">
          <p className="font-bold mb-2">📚 Research Resources:</p>
          <ul className="space-y-1">
            <li>• <a href="https://github.com/Autodesk/molecule-3d-for-react" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Autodesk molecule-3d-for-react</a> - React wrapper for 3Dmol.js</li>
            <li>• <a href="https://github.com/3dmol/3Dmol.js" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">3Dmol.js Official Repo</a> - WebGL molecular visualization</li>
            <li>• <a href="https://3dmol.csb.pitt.edu/" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">3Dmol.js Documentation</a> - API reference</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
