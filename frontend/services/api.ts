import axios, { AxiosError } from 'axios';
import type {
  HealthResponse,
  DiscoveryParams,
  DiscoveryResponse,
  ESMFoldParams,
  ESMFoldResponse,
  MolGANParams,
  MolGANResponse,
  ApiError,
} from '@/types/api';

const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Production: use same host
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${window.location.protocol}//${hostname}:7001`;
    }
  }
  // Development or SSR: use localhost or env variable
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001';
})();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds
});

// Retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function fetchWithRetry<T>(
  requestFn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await requestFn();
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error)) {
      // Retry on network errors and server errors
      const shouldRetry =
        !error.response || // Network error (ECONNREFUSED, ETIMEDOUT, etc.)
        error.code === 'ECONNABORTED' || // Request timeout
        error.response.status === 503 || // Service Unavailable
        error.response.status === 504 || // Gateway Timeout
        error.response.status === 502;   // Bad Gateway

      if (shouldRetry) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(requestFn, retries - 1);
      }
    }
    throw error;
  }
}

// Error handler
function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string }>;
    return {
      message: axiosError.response?.data?.detail || axiosError.message,
      status: axiosError.response?.status,
      details: axiosError.response?.statusText,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unknown error occurred',
  };
}

export const api = {
  // Health check
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetchWithRetry(() =>
        apiClient.get<HealthResponse>('/health')
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Drug Discovery
  async runDiscovery(params: DiscoveryParams): Promise<DiscoveryResponse> {
    try {
      const response = await fetchWithRetry(() =>
        apiClient.post<DiscoveryResponse>('/orchestrate/demo', params)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // ESMFold Protein Structure Prediction
  async predictProteinStructure(params: ESMFoldParams): Promise<ESMFoldResponse> {
    try {
      const response = await fetchWithRetry(() =>
        apiClient.post('/research/esmfold/predict', params)
      );
      // Map backend response to frontend expected format
      // Backend returns 'pdb', frontend expects 'pdb_structure'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = response.data as any;
      return {
        protein_name: rawData.protein_name || params.protein_name,
        sequence: rawData.sequence || params.sequence,
        pdb_structure: rawData.pdb || rawData.pdb_structure || '',
        prediction_confidence: rawData.accuracy || rawData.prediction_confidence || 0,
        processing_time: rawData.time_estimate || rawData.processing_time || 0,
      };
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // MolGAN Evolution
  async evolveMolecules(params: MolGANParams): Promise<MolGANResponse> {
    try {
      const response = await fetchWithRetry(() =>
        apiClient.post<MolGANResponse>('/research/molgan/generate', params)
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get common proteins
  async getCommonProteins(): Promise<Record<string, string>> {
    try {
      const response = await apiClient.get('/research/esmfold/common-proteins');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export { API_BASE_URL };
