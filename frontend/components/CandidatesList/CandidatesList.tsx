'use client';

import { useDiscoveryStore } from '@/store/useDiscoveryStore';
import { Badge } from '@/components/shared/Badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { truncateSMILES, getScoreColor } from '@/utils/formatters';
import { Candidate } from '@/types/api';

export function CandidatesList() {
  const { candidates, selectedCandidate, setSelectedCandidate, isLoading, error, clearError } =
    useDiscoveryStore();

  if (isLoading) {
    return <LoadingSpinner message="Generating drug candidates..." />;
  }

  if (error) {
    return <ErrorMessage error={error} onDismiss={clearError} />;
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>👈 Click DISCOVER to generate drug candidates</p>
      </div>
    );
  }

  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleKeyDown = (e: React.KeyboardEvent, candidate: Candidate) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectCandidate(candidate);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-primary text-sm font-bold mb-3">
        🏆 {candidates.length} Candidates
      </div>

      {candidates.map((candidate) => {
        const isSelected = selectedCandidate?.rank === candidate.rank;
        const scoreColor = getScoreColor(candidate.admet_score);

        return (
          <div
            key={candidate.rank}
            role="button"
            tabIndex={0}
            onClick={() => handleSelectCandidate(candidate)}
            onKeyDown={(e) => handleKeyDown(e, candidate)}
            aria-pressed={isSelected}
            aria-label={`Candidate ${candidate.rank}, ADMET score ${candidate.admet_score.toFixed(2)}`}
            className={`
              bg-panel p-3 border-l-4 cursor-pointer rounded transition-all
              ${isSelected ? 'border-secondary bg-panel/80' : 'border-primary'}
              hover:bg-panel/80 hover:border-secondary
              focus:outline-none focus:ring-2 focus:ring-secondary
            `}
          >
            <div className={`font-bold text-sm mb-1 ${scoreColor}`}>
              #{candidate.rank} | ADMET: {candidate.admet_score.toFixed(2)}
            </div>

            <div className="text-xs text-gray-500 mb-2 font-mono break-all">
              SMILES: {truncateSMILES(candidate.smiles)}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge variant={candidate.lipinski_violations === 0 ? 'good' : 'bad'}>
                Lipo: {candidate.lipinski_violations === 0 ? '✅' : '❌'}
              </Badge>
              <Badge variant={candidate.toxicity_flag ? 'bad' : 'good'}>
                Safe: {candidate.toxicity_flag ? '⚠️' : '✅'}
              </Badge>
              <Badge variant={candidate.bbb_penetration ? 'good' : 'warn'}>
                BBB: {candidate.bbb_penetration ? '✅' : '❌'}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
