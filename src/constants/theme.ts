import { Theme } from '../types';

export const lightTheme: Theme = {
  colors: {
    primary: '#6366F1', // Indigo
    secondary: '#EC4899', // Pink
    accent: '#F59E0B', // Amber
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: 'bold',
      lineHeight: 24,
    },
    h6: {
      fontSize: 16,
      fontWeight: 'bold',
      lineHeight: 20,
    },
    body1: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 16,
    },
  },
};

export const darkTheme: Theme = {
  colors: {
    primary: '#818CF8', // Light Indigo
    secondary: '#F472B6', // Light Pink
    accent: '#FBBF24', // Light Amber
    background: '#111827',
    surface: '#1F2937',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    border: '#374151',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: 'bold',
      lineHeight: 24,
    },
    h6: {
      fontSize: 16,
      fontWeight: 'bold',
      lineHeight: 20,
    },
    body1: {
      fontSize: 16,
      fontWeight: 'normal',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: 'normal',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
      lineHeight: 16,
    },
  },
};

// Use 10.0.2.2 for Android emulator to reach host machine's localhost
export const API_BASE_URL = 'http://10.0.2.2:5000/api';
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
  },
  PACKAGES: {
    LIST: '/packages',
    DETAIL: '/packages/:id',
  },
  BOOKINGS: {
    CREATE: '/bookings',
    MY_ACTIVITIES: '/bookings/myactivities',
    ADMIN: '/bookings/admin',
    UPDATE: '/bookings/:id',
  },
  MEMBERSHIPS: {
    LIST: '/memberships',
    DETAIL: '/memberships/:id',
  },
  REVIEWS: {
    PACKAGE: '/reviews/package/:packageId',
    CREATE: '/reviews',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
  },
  TRIPS: {
    LIST: '/trips',
    CREATE: '/trips',
    UPDATE: '/trips/:id',
    DELETE: '/trips/:id',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
  },
  RECOMMENDATIONS: {
    PERSONALIZED: '/recommendations/personalized',
    TRENDING: '/recommendations/trending',
    SIMILAR: '/recommendations/similar/:packageId',
  },
  OAUTH: {
    CONFIG: '/oauth/config',
    GOOGLE: '/oauth/google',
    APPLE: '/oauth/apple',
    TOKEN_EXCHANGE: '/oauth/token-exchange',
  },
  HEALTH: '/health',
};