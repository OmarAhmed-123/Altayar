/**
 * Helper functions to get images from open-source APIs
 * These APIs are free and don't require authentication
 * Optimized for fast loading with smaller image sizes
 */

/**
 * Get an icon image from UI Avatars API
 * @param name - The name or identifier for the icon
 * @param size - Size of the image (default: 100)
 * @param bgColor - Background color in hex without # (default: E60012 - Vodafone Red)
 * @param textColor - Text color in hex without # (default: FFFFFF - White)
 */
export const getUIAvatarIcon = (
  name: string,
  size: number = 100,
  bgColor: string = 'E60012',
  textColor: string = 'FFFFFF'
): string => {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${bgColor}&color=${textColor}&bold=true&format=png`;
};

/**
 * Get an icon image from Placeholder.com API
 * @param text - Text to display on the image
 * @param width - Width of the image (default: 100)
 * @param height - Height of the image (default: 100)
 * @param bgColor - Background color in hex without # (default: E60012)
 * @param textColor - Text color in hex without # (default: FFFFFF)
 */
export const getPlaceholderIcon = (
  text: string,
  width: number = 100,
  height: number = 100,
  bgColor: string = 'E60012',
  textColor: string = 'FFFFFF'
): string => {
  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
};

/**
 * Get a real image from Picsum Photos API (Free, no API key required)
 * Optimized with smaller sizes for faster loading
 * @param seed - A seed number to get the same image each time
 * @param width - Width of the image (optimized: 150 for services, 120 for actions)
 * @param height - Height of the image (optimized: 150 for services, 120 for actions)
 */
export const getPicsumImage = (
  seed: number,
  width: number = 150,
  height: number = 150
): string => {
  // Use smaller sizes for faster loading
  return `https://picsum.photos/seed/${seed}/${width}/${height}`;
};

/**
 * Get a real image from Lorem Picsum with specific category
 * Optimized for fast loading
 * @param category - Category keyword (e.g., 'flight', 'hotel', 'booking')
 * @param width - Width of the image (optimized: 150)
 * @param height - Height of the image (optimized: 150)
 */
export const getCategoryImage = (
  category: string,
  width: number = 150,
  height: number = 150
): string => {
  // Create consistent seed from category name
  const seed = category.split('').reduce((acc, char) => {
    const code = char.charCodeAt(0);
    return ((acc << 5) - acc) + code;
  }, 0);
  return `https://picsum.photos/seed/${Math.abs(seed)}/${width}/${height}`;
};

/**
 * Get an expressive real image based on category
 * Uses Picsum Photos API for high-quality real images
 * Optimized with smaller sizes for faster loading
 */
export const getExpressiveImage = (
  category: string,
  width: number = 150,
  height: number = 150
): string => {
  // Map categories to specific seeds for consistent, relevant images
  // Using optimized smaller sizes for faster loading
  const categorySeeds: Record<string, number> = {
    // Services - optimized for 150x150
    'flight': 1001,
    'hotel': 1002,
    'restaurant': 1003,
    'activity': 1004,
    // Quick Actions - optimized for 120x120
    'booking': 2001,
    'trip': 2002,
    'review': 2003,
    'profile': 2004,
    // Default
    'default': 1,
  };

  const seed = categorySeeds[category.toLowerCase()] || 
    category.split('').reduce((acc, char) => {
      const code = char.charCodeAt(0);
      return ((acc << 5) - acc) + code;
    }, 0);

  // Use smaller sizes for faster loading
  const optimizedWidth = width > 150 ? 150 : width;
  const optimizedHeight = height > 150 ? 150 : height;

  return `https://picsum.photos/seed/${Math.abs(seed)}/${optimizedWidth}/${optimizedHeight}`;
};

/**
 * Get an expressive icon image based on category
 * Uses a combination of APIs to get the best result
 */
export const getExpressiveIcon = (category: string, type: string = 'icon'): string => {
  const iconMap: { [key: string]: string } = {
    // Login/Register icons
    'login': getUIAvatarIcon('LOGIN', 100, 'E60012', 'FFFFFF'),
    'register': getUIAvatarIcon('REGISTER', 100, 'E60012', 'FFFFFF'),
    'email': getPlaceholderIcon('@', 100, 100, 'E60012', 'FFFFFF'),
    'password': getPlaceholderIcon('LOCK', 100, 100, 'E60012', 'FFFFFF'),
    'lock': getPlaceholderIcon('LOCK', 100, 100, 'E60012', 'FFFFFF'),
    'person': getUIAvatarIcon('USER', 100, 'E60012', 'FFFFFF'),
    'badge': getPlaceholderIcon('ID', 100, 100, 'E60012', 'FFFFFF'),
    'eye': getPlaceholderIcon('EYE', 100, 100, 'E60012', 'FFFFFF'),
    'eye-off': getPlaceholderIcon('HIDE', 100, 100, 'E60012', 'FFFFFF'),
    'error': getPlaceholderIcon('ERROR', 100, 100, 'FF0000', 'FFFFFF'),
    'success': getPlaceholderIcon('OK', 100, 100, '00FF00', 'FFFFFF'),
    'cancel': getPlaceholderIcon('X', 100, 100, 'FF0000', 'FFFFFF'),
  };

  return iconMap[category.toLowerCase()] || getUIAvatarIcon(category.toUpperCase(), 100, 'E60012', 'FFFFFF');
};
