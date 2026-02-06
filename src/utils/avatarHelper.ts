import { User } from '../types';

/**
 * Builds a fallback avatar URL using ui-avatars service.
 * @param user User object containing name fields
 * @param primaryColor Hex color (with or without #) for background
 * @param size Avatar size in px
 */
export const getFallbackAvatarUri = (
  user?: Partial<User> | null,
  primaryColor: string = '#0078D4',
  size: number = 120
): string => {
  const baseName =
    user?.name ||
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
    'User';

  const encodedName = encodeURIComponent(baseName || 'User');
  const sanitizedColor = primaryColor.replace('#', '') || '0078D4';

  return `https://ui-avatars.com/api/?name=${encodedName}&size=${size}&background=${sanitizedColor}&color=FFFFFF&bold=true`;
};

/**
 * Resolves the avatar URL to display, falling back to ui-avatars when needed.
 * Treats temporary placeholder sources (e.g. source.unsplash.com) as invalid.
 */
export const resolveUserAvatarUri = (
  avatar: string | null | undefined,
  fallbackUri: string
): string => {
  if (
    avatar &&
    avatar.trim() !== '' &&
    !avatar.includes('source.unsplash.com')
  ) {
    return avatar;
  }
  return fallbackUri;
};


