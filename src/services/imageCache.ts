/**
 * Image Cache Service
 * Caches image URLs to prevent redundant API calls
 * Uses AsyncStorage for persistence
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = '@image_cache_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 500; // Maximum number of cached images

interface CachedImage {
  url: string;
  timestamp: number;
  category: string;
  width?: number;
  height?: number;
}

/**
 * Generate cache key from category and dimensions
 */
const getCacheKey = (category: string, width?: number, height?: number): string => {
  const dimensions = width && height ? `_${width}x${height}` : '';
  return `${CACHE_KEY_PREFIX}${category}${dimensions}`;
};

/**
 * Get cached image URL
 */
export const getCachedImage = async (
  category: string,
  width?: number,
  height?: number
): Promise<string | null> => {
  try {
    const cacheKey = getCacheKey(category, width, height);
    const cached = await AsyncStorage.getItem(cacheKey);
    
    if (cached) {
      const data: CachedImage = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - data.timestamp < CACHE_EXPIRY_MS) {
        return data.url;
      } else {
        // Cache expired, remove it
        await AsyncStorage.removeItem(cacheKey);
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Error reading image cache:', error);
    return null;
  }
};

/**
 * Cache image URL
 */
export const cacheImage = async (
  category: string,
  url: string,
  width?: number,
  height?: number
): Promise<void> => {
  try {
    const cacheKey = getCacheKey(category, width, height);
    const data: CachedImage = {
      url,
      timestamp: Date.now(),
      category,
      width,
      height,
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    
    // Clean up old cache entries periodically
    await cleanupCache();
  } catch (error) {
    console.warn('Error caching image:', error);
  }
};

/**
 * Cache multiple images at once
 */
export const cacheImages = async (
  images: Record<string, string>,
  width?: number,
  height?: number
): Promise<void> => {
  try {
    const promises = Object.entries(images).map(([category, url]) =>
      cacheImage(category, url, width, height)
    );
    await Promise.all(promises);
  } catch (error) {
    console.warn('Error caching batch images:', error);
  }
};

/**
 * Get cached images for multiple categories
 */
export const getCachedImages = async (
  categories: string[],
  width?: number,
  height?: number
): Promise<Record<string, string>> => {
  const cached: Record<string, string> = {};
  
  try {
    const promises = categories.map(async (category) => {
      const url = await getCachedImage(category, width, height);
      if (url) {
        cached[category] = url;
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.warn('Error reading batch image cache:', error);
  }
  
  return cached;
};

/**
 * Clean up old cache entries
 */
const cleanupCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    if (cacheKeys.length <= MAX_CACHE_SIZE) {
      return; // No cleanup needed
    }
    
    // Get all cache entries with timestamps
    const entries: Array<{ key: string; timestamp: number }> = [];
    
    for (const key of cacheKeys) {
      try {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const data: CachedImage = JSON.parse(cached);
          entries.push({ key, timestamp: data.timestamp });
        }
      } catch (error) {
        // Invalid cache entry, remove it
        await AsyncStorage.removeItem(key);
      }
    }
    
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries
    const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
    const removePromises = toRemove.map(entry => AsyncStorage.removeItem(entry.key));
    await Promise.all(removePromises);
    
    if (__DEV__) {
      console.log(`[Image Cache] Cleaned up ${toRemove.length} old cache entries`);
    }
  } catch (error) {
    console.warn('Error cleaning up image cache:', error);
  }
};

/**
 * Clear all cached images
 */
export const clearImageCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    await Promise.all(cacheKeys.map(key => AsyncStorage.removeItem(key)));
    
    if (__DEV__) {
      console.log(`[Image Cache] Cleared ${cacheKeys.length} cache entries`);
    }
  } catch (error) {
    console.warn('Error clearing image cache:', error);
  }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
  total: number;
  size: number;
}> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
    
    let totalSize = 0;
    for (const key of cacheKeys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      } catch (error) {
        // Ignore errors
      }
    }
    
    return {
      total: cacheKeys.length,
      size: totalSize,
    };
  } catch (error) {
    console.warn('Error getting cache stats:', error);
    return { total: 0, size: 0 };
  }
};

