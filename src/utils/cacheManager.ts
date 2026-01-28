/**
 * Cache Manager for RAG Documents and API Responses
 * Provides in-memory and localStorage caching with TTL support
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private static CACHE_PREFIX = 'rag_cache_';
  private static memoryCache = new Map<string, CacheItem<any>>();

  /**
   * Set item in both memory and localStorage cache
   */
  static set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Memory cache
    this.memoryCache.set(key, item);

    // LocalStorage cache
    try {
      localStorage.setItem(
        this.CACHE_PREFIX + key,
        JSON.stringify(item)
      );
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  /**
   * Get item from cache (checks memory first, then localStorage)
   */
  static get<T>(key: string): T | null {
    const now = Date.now();

    // Check memory cache first (faster)
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem) {
      if (now - memoryItem.timestamp <= memoryItem.ttl) {
        console.log(`📦 Cache HIT (memory): ${key}`);
        return memoryItem.data as T;
      } else {
        // Expired
        this.memoryCache.delete(key);
      }
    }

    // Check localStorage
    try {
      const cached = localStorage.getItem(this.CACHE_PREFIX + key);
      if (!cached) {
        console.log(`❌ Cache MISS: ${key}`);
        return null;
      }

      const item: CacheItem<T> = JSON.parse(cached);

      if (now - item.timestamp <= item.ttl) {
        console.log(`📦 Cache HIT (localStorage): ${key}`);
        // Restore to memory cache
        this.memoryCache.set(key, item);
        return item.data;
      } else {
        // Expired
        this.remove(key);
        console.log(`⏰ Cache EXPIRED: ${key}`);
        return null;
      }
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  /**
   * Remove item from cache
   */
  static remove(key: string): void {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Failed to remove localStorage cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.memoryCache.clear();
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(this.CACHE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }

  /**
   * Clear expired items
   */
  static clearExpired(): void {
    const now = Date.now();

    // Clear memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.memoryCache.delete(key);
      }
    }

    // Clear localStorage
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(this.CACHE_PREFIX))
        .forEach((k) => {
          const cached = localStorage.getItem(k);
          if (cached) {
            const item = JSON.parse(cached);
            if (now - item.timestamp > item.ttl) {
              localStorage.removeItem(k);
            }
          }
        });
    } catch (error) {
      console.warn('Failed to clear expired localStorage cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: Object.keys(localStorage).filter((k) =>
        k.startsWith(this.CACHE_PREFIX)
      ).length,
    };
  }
}

// Auto-clear expired cache every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    CacheManager.clearExpired();
  }, 5 * 60 * 1000);
}

export default CacheManager;

// Export cache keys as constants
export const CACHE_KEYS = {
  DOCUMENTS: 'documents',
  USER_INFO: 'user_info',
  CONVERSATIONS: 'conversations',
} as const;

// Export TTL constants
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000, // 1 minute
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;
