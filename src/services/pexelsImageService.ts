/**
 * Pexels Image Service
 * Provides high-quality images from Pexels API
 * Free API with 200 requests per hour
 */
import { ensureStringUri } from './../utils/imageUriHelper';

// Pexels API Key
// ⚠️ SECURITY NOTE: In production, move this to environment variables or secure storage
// For now, using the provided API key directly
const PEXELS_API_KEY = 'tMlZYWxmtkDTe2yFsbqZmJdsnKTJEc7RhCxV6ru1jUt7D1awk91s1KfE';
const PEXELS_API_URL = 'https://api.pexels.com/v1';

// Fallback to Unsplash if Pexels fails
const UNSPLASH_URL = 'https://source.unsplash.com';

/**
 * Search for images on Pexels
 */
const searchPexelsImages = async (
  query: string,
  perPage: number = 1,
  page: number = 1
): Promise<string | null> => {
  try {
    // If no API key, use Unsplash fallback
    if (!PEXELS_API_KEY || PEXELS_API_KEY.trim() === '') {
      if (__DEV__) {
        console.log('[Pexels] No API key provided, using Unsplash fallback');
      }
      return null;
    }

    const url = `${PEXELS_API_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    
    if (__DEV__) {
      console.log('[Pexels] Fetching image for query:', query);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': PEXELS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (__DEV__) {
        console.warn(`[Pexels] API error (${response.status}):`, errorText);
      }
      return null;
    }

    const data = await response.json();
    if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
      // Return medium size image (best balance between quality and size)
      const imageUrl = data.photos[0].src?.medium || data.photos[0].src?.large || data.photos[0].src?.original;
      if (imageUrl && __DEV__) {
        console.log('[Pexels] Successfully fetched image for:', query);
      }
      return imageUrl || null;
    }
    
    if (__DEV__) {
      console.warn('[Pexels] No photos found for query:', query);
    }
  } catch (error: any) {
    if (__DEV__) {
      console.warn('[Pexels] API error:', error?.message || error);
    }
  }
  
  return null;
};

/**
 * Get image URL for a category using Pexels API
 * Falls back to Unsplash if Pexels fails
 */
export const getPexelsImage = async (
  category: string,
  width: number = 400,
  height: number = 300
): Promise<string> => {
  // Try Pexels first
  const pexelsImage = await searchPexelsImages(category, 1, 1);
  if (pexelsImage) {
    return ensureStringUri(pexelsImage, '');
  }

  // Fallback to Unsplash
  const unsplashUrl = `${UNSPLASH_URL}/${width}x${height}/?${encodeURIComponent(category)}`;
  return ensureStringUri(unsplashUrl, unsplashUrl);
};

/**
 * Get curated images from Pexels
 */
export const getCuratedPexelsImage = async (
  width: number = 400,
  height: number = 300
): Promise<string> => {
  try {
    if (!PEXELS_API_KEY || PEXELS_API_KEY.trim() === '') {
      if (__DEV__) {
        console.log('[Pexels] No API key, using Unsplash fallback for curated image');
      }
      return `${UNSPLASH_URL}/${width}x${height}/?random`;
    }

    const randomPage = Math.floor(Math.random() * 100) + 1;
    const url = `${PEXELS_API_URL}/curated?per_page=1&page=${randomPage}`;
    
    if (__DEV__) {
      console.log('[Pexels] Fetching curated image, page:', randomPage);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': PEXELS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
        const imageUrl = data.photos[0].src?.medium || data.photos[0].src?.large || data.photos[0].src?.original;
        if (imageUrl && __DEV__) {
          console.log('[Pexels] Successfully fetched curated image');
        }
        return imageUrl || `${UNSPLASH_URL}/${width}x${height}/?random`;
      }
    } else {
      const errorText = await response.text();
      if (__DEV__) {
        console.warn(`[Pexels] Curated API error (${response.status}):`, errorText);
      }
    }
  } catch (error: any) {
    if (__DEV__) {
      console.warn('[Pexels] Curated API error:', error?.message || error);
    }
  }

  // Fallback to Unsplash
  return `${UNSPLASH_URL}/${width}x${height}/?random`;
};

/**
 * Get multiple images for categories
 */
export const getPexelsImages = async (
  categories: string[],
  width: number = 400,
  height: number = 300
): Promise<Record<string, string>> => {
  const imagesMap: Record<string, string> = {};

  for (const category of categories) {
    const imageUrl = await getPexelsImage(category, width, height);
    imagesMap[category] = ensureStringUri(imageUrl, `${UNSPLASH_URL}/${width}x${height}/?${encodeURIComponent(category)}`);
  }

  return imagesMap;
};

