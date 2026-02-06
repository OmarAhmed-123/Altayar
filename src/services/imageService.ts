/**
 * Image Service
 * Uses the unified API client to get images from backend
 * Includes caching to prevent redundant API calls
 */
import { API } from './apiClient';
import { ensureStringUri } from './../utils/imageUriHelper';
import { extractData, extractArray } from './../utils/apiResponse';
import { getCachedImage, cacheImage, getCachedImages, cacheImages } from './imageCache';

// Fallback image URLs using Unsplash (only when API fails)
const getFallbackImageUrl = (category: string, width: number = 200, height: number = 200): string => {
  // Clean category name for Unsplash
  const cleanCategory = category.replace(/\+/g, ' ').replace(/\s+/g, '+');
  return `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(cleanCategory)}`;
};

export const imageService = {
  getImageByCategory: async (category: string, width?: number, height?: number, query?: string) => {
    try {
      const response = await API.image.getImageByCategory(category, { width, height, query });
      const data = extractData(response);
      if (data) {
        return { success: true, data };
      }
      throw new Error('Empty image payload');
    } catch (error) {
      console.warn('Failed to get image from API, using fallback:', error);
      const imageUrl = getFallbackImageUrl(query || category, width || 200, height || 200);
      return { success: true, data: { imageUrl, category, query: query || category } };
    }
  },

  getBatchImages: async (categories: string[], width?: number, height?: number) => {
    try {
      const response = await API.image.getBatchImages(categories, { width, height });
      const data = extractData(response);
      if (data) {
        return { success: true, data };
      }
      throw new Error('Empty batch image payload');
    } catch (error) {
      console.warn('Failed to get batch images from API, using fallback:', error);
      const images = categories.map(category => ({
        category,
        imageUrl: getFallbackImageUrl(category, width || 200, height || 200),
      }));
      return { success: true, data: { images } };
    }
  },

  getServiceImages: async () => {
    const response = await API.image.getServiceImages();
    const data = extractData(response);
    return { success: true, data };
  },
  
  // Helper function to get image URL for a category
  // Uses aggressive caching and immediate fallback to prevent rate limiting
  getImageUrl: async (category: string, width: number = 200, height: number = 200): Promise<string> => {
    // Check cache first - this is the fastest path
    const cached = await getCachedImage(category, width, height);
    if (cached) {
      return cached;
    }
    
    // Try API with timeout and immediate fallback on error
    try {
      const response = await Promise.race([
        API.image.getImageByCategory(category, { width, height }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 2000) // 2 second timeout
        )
      ]) as any;
      
      const data = extractData(response);
      const imageUrl = data?.imageUrl || (data as any)?.imageUrl || response?.imageUrl;
      
      // Ensure we return a string, not a number
      if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
        // Cache the image URL (async, don't wait)
        cacheImage(category, imageUrl, width, height).catch(() => {});
        return imageUrl;
      }
    } catch (error: any) {
      // If it's a 429 rate limit error, immediately use fallback (don't retry)
      if (error?.response?.status === 429 || error?.message === 'Request timeout') {
        // Try cache one more time
        const cachedFallback = await getCachedImage(category, width, height);
        if (cachedFallback) {
          return cachedFallback;
        }
        // Immediately use Unsplash fallback (no API call needed)
        const fallbackUrl = getFallbackImageUrl(category, width, height);
        // Cache the fallback (async, don't wait)
        cacheImage(category, fallbackUrl, width, height).catch(() => {});
        return fallbackUrl;
      }
      // For other errors, also use fallback immediately
      console.warn(`Error getting image for category ${category}, using fallback:`, error?.message || error);
    }
    
    // Immediate fallback to Unsplash (no external API calls)
    const fallbackUrl = getFallbackImageUrl(category, width, height);
    // Cache the fallback (async, don't wait)
    cacheImage(category, fallbackUrl, width, height).catch(() => {});
    return fallbackUrl;
  },
  
  // Helper function to get multiple image URLs
  // Optimized to use cache aggressively and fallback immediately on errors
  getImageUrls: async (categories: string[], width: number = 200, height: number = 200): Promise<Record<string, string>> => {
    // Check cache first - this is the fastest path
    const cached = await getCachedImages(categories, width, height);
    const imagesMap: Record<string, string> = { ...cached };
    
    // Find categories that are not cached
    const uncachedCategories = categories.filter(cat => !imagesMap[cat]);
    
    // If all are cached, return immediately (no API calls)
    if (uncachedCategories.length === 0) {
      return imagesMap;
    }
    
    // For uncached categories, try API with timeout
    try {
      const response = await Promise.race([
        API.image.getBatchImages(uncachedCategories, { width, height }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 3000) // 3 second timeout
        )
      ]) as any;
      
      const responseData = extractData(response);
      const images = extractArray(responseData?.images ? { data: responseData.images } : responseData);
      
      if (Array.isArray(images)) {
        images.forEach((img: any, index: number) => {
          const category = uncachedCategories[index] || img.category || '';
          const imageUrl = img.imageUrl || img.url || '';
          // Ensure we store a string, not a number
          if (category && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
            imagesMap[category] = imageUrl;
          }
        });
      }
      
      // Fill missing categories with fallback
      uncachedCategories.forEach(category => {
        if (!imagesMap[category]) {
          imagesMap[category] = getFallbackImageUrl(category, width, height);
        } else {
          // Ensure existing values are strings
          imagesMap[category] = ensureStringUri(imagesMap[category], getFallbackImageUrl(category, width, height));
        }
      });
      
      // Cache all images (async, don't wait)
      cacheImages(imagesMap, width, height).catch(() => {});
      
      return imagesMap;
    } catch (error: any) {
      // If it's a 429 rate limit error or timeout, immediately use fallback
      if (error?.response?.status === 429 || error?.message === 'Request timeout') {
        // Fill missing with fallback immediately (no retry)
        uncachedCategories.forEach(category => {
          if (!imagesMap[category]) {
            imagesMap[category] = getFallbackImageUrl(category, width, height);
          }
        });
        // Cache fallbacks (async, don't wait)
        cacheImages(imagesMap, width, height).catch(() => {});
        return imagesMap;
      }
      
      // For other errors, also use fallback immediately
      console.warn('Error getting batch images, using fallback:', error?.message || error);
      const fallbackMap: Record<string, string> = { ...imagesMap };
      uncachedCategories.forEach(category => {
        if (!fallbackMap[category]) {
          fallbackMap[category] = getFallbackImageUrl(category, width, height);
        }
      });
      // Cache fallbacks (async, don't wait)
      cacheImages(fallbackMap, width, height).catch(() => {});
      return fallbackMap;
    }
  },
};

