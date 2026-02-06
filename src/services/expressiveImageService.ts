/**
 * Expressive Image Service
 * Provides expressive images for cards, buttons, and empty states
 * Uses AI-generated images when specific images are not available
 * Includes caching to prevent redundant API calls
 */
import { API } from './apiClient';
import { ensureStringUri } from './../utils/imageUriHelper';
import { getCachedImage, cacheImage, getCachedImages, cacheImages } from './imageCache';

// Mapping of categories to expressive search terms
const EXPRESSIVE_CATEGORIES: Record<string, string> = {
  // Empty States
  'empty': 'empty+state+illustration+minimal',
  'package': 'travel+package+vacation+illustration',
  'search-empty': 'search+not+found+empty+illustration',
  'booking': 'booking+reservation+calendar+illustration',
  'trip': 'trip+travel+journey+illustration',
  'review': 'review+rating+star+illustration',
  'notification': 'notification+bell+empty+illustration',
  'payment': 'payment+transaction+money+illustration',
  'membership': 'membership+card+premium+illustration',
  'profile': 'profile+user+avatar+illustration',
  'settings': 'settings+gear+configuration+illustration',
  
  // Cards & Buttons
  'payments': 'payment+card+wallet+illustration',
  'points': 'points+reward+star+illustration',
  'weekend-offers': 'weekend+vacation+resort+illustration',
  'coupons': 'coupon+discount+voucher+illustration',
  'cashback': 'cashback+money+return+illustration',
  'membership-card': 'membership+card+premium+illustration',
  'bookings': 'booking+reservation+hotel+illustration',
  'trips': 'trip+travel+adventure+illustration',
  'reviews': 'review+rating+feedback+illustration',
  'notifications': 'notification+alert+bell+illustration',
  'offers': 'offer+discount+promotion+illustration',
  'inbox': 'inbox+mail+messages+illustration',
  'more': 'more+menu+options+illustration',
  'language': 'language+translation+globe+illustration',
  'theme': 'theme+color+palette+illustration',
  'stats': 'statistics+chart+analytics+illustration',
  
  // Actions
  'learn-more': 'learn+more+arrow+illustration',
  'manage': 'manage+settings+control+illustration',
  'view-all': 'view+all+arrow+illustration',
  'add': 'add+plus+create+illustration',
  'edit': 'edit+pencil+modify+illustration',
  'delete': 'delete+trash+remove+illustration',
  'save': 'save+check+confirm+illustration',
  'cancel': 'cancel+x+close+illustration',
  'search': 'search+magnifying+glass+illustration',
  'filter': 'filter+funnel+sort+illustration',
  'refresh': 'refresh+reload+update+illustration',
  'share': 'share+send+forward+illustration',
  'download': 'download+arrow+save+illustration',
  'upload': 'upload+arrow+send+illustration',
  'payment-process': 'payment+process+steps+illustration',
  'payment-success': 'payment+success+check+illustration',
  'payment-failed': 'payment+failed+error+illustration',
};

/**
 * Get expressive image URL for a category
 * Falls back to AI-generated Unsplash images if API fails
 * Uses caching to prevent redundant API calls
 */
export const getExpressiveImage = async (
  category: string,
  width: number = 400,
  height: number = 300
): Promise<string> => {
  const searchTerm = EXPRESSIVE_CATEGORIES[category] || category;
  
  // Check cache first
  const cached = await getCachedImage(searchTerm, width, height);
  if (cached) {
    return cached;
  }
  
  try {
    // Try to get from API first
    const response = await API.image.getImageByCategory(searchTerm, width, height);
    const data = (response as any).data || response;
    const imageUrl = data?.imageUrl || (data as any)?.imageUrl || (response as any)?.imageUrl;
    
    // Ensure we return a string, not a number
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      const url = ensureStringUri(imageUrl, '');
      // Cache the image
      await cacheImage(searchTerm, url, width, height);
      return url;
    }
  } catch (error) {
    // If it's a 429 rate limit error, try cache again or use fallback
    if ((error as any)?.response?.status === 429) {
      const cachedFallback = await getCachedImage(searchTerm, width, height);
      if (cachedFallback) {
        return cachedFallback;
      }
    }
    console.warn(`Failed to get image for category ${category}, using fallback`);
  }
  
  // Fallback to Pexels/Unsplash with expressive search term
  let fallbackUrl: string = '';
  
  // Try Pexels first (no API key needed for basic usage)
  try {
    const { getPexelsImage } = await import('./pexelsImageService');
    const pexelsImage = await getPexelsImage(searchTerm, width, height);
    if (pexelsImage && pexelsImage !== '') {
      fallbackUrl = ensureStringUri(pexelsImage, '');
      // Cache the fallback
      await cacheImage(searchTerm, fallbackUrl, width, height);
      return fallbackUrl;
    }
  } catch (error) {
    console.warn('Pexels service not available, using Unsplash');
  }
  
  // Fallback to Unsplash
  fallbackUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}`;
  const url = ensureStringUri(fallbackUrl, fallbackUrl);
  // Cache the fallback
  await cacheImage(searchTerm, url, width, height);
  return url;
};

/**
 * Get multiple expressive images at once
 * Uses caching to prevent redundant API calls
 */
export const getExpressiveImages = async (
  categories: string[],
  width: number = 400,
  height: number = 300
): Promise<Record<string, string>> => {
  const searchTerms = categories.map(cat => EXPRESSIVE_CATEGORIES[cat] || cat);
  
  // Check cache first
  const cached = await getCachedImages(searchTerms, width, height);
  const imagesMap: Record<string, string> = {};
  
  // Map cached search terms back to categories
  categories.forEach((category, index) => {
    const searchTerm = searchTerms[index];
    if (cached[searchTerm]) {
      imagesMap[category] = cached[searchTerm];
    }
  });
  
  // Find categories that are not cached
  const uncachedCategories = categories.filter(cat => !imagesMap[cat]);
  
  // If all are cached, return immediately
  if (uncachedCategories.length === 0) {
    return imagesMap;
  }
  
  try {
    const uncachedSearchTerms = uncachedCategories.map(cat => EXPRESSIVE_CATEGORIES[cat] || cat);
    const response = await API.image.getBatchImages(uncachedSearchTerms, width, height);
    
    const responseData = (response as any).data || response;
    const images = responseData?.images || responseData?.data || [];
    
    if (Array.isArray(images) && images.length > 0) {
      images.forEach((img: any, index: number) => {
        const category = uncachedCategories[index] || uncachedCategories[0];
        const searchTerm = uncachedSearchTerms[index];
        const imageUrl = img.imageUrl || img.url || '';
        // Ensure we store a string, not a number
        if (category && imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
          const url = ensureStringUri(imageUrl, '');
          imagesMap[category] = url;
          // Cache the image
          cacheImage(searchTerm, url, width, height);
        }
      });
    }
    
    // Fill missing categories
    for (const category of uncachedCategories) {
      if (!imagesMap[category] || typeof imagesMap[category] !== 'string') {
        const imageUrl = await getExpressiveImage(category, width, height);
        imagesMap[category] = ensureStringUri(imageUrl, `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(category)}`);
      } else {
        // Ensure existing value is a valid string
        const fallbackUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(category)}`;
        imagesMap[category] = ensureStringUri(imagesMap[category], fallbackUrl);
      }
    }
    
    return imagesMap;
  } catch (error) {
    // If it's a 429 rate limit error, use cached or fallback
    if ((error as any)?.response?.status === 429) {
      console.warn('Rate limit exceeded, using cached images or fallback');
      // Fill missing with fallback
      for (const category of uncachedCategories) {
        if (!imagesMap[category]) {
          const searchTerm = EXPRESSIVE_CATEGORIES[category] || category;
          const cachedFallback = await getCachedImage(searchTerm, width, height);
          if (cachedFallback) {
            imagesMap[category] = cachedFallback;
          } else {
            imagesMap[category] = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(searchTerm)}`;
          }
        }
      }
      return imagesMap;
    }
    
    console.warn('Failed to get batch images, using fallback');
    const fallbackMap: Record<string, string> = { ...imagesMap };
    for (const category of uncachedCategories) {
      if (!fallbackMap[category]) {
        const imageUrl = await getExpressiveImage(category, width, height);
        const fallbackUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(category)}`;
        fallbackMap[category] = ensureStringUri(imageUrl, fallbackUrl);
      }
    }
    return fallbackMap;
  }
};

/**
 * Get card image with specific dimensions
 */
export const getCardImage = async (
  cardType: string,
  width: number = 300,
  height: number = 200
): Promise<string> => {
  return getExpressiveImage(cardType, width, height);
};

/**
 * Get button icon image
 */
export const getButtonImage = async (
  buttonType: string,
  size: number = 24
): Promise<string> => {
  return getExpressiveImage(buttonType, size, size);
};

/**
 * Get empty state image
 */
export const getEmptyStateImage = async (
  stateType: string,
  size: number = 300
): Promise<string> => {
  return getExpressiveImage(stateType, size, size);
};

