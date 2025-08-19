import { LIMITS, TIMING } from '../constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

export interface LRUCache<T> {
  set: (key: string, data: T) => void;
  get: (key: string) => T | null;
  has: (key: string) => boolean;
  clear: () => void;
  size: () => number;
  prune: () => void;
}

export function createLRUCache<T>(
  maxSize = LIMITS.MAX_CACHE_SIZE,
  ttl = TIMING.CACHE_TTL,
): LRUCache<T> {
  const cache = new Map<string, CacheEntry<T>>();

  const set = (key: string, data: T): void => {
    // Remove oldest entry if cache is full
    if (cache.size >= maxSize && !cache.has(key)) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }

    // Add new entry
    cache.set(key, {
      data,
      timestamp: Date.now(),
      key,
    });
  };

  const get = (key: string): T | null => {
    const entry = cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > ttl) {
      cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    cache.delete(key);
    cache.set(key, entry);

    return entry.data;
  };

  const has = (key: string): boolean => {
    return get(key) !== null;
  };

  const clear = (): void => {
    cache.clear();
  };

  const size = (): number => {
    return cache.size;
  };

  const prune = (): void => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
  };

  return {
    set,
    get,
    has,
    clear,
    size,
    prune,
  };
}

// Create cache key for lint results
export function createLintCacheKey(text: string, ruleLevel: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${ruleLevel}_${hash}_${text.length}`;
}
