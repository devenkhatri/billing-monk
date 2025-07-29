// Simple in-memory cache for API responses
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new SimpleCache();

// Cleanup expired entries every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}

// Helper function to create cache-aware fetch
export async function cachedFetch<T>(
  url: string, 
  options?: RequestInit,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from API
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (response.ok && data.success) {
    // Cache successful responses
    apiCache.set(cacheKey, data, ttl);
  }
  
  return data;
}

// Helper to invalidate cache for specific patterns
export function invalidateCache(pattern: string): void {
  const keys = Array.from(apiCache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  });
}