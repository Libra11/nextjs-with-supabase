/*
 * @Author: Libra
 * @Date: 2025-01-08
 * @LastEditors: Libra
 * @Description: Suspense-compatible data fetching hooks
 */
import { useMemo } from "react";

type CacheEntry<T> = {
  status: "pending" | "fulfilled" | "rejected";
  value?: T;
  error?: Error;
  promise?: Promise<T>;
  timestamp?: number;
  ttl?: number; // Time to live in milliseconds
};

// Simple cache for storing fetch results
const cache = new Map<string, CacheEntry<any>>();

// Helper function to create suspense-compatible data fetcher
export function createSuspenseResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // Default 5 minutes TTL
): T {
  const entry = cache.get(key);

  // Check if cache entry exists and is still valid
  if (entry && entry.timestamp && entry.ttl) {
    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      cache.delete(key);
    }
  }

  const validEntry = cache.get(key);

  if (!validEntry) {
    // Create new cache entry
    const promise = fetcher()
      .then((result) => {
        const cacheEntry = cache.get(key);
        if (cacheEntry) {
          cacheEntry.status = "fulfilled";
          cacheEntry.value = result;
          cacheEntry.timestamp = Date.now();
          cacheEntry.ttl = ttl;
        }
        return result;
      })
      .catch((error) => {
        const cacheEntry = cache.get(key);
        if (cacheEntry) {
          cacheEntry.status = "rejected";
          cacheEntry.error = error;
          cacheEntry.timestamp = Date.now();
          cacheEntry.ttl = ttl;
        }
        throw error;
      });

    cache.set(key, {
      status: "pending",
      promise,
    });

    throw promise;
  }

  switch (validEntry.status) {
    case "pending":
      throw validEntry.promise;
    case "fulfilled":
      return validEntry.value!;
    case "rejected":
      throw validEntry.error;
  }
}

// Hook for using suspense data with automatic cache key generation
export function useSuspenseData<T>(
  keyParts: (string | number)[],
  fetcher: () => Promise<T>
): T {
  const key = useMemo(() => keyParts.join("_"), keyParts);

  return createSuspenseResource(key, fetcher);
}

// Clear cache for a specific key
export function clearSuspenseCache(key: string) {
  cache.delete(key);
}

// Clear all cache
export function clearAllSuspenseCache() {
  cache.clear();
}

// Check if data is in cache
export function isSuspenseDataCached(key: string): boolean {
  const entry = cache.get(key);
  return entry?.status === "fulfilled";
}
