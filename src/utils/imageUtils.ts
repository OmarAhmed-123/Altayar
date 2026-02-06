/**
 * Image Utilities
 * Helper functions for getting images from API
 */
import { imageService } from './../services/imageService';
import { ensureStringUri } from './imageUriHelper';

// Icon to category mapping for Unsplash API
const ICON_CATEGORY_MAP: Record<string, string> = {
  // Navigation
  'home': 'home+house',
  'book-online': 'booking+reservation',
  'route': 'trip+travel+route',
  'person': 'profile+user+person',
  'notifications': 'notification+bell+alert',
  
  // Services
  'flight': 'airplane+flight+travel',
  'hotel': 'hotel+resort+accommodation',
  'restaurant': 'restaurant+food+dining',
  'local-activity': 'activity+adventure+fun',
  
  // Actions
  'edit': 'edit+pencil+write',
  'card-membership': 'membership+card+vip',
  'star': 'review+rating+star',
  'settings': 'settings+gear+configuration',
  'help': 'help+support+question',
  'info': 'info+information+details',
  'search': 'search+magnifying+glass',
  'qr-code': 'qr+code+scan',
  'language': 'language+translate+globe',
  
  // Status
  'check-circle': 'success+check+done',
  'warning': 'warning+alert+caution',
  'error': 'error+wrong+failed',
  'schedule': 'time+clock+schedule',
  'calendar-today': 'calendar+date+event',
  'people': 'people+group+users',
  'place': 'location+place+map',
  'public': 'public+global+world',
  'lock': 'private+lock+secure',
  'verified': 'verified+check+approved',
  'chevron-right': 'arrow+right+next',
  'add': 'add+plus+new',
  'menu': 'menu+hamburger+list',
  'mail': 'mail+email+message',
  'local-offer': 'offer+discount+tag',
  'weekend': 'weekend+holiday+vacation',
  'percent': 'percent+discount+coupon',
  'wallet': 'wallet+money+payment',
};

/**
 * Get image URL for an icon
 */
export const getIconImageUrl = async (
  iconName: string,
  width: number = 40,
  height: number = 40
): Promise<string> => {
  try {
    const category = ICON_CATEGORY_MAP[iconName] || iconName;
    const imageUrl = await imageService.getImageUrl(category, width, height);
    // Ensure we return a string, not a number
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      return imageUrl;
    }
  } catch (error) {
    console.error(`Error getting image for icon ${iconName}:`, error);
  }
  // Fallback to Unsplash
  const fallbackUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(iconName)}`;
  return ensureStringUri(fallbackUrl, fallbackUrl);
};

/**
 * Get multiple icon image URLs
 */
export const getIconImageUrls = async (
  iconNames: string[],
  width: number = 40,
  height: number = 40
): Promise<Record<string, string>> => {
  try {
    const categories = iconNames.map(name => ICON_CATEGORY_MAP[name] || name);
    const images = await imageService.getImageUrls(categories, width, height);
    
    // Map back to icon names and ensure all values are strings
    const result: Record<string, string> = {};
    iconNames.forEach((iconName, index) => {
      const category = categories[index];
      const imageUrl = images[category];
      const fallbackUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(category)}`;
      // Ensure we store a string, not a number
      result[iconName] = ensureStringUri(imageUrl, fallbackUrl);
    });
    
    return result;
  } catch (error) {
    console.error('Error getting batch icon images:', error);
    const fallback: Record<string, string> = {};
    iconNames.forEach(iconName => {
      const category = ICON_CATEGORY_MAP[iconName] || iconName;
      fallback[iconName] = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(category)}`;
    });
    return fallback;
  }
};

/**
 * Get empty state image
 */
export const getEmptyStateImage = async (category: string = 'empty'): Promise<string> => {
  try {
    const imageUrl = await imageService.getImageUrl(category, 200, 200);
    return ensureStringUri(imageUrl, `https://source.unsplash.com/200x200/?empty+${encodeURIComponent(category)}`);
  } catch (error) {
    const fallbackUrl = `https://source.unsplash.com/200x200/?empty+${encodeURIComponent(category)}`;
    return ensureStringUri(fallbackUrl, fallbackUrl);
  }
};

