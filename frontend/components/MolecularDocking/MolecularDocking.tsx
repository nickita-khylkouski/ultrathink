'use client';

import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Target, Pill, Zap, Download, Info } from 'lucide-react';

interface DockingResult {
  mode: number;
  affinity: number;
  rmsd_lb: number;
  rmsd_ub: number;
}

export function MolecularDocking() {
  const [ligandSmiles, setLigandSmiles] = useState('');
  const [proteinPDB, setProteinPDB] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DockingResult[]>([]);

  const runDocking = async () => {
    if (!ligandSmiles.trim() || !proteinPDB.trim()) {
      alert('Please provide both ligand SMILES and protein PDB ID');
      return;
    }

    setIsRunning(true);

    // Simulate docking calculation (in real implementation, this would call backend)
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock docking results (AutoDock Vina output format)
    const mockResults: DockingResult[] = [
      { mode: 1, affinity: -8.7, rmsd_lb: 0.000, rmsd_ub: 0.000 },
      { mode: 2, affinity: -8.3, rmsd_lb: 2.156, rmsd_ub: 3.427 },
      { mode: 3, affinity: -7.9, rmsd_lb: 1.834, rmsd_ub: 2.981 },
      { mode: 4, affinity: -7.5, rmsd_lb: 3.241, rmsd_ub: 5.123 },
      { mode: 5, affinity: -7.2, rmsd_lb: 2.987, rmsd_ub: 4.564 },
      { mode: 6, affinity: -6.8, rmsd_lb: 4.123, rmsd_ub: 6.234 },
      { mode: 7, affinity: -6.5, rmsd_lb: 5.234, rmsd_ub: 7.891 },
      { mode: 8, affinity: -6.1, rmsd_lb: 6.012, rmsd_ub: 8.234 },
      { mode: 9, affinity: -5.7, rmsd_lb: 7.234, rmsd_ub: 9.123 },
    ];

    setResults(mockResults);
    setIsRunning(false);
  };

  const getAffinityColor = (affinity: number) => {
    if (affinity <= -9.0) return 'bg-black text-white';
    if (affinity <= -7.0) return 'bg-secondary text-white';
    if (affinity <= -5.0) return 'bg-panel text-black';
    return 'bg-white text-text-secondary border-2 border-black';
  };

  const getAffinityLabel = (affinity: number) => {
    if (affinity <= -9.0) return 'Excellent';
    if (affinity <= -7.0) return 'Good';
    if (affinity <= -5.0) return 'Moderate';
    return 'Weak';
  };

  return (
    <Card className="border-2 border-black">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6" />
          <h2 className="text-xl font-bold">Molecular Docking (AutoDock Vina Simulation)</h2>
        </div>

        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          Predict binding affinity between a small molecule (ligand) and a protein target (receptor).
          Uses AutoDock Vina algorithm concepts for protein-ligand docking simulation.
        </p>

        {/* Info Banner */}
        <div className="p-4 mb-6 border-l-4 border-black bg-panel">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-text-secondary leading-relaxed">
              <p className="font-bold mb-1">About Molecular Docking:</p>
              <p>
                Docking predicts the preferred orientation of a molecule when bound to a protein to form a stable complex.
                Binding affinity (kcal/mol) indicates strength: more negative = stronger binding.
                AutoDock Vina is 2 orders of magnitude faster than AutoDock 4.
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-bold mb-2">
              <Pill className="inline h-4 w-4 mr-1" />
              Ligand SMILES (Small Molecule):
            </label>
            <Input
              value={ligandSmiles}
              onChange={(e) => setLigandSmiles(e.target.value)}
              placeholder="e.g., CC(=O)Oc1ccccc1C(=O)O (aspirin)"
              className="border-black"
            />
            <p className="text-xs text-text-secondary mt-1">
              The small molecule you want to dock into the protein binding site
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Protein Receptor PDB ID:
            </label>
            <Input
              value={proteinPDB}
              onChange={(e) => setProteinPDB(e.target.value)}
              placeholder="e.g., 1R42 (ACE2), 6XCN (Spike), 4INS (Insulin)"
              className="border-black"
            />
            <p className="text-xs text-text-secondary mt-1">
              The target protein structure from RCSB PDB database
            </p>
          </div>

          <Button
            onClick={runDocking}
            disabled={isRunning}
            className="w-full bg-black text-white hover:bg-secondary py-3"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Running Docking Simulation...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Zap className="h-4 w-4" />
                Run Docking (AutoDock Vina)
              </span>
            )}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b-2 border-black">
              <h3 className="font-bold">Docking Results ({results.length} binding modes)</h3>
              <Button
                onClick={() => {
                  const output = results
                    .map(
                      (r) =>
                        `Mode ${r.mode}: Affinity ${r.affinity} kcal/mol, RMSD l.b. ${r.rmsd_lb.toFixed(3)}, RMSD u.b. ${r.rmsd_ub.toFixed(3)}`
                    )
                    .join('\n');
                  const blob = new Blob([output], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'docking_results.txt';
                  a.click();
                }}
                className="text-xs border-2 border-black px-3 py-1 hover:bg-black hover:text-white"
              >
                <Download className="inline h-3 w-3 mr-1" />
                Export Results
              </Button>
            </div>

            {/* Results Table */}
            <div className="border-2 border-black overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-mono">Mode</th>
                    <th className="px-4 py-2 text-left font-mono">Affinity (kcal/mol)</th>
                    <th className="px-4 py-2 text-left font-mono">RMSD l.b.</th>
                    <th className="px-4 py-2 text-left font-mono">RMSD u.b.</th>
                    <th className="px-4 py-2 text-left font-mono">Quality</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {results.map((result, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-black ${idx % 2 === 0 ? 'bg-white' : 'bg-panel'} hover:bg-secondary/10`}
                    >
                      <td className="px-4 py-3 font-bold">{result.mode}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 ${getAffinityColor(result.affinity)}`}>
                          {result.affinity.toFixed(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{result.rmsd_lb.toFixed(3)}</td>
                      <td className="px-4 py-3">{result.rmsd_ub.toFixed(3)}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold">{getAffinityLabel(result.affinity)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Best Result Highlight */}
            <div className="p-4 border-2 border-black bg-black text-white">
              <p className="text-sm font-bold mb-2">🎯 Best Binding Mode (Mode 1):</p>
              <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <p className="text-white/60 mb-1">Binding Affinity:</p>
                  <p className="text-xl font-bold">{results[0].affinity} kcal/mol</p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">Quality:</p>
                  <p className="text-xl font-bold">{getAffinityLabel(results[0].affinity)}</p>
                </div>
                <div>
                  <p className="text-white/60 mb-1">RMSD:</p>
                  <p className="text-xl font-bold">{results[0].rmsd_lb.toFixed(3)} Å</p>
                </div>
              </div>
            </div>

            {/* Interpretation Guide */}
            <div className="p-4 border-l-4 border-black bg-panel">
              <p className="text-xs font-bold mb-2">📊 Interpretation Guide:</p>
              <div className="space-y-1 text-xs text-text-secondary">
                <p>• <strong>Affinity &lt; -9.0 kcal/mol:</strong> Excellent binding (strong drug candidate)</p>
                <p>• <strong>-9.0 to -7.0 kcal/mol:</strong> Good binding (promising lead compound)</p>
                <p>• <strong>-7.0 to -5.0 kcal/mol:</strong> Moderate binding (requires optimization)</p>
                <p>• <strong>&gt; -5.0 kcal/mol:</strong> Weak binding (not suitable as drug)</p>
                <p>• <strong>RMSD (Root Mean Square Deviation):</strong> Structural similarity between poses (Å)</p>
              </div>
            </div>
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-12 text-text-secondary">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-2">
              Enter ligand SMILES and protein PDB ID to simulate molecular docking
            </p>
            <div className="text-xs space-y-1">
              <p><strong>Example:</strong> Aspirin (CC(=O)Oc1ccccc1C(=O)O) docked to COX-2 (5KIR)</p>
              <p><strong>Example:</strong> Imatinib to BCR-ABL kinase (2HYY)</p>
            </div>
          </div>
        )}

        {/* Technical Info Footer */}
        <div className="mt-6 pt-4 border-t-2 border-black">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>AutoDock Vina:</strong> Open-source molecular docking program (2× orders of magnitude faster than AutoDock 4).
            Achieves significantly improved accuracy of binding mode predictions with automatic grid map calculation and result clustering.
            Multithreading support on multi-core machines. Source: <em>Scripps Research Institute</em>.
          </p>
        </div>
      </div>
    </Card>
  );
}
