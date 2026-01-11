import { create } from 'zustand';
import { api } from '@/services/api';
import type { Candidate, DiscoveryParams, ApiError } from '@/types/api';

interface DiscoveryState {
  // Data
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  targetName: string;

  // UI State
  isLoading: boolean;
  error: ApiError | null;

  // Actions
  runDiscovery: (params: DiscoveryParams) => Promise<void>;
  setSelectedCandidate: (candidate: Candidate | null) => void;
  clearCandidates: () => void;
  clearError: () => void;

  // Persistence
  saveCandidates: () => void;
  loadCandidates: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
  // Initial state
  candidates: [],
  selectedCandidate: null,
  targetName: '',
  isLoading: false,
  error: null,

  // Run discovery
  runDiscovery: async (params: DiscoveryParams) => {
    set({ isLoading: true, error: null, targetName: params.target_name });

    try {
      const data = await api.runDiscovery(params);
      set({
        candidates: data.top_candidates || [],
        isLoading: false,
      });

      // Auto-save to localStorage
      get().saveCandidates();

    } catch (error) {
      // Error is already an ApiError from handleApiError in api.ts
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
        candidates: [],
      });
      console.error('Discovery failed:', apiError.message);
    }
  },

  // Set selected candidate
  setSelectedCandidate: (candidate: Candidate | null) => {
    set({ selectedCandidate: candidate });
  },

  // Clear all candidates
  clearCandidates: () => {
    set({
      candidates: [],
      selectedCandidate: null,
      error: null,
    });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('discovery_candidates');
      localStorage.removeItem('discovery_target');
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Save candidates to localStorage
  saveCandidates: () => {
    if (typeof window === 'undefined') return;

    const { candidates, targetName } = get();
    localStorage.setItem('discovery_candidates', JSON.stringify(candidates));
    localStorage.setItem('discovery_target', targetName);
  },

  // Load candidates from localStorage
  loadCandidates: () => {
    if (typeof window === 'undefined') return;

    try {
      const savedCandidates = localStorage.getItem('discovery_candidates');
      const savedTarget = localStorage.getItem('discovery_target');

      if (savedCandidates) {
        const parsed = JSON.parse(savedCandidates);

        // Validate that parsed data is an array
        if (!Array.isArray(parsed)) {
          console.warn('Invalid candidates data in localStorage, skipping load');
          return;
        }

        // Validate that each item has required Candidate properties
        const isValid = parsed.every(
          (item: unknown) =>
            typeof item === 'object' &&
            item !== null &&
            'smiles' in item &&
            'rank' in item
        );

        if (!isValid) {
          console.warn('Candidates data missing required fields, skipping load');
          return;
        }

        set({
          candidates: parsed as Candidate[],
          targetName: savedTarget || '',
        });
      }
    } catch (error) {
      console.error('Failed to load candidates from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('discovery_candidates');
      localStorage.removeItem('discovery_target');
    }
  },
}));
