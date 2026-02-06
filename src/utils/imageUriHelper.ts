/**
 * Image URI Helper
 * Ensures all image URIs are valid strings to prevent "Double to String" casting errors
 */

// Default fallback image path
const DEFAULT_FALLBACK_IMAGE = require('../assets/images/dsqd (3).png');

/**
 * Gets the default fallback image source
 * @returns The default fallback image require() result
 */
export const getDefaultFallbackImage = () => {
  return DEFAULT_FALLBACK_IMAGE;
};

/**
 * Ensures a value is a valid string URI for Image component
 * @param value - The value to convert to string URI
 * @param fallback - Optional fallback URL if value is invalid
 * @returns A valid string URI or empty string
 */
export const ensureStringUri = (value: any, fallback: string = ''): string => {
  // If value is null or undefined, return fallback or empty string
  if (value == null) {
    return fallback;
  }

  // If value is already a valid non-empty string, return it
  if (typeof value === 'string' && value.trim() !== '') {
    return value.trim();
  }

  // If value is a number, it's likely a require() result (local image)
  // In React Native, require() returns a number for local images
  // We should not use it as URI, return fallback instead
  if (typeof value === 'number') {
    // This is a local image require() result, not a URI
    // Return empty string to use fallback icon instead
    return '';
  }

  // If value is an object with uri property
  if (typeof value === 'object' && value !== null) {
    if (typeof value.uri === 'string' && value.uri.trim() !== '') {
      return value.uri.trim();
    }
    if (typeof value.url === 'string' && value.url.trim() !== '') {
      return value.url.trim();
    }
    if (typeof value.imageUrl === 'string' && value.imageUrl.trim() !== '') {
      return value.imageUrl.trim();
    }
  }

  // If value is boolean or other type, return fallback
  return fallback || '';
};

/**
 * Checks if a value is a valid URI string
 * @param value - The value to check
 * @returns true if value is a valid non-empty string
 */
export const isValidUri = (value: any): boolean => {
  return typeof value === 'string' && value.trim() !== '';
};

/**
 * Gets a safe image source object for React Native Image component
 * @param uri - The URI value (can be any type)
 * @param fallback - Optional fallback URL
 * @returns An object with uri property or null if invalid
 */
export const getSafeImageSource = (uri: any, fallback: string = ''): { uri: string } | null => {
  const safeUri = ensureStringUri(uri, fallback);
  if (safeUri) {
    return { uri: safeUri };
  }
  return null;
};

