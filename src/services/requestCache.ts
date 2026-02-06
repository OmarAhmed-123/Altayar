/**
 * Request Cache Service
 * Prevents duplicate API requests within a short time window
 * Uses in-memory cache with automatic expiration
 */

interface CachedRequest {
  data: any;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache for requests
const requestCache = new Map<string, CachedRequest>();

// Default cache duration: 2 seconds for most requests, 5 seconds for data requests
const DEFAULT_CACHE_DURATION = 2000; // 2 seconds
const DATA_CACHE_DURATION = 5000; // 5 seconds

/**
 * Generate cache key from request
 */
const getCacheKey = (method: string, url: string, data?: any): string => {
  const dataStr = data ? JSON.stringify(data) : '';
  return `${method}:${url}:${dataStr}`;
};

/**
 * Check if request is cached and still valid
 * Returns cached data or null if not found/expired
 */
export const getCachedRequest = (
  method: string,
  url: string,
  data?: any,
  cacheDuration: number = DEFAULT_CACHE_DURATION
): { data: any; is404?: boolean } | null => {
  const key = getCacheKey(method, url, data);
  const cached = requestCache.get(key);
  
  if (cached && Date.now() < cached.expiresAt) {
    return {
      data: cached.data,
      is404: cached.data?.status === 404 || cached.data?.success === false,
    };
  }
  
  // Remove expired cache
  if (cached) {
    requestCache.delete(key);
  }
  
  return null;
};

/**
 * Cache request response
 */
export const cacheRequest = (
  method: string,
  url: string,
  data: any,
  responseData: any,
  cacheDuration: number = DEFAULT_CACHE_DURATION
): void => {
  const key = getCacheKey(method, url, data);
  const now = Date.now();
  
  requestCache.set(key, {
    data: responseData,
    timestamp: now,
    expiresAt: now + cacheDuration,
  });
};

/**
 * Clear specific request from cache
 */
export const clearCachedRequest = (method: string, url: string, data?: any): void => {
  const key = getCacheKey(method, url, data);
  requestCache.delete(key);
};

/**
 * Clear all cached requests
 */
export const clearAllCachedRequests = (): void => {
  requestCache.clear();
};

/**
 * Clean up expired cache entries (call periodically)
 */
export const cleanupExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, cached] of requestCache.entries()) {
    if (now >= cached.expiresAt) {
      requestCache.delete(key);
    }
  }
};

// Clean up expired cache every 10 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 10000);
}

/**
 * Get cache duration for specific endpoint
 */
export const getCacheDuration = (url: string): number => {
  // Longer cache for data endpoints
  if (url.includes('/auth/me') || 
      url.includes('/transactions') || 
      url.includes('/bookings/myactivities') ||
      url.includes('/memberships/card/my')) {
    return DATA_CACHE_DURATION;
  }
  
  // Shorter cache for other endpoints
  return DEFAULT_CACHE_DURATION;
};

/**
 * Check if endpoint should be cached
 */
export const shouldCacheRequest = (method: string, url: string): boolean => {
  // Only cache GET requests
  if (method.toUpperCase() !== 'GET') {
    return false;
  }
  
  // Don't cache auth endpoints (except /auth/me)
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return false;
  }
  
  // Cache data endpoints (including 404 responses to prevent repeated requests)
  return true;
};

/**
 * Cache 404 responses to prevent repeated requests for non-existent resources
 */
export const cache404Response = (method: string, url: string, data?: any): void => {
  // Cache 404 for longer duration (30 seconds) to prevent repeated requests
  const key = getCacheKey(method, url, data);
  const now = Date.now();
  
  requestCache.set(key, {
    data: { success: false, message: 'Not found', status: 404 },
    timestamp: now,
    expiresAt: now + 30000, // 30 seconds for 404
  });
};

