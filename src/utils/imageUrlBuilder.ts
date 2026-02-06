/**
 * Image URL Builder
 * Builds complete image URLs from backend responses
 * Handles both relative paths and full URLs
 */
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/theme';

const PRIVATE_HOST_REGEXES = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^\[?::1\]?$/i,
];

const isPrivateHostname = (hostname: string | null | undefined): boolean => {
  if (!hostname) {
    return false;
  }

  return PRIVATE_HOST_REGEXES.some((regex) => regex.test(hostname));
};

const sanitizeAbsoluteUrl = (absoluteUrl: string): string => {
  try {
    const parsed = new URL(absoluteUrl);
    if (isPrivateHostname(parsed.hostname)) {
      const baseUrl = getImageBaseUrl();
      const normalizedPath = stripTrailingSlashIfFilePath(
        parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`,
      );
      const rebuilt = `${baseUrl}${normalizedPath}`;
      return stripTrailingSlashIfFileUrl(rebuilt);
    }
    return stripTrailingSlashIfFileUrl(absoluteUrl);
  } catch {
    return stripTrailingSlashIfFileUrl(absoluteUrl);
  }
};

const stripTrailingSlashIfFilePath = (path: string): string => {
  if (!path || !path.endsWith('/')) {
    return path;
  }

  const trimmedPath = path.replace(/\/+$/, '');
  if (!trimmedPath) {
    return path;
  }

  const lastSegment = trimmedPath.split('/').pop();
  if (lastSegment && lastSegment.includes('.')) {
    return trimmedPath;
  }

  return path;
};

const stripTrailingSlashIfFileUrl = (value: string): string => {
  if (!value || !value.endsWith('/')) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const trimmedPath = stripTrailingSlashIfFilePath(parsed.pathname);
    if (trimmedPath !== parsed.pathname) {
      parsed.pathname = trimmedPath;
      return parsed.toString();
    }
    return value;
  } catch {
    return stripTrailingSlashIfFilePath(value);
  }
};

/**
 * Gets the base URL for images (without /api)
 */
export const getImageBaseUrl = (): string => {
  // Remove /api from API_BASE_URL to get the base server URL
  const baseUrl = API_BASE_URL.replace('/api', '');
  return baseUrl;
};

/**
 * Builds a complete image URL from a relative path or full URL
 * @param imagePath - Can be a relative path (e.g., '/uploads/profiles/image.jpg') or full URL
 * @returns Complete URL string
 */
export const buildImageUrl = (imagePath: string | null | undefined): string | null => {
  // Return null if no path provided
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return null;
  }

  const trimmedPath = imagePath.trim();

  // If it's already a full URL (http/https), sanitize if needed
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return sanitizeAbsoluteUrl(trimmedPath);
  }

  // If it's a file:// URI (local file), return as is
  if (trimmedPath.startsWith('file://')) {
    return trimmedPath;
  }

  // If it's a relative path, build full URL
  const baseUrl = getImageBaseUrl();
  
  // Ensure path starts with /
  const normalizedPath = stripTrailingSlashIfFilePath(
    trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`,
  );
  
  // Build full URL
  const fullUrl = `${baseUrl}${normalizedPath}`;
  
  return stripTrailingSlashIfFileUrl(fullUrl);
};

/**
 * Builds image URL for profile pictures
 * @param profilePictureUrl - Profile picture URL from backend
 * @returns Complete URL string or null
 */
export const buildProfilePictureUrl = (profilePictureUrl: string | null | undefined): string | null => {
  return buildImageUrl(profilePictureUrl);
};

/**
 * Builds image URL for uploaded files
 * @param filePath - File path from backend
 * @returns Complete URL string or null
 */
export const buildUploadedFileUrl = (filePath: string | null | undefined): string | null => {
  return buildImageUrl(filePath);
};

/**
 * Validates if a URL is accessible (basic validation)
 * @param url - URL to validate
 * @returns true if URL looks valid
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmedUrl = url.trim();
  
  // Check if it's a valid URL format
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    try {
      new URL(trimmedUrl);
      return true;
    } catch {
      return false;
    }
  }

  // Check if it's a local file
  if (trimmedUrl.startsWith('file://')) {
    return true;
  }

  // Check if it's a relative path
  if (trimmedUrl.startsWith('/')) {
    return true;
  }

  return false;
};

