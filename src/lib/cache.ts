'use client';

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
}

/**
 * In-memory cache with TTL and size limits
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, maxSize: 0 };
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize || 100
    };
    this.stats.maxSize = this.config.maxSize;
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.size--;
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return item.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl
    };

    // If key already exists, don't increment size
    if (!this.cache.has(key)) {
      this.stats.size++;
    }

    this.cache.set(key, item);
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  /**
   * Clear all items from cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : this.stats.hits / total;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get all keys in cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Evict oldest item from cache
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.size--;
    }
  }

  /**
   * Clean up expired items
   */
  cleanup(): number {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.stats.size--;
        removedCount++;
      }
    }

    return removedCount;
  }
}

/**
 * Cache manager for different data types
 */
class CacheManager {
  private caches = new Map<string, MemoryCache>();

  /**
   * Get or create cache for a specific type
   */
  getCache<T>(type: string, config?: Partial<CacheConfig>): MemoryCache<T> {
    if (!this.caches.has(type)) {
      this.caches.set(type, new MemoryCache<T>(config));
    }
    return this.caches.get(type) as MemoryCache<T>;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  /**
   * Get stats for all caches
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    for (const [type, cache] of this.caches.entries()) {
      stats[type] = cache.getStats();
    }
    return stats;
  }

  /**
   * Cleanup expired items in all caches
   */
  cleanupAll(): number {
    let totalRemoved = 0;
    for (const cache of this.caches.values()) {
      totalRemoved += cache.cleanup();
    }
    return totalRemoved;
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();

// Predefined caches for common data types
export const clientsCache = cacheManager.getCache('clients', { ttl: 10 * 60 * 1000 }); // 10 minutes
export const invoicesCache = cacheManager.getCache('invoices', { ttl: 5 * 60 * 1000 }); // 5 minutes
export const paymentsCache = cacheManager.getCache('payments', { ttl: 5 * 60 * 1000 }); // 5 minutes
export const settingsCache = cacheManager.getCache('settings', { ttl: 30 * 60 * 1000 }); // 30 minutes
export const templatesCache = cacheManager.getCache('templates', { ttl: 15 * 60 * 1000 }); // 15 minutes

/**
 * Cache key generators
 */
export const cacheKeys = {
  clients: {
    all: () => 'clients:all',
    byId: (id: string) => `clients:${id}`,
    search: (query: string) => `clients:search:${query}`
  },
  invoices: {
    all: () => 'invoices:all',
    byId: (id: string) => `invoices:${id}`,
    byClient: (clientId: string) => `invoices:client:${clientId}`,
    byStatus: (status: string) => `invoices:status:${status}`,
    recurring: () => 'invoices:recurring'
  },
  payments: {
    all: () => 'payments:all',
    byId: (id: string) => `payments:${id}`,
    byInvoice: (invoiceId: string) => `payments:invoice:${invoiceId}`
  },
  settings: {
    company: () => 'settings:company'
  },
  templates: {
    all: () => 'templates:all',
    byId: (id: string) => `templates:${id}`
  },
  dashboard: {
    metrics: () => 'dashboard:metrics',
    recentActivity: () => 'dashboard:recent-activity'
  }
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  clients: {
    invalidateAll: () => {
      clientsCache.delete(cacheKeys.clients.all());
      // Clear search results
      clientsCache.keys().forEach(key => {
        if (key.startsWith('clients:search:')) {
          clientsCache.delete(key);
        }
      });
    },
    invalidateById: (id: string) => {
      clientsCache.delete(cacheKeys.clients.byId(id));
      cacheInvalidation.clients.invalidateAll();
    }
  },
  invoices: {
    invalidateAll: () => {
      invoicesCache.delete(cacheKeys.invoices.all());
      invoicesCache.delete(cacheKeys.invoices.recurring());
      // Clear status-based caches
      invoicesCache.keys().forEach(key => {
        if (key.startsWith('invoices:status:') || key.startsWith('invoices:client:')) {
          invoicesCache.delete(key);
        }
      });
    },
    invalidateById: (id: string) => {
      invoicesCache.delete(cacheKeys.invoices.byId(id));
      cacheInvalidation.invoices.invalidateAll();
    },
    invalidateByClient: (clientId: string) => {
      invoicesCache.delete(cacheKeys.invoices.byClient(clientId));
      cacheInvalidation.invoices.invalidateAll();
    }
  },
  payments: {
    invalidateAll: () => {
      paymentsCache.delete(cacheKeys.payments.all());
      // Clear invoice-based caches
      paymentsCache.keys().forEach(key => {
        if (key.startsWith('payments:invoice:')) {
          paymentsCache.delete(key);
        }
      });
    },
    invalidateById: (id: string) => {
      paymentsCache.delete(cacheKeys.payments.byId(id));
      cacheInvalidation.payments.invalidateAll();
    },
    invalidateByInvoice: (invoiceId: string) => {
      paymentsCache.delete(cacheKeys.payments.byInvoice(invoiceId));
      cacheInvalidation.payments.invalidateAll();
    }
  },
  settings: {
    invalidateCompany: () => {
      settingsCache.delete(cacheKeys.settings.company());
    }
  },
  templates: {
    invalidateAll: () => {
      templatesCache.delete(cacheKeys.templates.all());
    },
    invalidateById: (id: string) => {
      templatesCache.delete(cacheKeys.templates.byId(id));
      cacheInvalidation.templates.invalidateAll();
    }
  },
  dashboard: {
    invalidateMetrics: () => {
      clientsCache.delete(cacheKeys.dashboard.metrics());
      clientsCache.delete(cacheKeys.dashboard.recentActivity());
    }
  }
};

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanupAll();
  }, 5 * 60 * 1000);
}