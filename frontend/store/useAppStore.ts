import { create } from 'zustand';
import { api } from '@/services/api';

type SystemTab = 'discovery' | 'evolution' | 'esmfold' | 'about';

interface AppState {
  // Connection status
  isOnline: boolean;
  lastHealthCheck: Date | null;

  // UI State
  currentSystem: SystemTab;
  statusMessage: string;

  // Actions
  checkHealth: () => Promise<void>;
  setCurrentSystem: (system: SystemTab) => void;
  setStatusMessage: (message: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  isOnline: false,
  lastHealthCheck: null,
  currentSystem: 'discovery',
  statusMessage: 'Initializing...',

  // Check backend health
  checkHealth: async () => {
    try {
      await api.healthCheck();
      set({
        isOnline: true,
        lastHealthCheck: new Date(),
        statusMessage: 'System Online',
      });
    } catch (error) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001';
      set({
        isOnline: false,
        lastHealthCheck: new Date(),
        statusMessage: `System Offline - Check backend at ${apiUrl}`,
      });
    }
  },

  // Set current system tab
  setCurrentSystem: (system: SystemTab) => {
    set({ currentSystem: system });
  },

  // Set status message
  setStatusMessage: (message: string) => {
    set({ statusMessage: message });
  },
}));
