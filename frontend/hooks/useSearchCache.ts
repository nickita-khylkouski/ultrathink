import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseSearchCacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxSize?: number; // Maximum cache entries (default: 50)
}

/**
 * Hook for caching search results to reduce API calls
 *
 * Features:
 * - TTL-based expiration
 * - LRU eviction when max size reached
 * - Type-safe caching
 * - Automatic cache invalidation
 *
 * @example
 * const { getCached, setCached, clearCache } = useSearchCache<PubMedResult[]>({ ttl: 300000 });
 */
export function useSearchCache<T>(options: UseSearchCacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options;

  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [cacheSize, setCacheSize] = useState(0);

  /**
   * Get cached data if valid (not expired)
   */
  const getCached = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > ttl) {
      cacheRef.current.delete(key);
      setCacheSize(cacheRef.current.size);
      return null;
    }

    return entry.data;
  }, [ttl]);

  /**
   * Set cache entry with LRU eviction
   */
  const setCached = useCallback((key: string, data: T) => {
    // If cache is full, remove oldest entry (LRU)
    if (cacheRef.current.size >= maxSize) {
      const firstKey = cacheRef.current.keys().next().value;
      if (firstKey) {
        cacheRef.current.delete(firstKey);
      }
    }

    cacheRef.current.set(key, {
      data,
      timestamp: Date.now(),
    });

    setCacheSize(cacheRef.current.size);
  }, [maxSize]);

  /**
   * Clear all cache entries
   */
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
    setCacheSize(0);
  }, []);

  /**
   * Remove specific cache entry
   */
  const removeCache = useCallback((key: string) => {
    cacheRef.current.delete(key);
    setCacheSize(cacheRef.current.size);
  }, []);

  /**
   * Check if cache has valid entry
   */
  const hasCache = useCallback((key: string): boolean => {
    return getCached(key) !== null;
  }, [getCached]);

  return {
    getCached,
    setCached,
    clearCache,
    removeCache,
    hasCache,
    cacheSize,
  };
}
