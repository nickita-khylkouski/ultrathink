'use client';

import { useState } from 'react';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { useSearchCache } from '@/hooks/useSearchCache';
import { Database, ExternalLink, Pill, Activity } from 'lucide-react';

interface ChEMBLMolecule {
  molecule_chembl_id: string;
  pref_name: string | null;
  molecule_type: string;
  max_phase: number;
  smiles: string;
  molecular_formula: string;
  molecular_weight: number;
  alogp: number | null;
  url: string;
}

const PHASE_LABELS: Record<number, string> = {
  0: 'Preclinical',
  1: 'Phase I Clinical',
  2: 'Phase II Clinical',
  3: 'Phase III Clinical',
  4: 'FDA Approved',
};

export function ChEMBLSearch() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'smiles' | 'target'>('name');
  const [results, setResults] = useState<ChEMBLMolecule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // Cache with 10 minute TTL (ChEMBL data changes less frequently)
  const { getCached, setCached, cacheSize } = useSearchCache<ChEMBLMolecule[]>({ ttl: 10 * 60 * 1000 });

  const searchChEMBL = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    // Check cache first
    const cacheKey = `chembl:${searchType}:${query.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);

    if (cached) {
      setResults(cached);
      setFromCache(true);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setFromCache(false);

    try {
      let searchUrl = '';

      // ChEMBL REST API endpoint
      if (searchType === 'name') {
        searchUrl = `https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodeURIComponent(query)}&limit=20&format=json`;
      } else if (searchType === 'smiles') {
        // Similarity search by SMILES
        searchUrl = `https://www.ebi.ac.uk/chembl/api/data/similarity/${encodeURIComponent(query)}/70?limit=20`;
      } else if (searchType === 'target') {
        // Search by target name
        searchUrl = `https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodeURIComponent(query)}&limit=20&format=json`;
      }

      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error(`ChEMBL API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.molecules || data.molecules.length === 0) {
        setError('No results found in ChEMBL database');
        setIsLoading(false);
        return;
      }

      const molecules: ChEMBLMolecule[] = data.molecules.map((mol: any) => ({
        molecule_chembl_id: mol.molecule_chembl_id,
        pref_name: mol.pref_name,
        molecule_type: mol.molecule_type,
        max_phase: mol.max_phase || 0,
        smiles: mol.molecule_structures?.canonical_smiles || 'N/A',
        molecular_formula: mol.molecule_properties?.full_molformula || 'N/A',
        molecular_weight: mol.molecule_properties?.full_mwt || 0,
        alogp: mol.molecule_properties?.alogp,
        url: `https://www.ebi.ac.uk/chembl/compound_report_card/${mol.molecule_chembl_id}/`,
      }));

      setResults(molecules);

      // Cache successful results
      setCached(cacheKey, molecules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search ChEMBL database');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-black">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-6 w-6" />
          <h2 className="text-xl font-bold">ChEMBL Bioactive Molecules Database</h2>
        </div>

        <p className="text-sm text-text-secondary mb-4 leading-relaxed">
          Search over 2.4 million bioactive drug-like molecules from ChEMBL.
          Find FDA-approved drugs, clinical candidates, and experimental compounds with bioactivity data.
        </p>

        {/* Search Type Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSearchType('name')}
            className={`px-4 py-2 text-xs border-2 border-black ${
              searchType === 'name' ? 'bg-black text-white' : 'bg-white hover:bg-panel'
            }`}
          >
            Drug Name
          </button>
          <button
            onClick={() => setSearchType('smiles')}
            className={`px-4 py-2 text-xs border-2 border-black ${
              searchType === 'smiles' ? 'bg-black text-white' : 'bg-white hover:bg-panel'
            }`}
          >
            SMILES Similarity
          </button>
          <button
            onClick={() => setSearchType('target')}
            className={`px-4 py-2 text-xs border-2 border-black ${
              searchType === 'target' ? 'bg-black text-white' : 'bg-white hover:bg-panel'
            }`}
          >
            Target Protein
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchChEMBL()}
            placeholder={
              searchType === 'name'
                ? 'e.g., aspirin, ibuprofen, penicillin'
                : searchType === 'smiles'
                ? 'e.g., CC(=O)Oc1ccccc1C(=O)O (aspirin)'
                : 'e.g., EGFR, ACE2, BRAF'
            }
            className="flex-1 border-black"
          />
          <Button
            onClick={searchChEMBL}
            disabled={isLoading}
            className="bg-black text-white hover:bg-secondary px-6"
          >
            {isLoading ? 'Searching...' : 'Search ChEMBL'}
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        )}

        {error && <ErrorMessage message={error} className="mb-4" />}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">Results ({results.length})</h3>
                {fromCache && (
                  <span className="flex items-center gap-1 text-xs font-mono bg-panel px-2 py-1 border border-black">
                    <Database className="h-3 w-3" />
                    Cached ({cacheSize} searches)
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary">Source: ChEMBL Database (EBI)</p>
            </div>

            {results.map((molecule) => (
              <div
                key={molecule.molecule_chembl_id}
                className="border-2 border-black p-4 hover:bg-panel transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-research mb-1">
                      {molecule.pref_name || molecule.molecule_chembl_id}
                    </h4>
                    <p className="text-xs text-text-secondary font-mono">
                      {molecule.molecule_chembl_id} • {molecule.molecule_type}
                    </p>
                  </div>

                  {/* Development Phase Badge */}
                  <div
                    className={`px-3 py-1 text-xs font-bold border-2 border-black ${
                      molecule.max_phase === 4
                        ? 'bg-black text-white'
                        : molecule.max_phase >= 2
                        ? 'bg-panel text-black'
                        : 'bg-white text-text-secondary'
                    }`}
                  >
                    {PHASE_LABELS[molecule.max_phase] || 'Unknown Phase'}
                  </div>
                </div>

                {/* Molecular Properties Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 p-3 bg-panel border-l-4 border-black">
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Formula</p>
                    <p className="text-sm font-mono font-bold">{molecule.molecular_formula}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Mol. Weight</p>
                    <p className="text-sm font-mono font-bold">
                      {molecule.molecular_weight && typeof molecule.molecular_weight === 'number'
                        ? molecule.molecular_weight.toFixed(2) + ' Da'
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">AlogP</p>
                    <p className="text-sm font-mono font-bold">
                      {molecule.alogp !== null && typeof molecule.alogp === 'number'
                        ? molecule.alogp.toFixed(2)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary mb-1">Phase</p>
                    <p className="text-sm font-mono font-bold">{molecule.max_phase}</p>
                  </div>
                </div>

                {/* SMILES */}
                {molecule.smiles !== 'N/A' && (
                  <div className="mb-3">
                    <p className="text-xs text-text-secondary mb-1">Canonical SMILES:</p>
                    <p className="text-xs font-mono bg-panel p-2 border-l-2 border-black break-all">
                      {molecule.smiles}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={molecule.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View in ChEMBL
                  </a>

                  {molecule.smiles !== 'N/A' && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(molecule.smiles);
                        alert('SMILES copied to clipboard!');
                      }}
                      className="inline-flex items-center gap-1 text-xs border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                    >
                      <Pill className="h-3 w-3" />
                      Copy SMILES
                    </button>
                  )}

                  {molecule.max_phase === 4 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-black text-white px-3 py-1">
                      <Activity className="h-3 w-3" />
                      FDA Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !isLoading && !error && (
          <div className="text-center py-12 text-text-secondary">
            <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-2">
              Search ChEMBL for bioactive molecules, approved drugs, and clinical candidates
            </p>
            <div className="text-xs space-y-1">
              <p><strong>Drug Name:</strong> aspirin, ibuprofen, metformin</p>
              <p><strong>SMILES:</strong> CC(=O)Oc1ccccc1C(=O)O</p>
              <p><strong>Target:</strong> EGFR, ACE2, kinase</p>
            </div>
          </div>
        )}

        {/* Database Info Footer */}
        <div className="mt-6 pt-4 border-t-2 border-black">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>ChEMBL Database:</strong> Manually curated by EMBL-EBI containing 2.4M+ bioactive molecules,
            17,500 approved drugs, 1.6M+ bioactivity assays across 17,000 targets.
            Updated regularly with clinical trial and FDA approval data.
          </p>
        </div>
      </div>
    </Card>
  );
}
