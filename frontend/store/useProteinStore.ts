import { create } from 'zustand';
import { api } from '@/services/api';
import type { ESMFoldParams, ESMFoldResponse, ApiError } from '@/types/api';

interface ProteinState {
  // Data
  currentProtein: ESMFoldResponse | null;
  sequence: string;
  proteinName: string;

  // UI State
  isLoading: boolean;
  error: ApiError | null;

  // Actions
  predictStructure: (params: ESMFoldParams) => Promise<void>;
  clearProtein: () => void;
  clearError: () => void;
}

export const useProteinStore = create<ProteinState>((set) => ({
  // Initial state
  currentProtein: null,
  sequence: '',
  proteinName: '',
  isLoading: false,
  error: null,

  // Predict protein structure
  predictStructure: async (params: ESMFoldParams) => {
    set({
      isLoading: true,
      error: null,
      sequence: params.sequence,
      proteinName: params.protein_name,
    });

    try {
      const data = await api.predictProteinStructure(params);
      set({
        currentProtein: data,
        isLoading: false,
      });
    } catch (error) {
      // Error is already an ApiError from handleApiError in api.ts
      const apiError = error as ApiError;
      set({
        error: apiError,
        isLoading: false,
        currentProtein: null,
      });
      console.error('Protein prediction failed:', apiError.message);
    }
  },

  // Clear protein data
  clearProtein: () => {
    set({
      currentProtein: null,
      sequence: '',
      proteinName: '',
      error: null,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
