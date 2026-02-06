import { Theme } from './../types';
import { Platform } from 'react-native';

export const lightTheme: Theme = {
  colors: {
    primary: '#0078D4', // ALTAYARVIP Blue (darker)
    secondary: '#00B2EE', // ALTAYARVIP Light Blue
    accent: '#FF6B35', // Orange
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#E0E0E0',
    error: '#E60012',
    success: '#00C853',
    warning: '#FF6B35',
    info: '#2196F3',
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

// API Base URL Configuration
// ==========================================
// Backend server is running on port 5000
// 
// For Android Emulator: Use '10.0.2.2' (automatically mapped to localhost)
// For Physical Device (USB connected): Use your computer's actual IP address
//
// To find your computer's IP address:
//   1. Open CMD or PowerShell
//   2. Run: ipconfig
//   3. Find "IPv4 Address" under your active network adapter (Wi-Fi or Ethernet)
//   4. Update COMPUTER_IP below with that IP (e.g., '192.168.1.100')
// ==========================================

const COMPUTER_IP = '192.168.1.2'; // Your computer's IP address (found via ipconfig - Wi-Fi adapter)
const BACKEND_PORT = 5000;
const API_PATH = '/api';

// Production Cloud Run URL
const PRODUCTION_API_URL = 'https://altayar-backend-kuwjte4rda-uc.a.run.app/api';

// Use 10.0.2.2 for emulator (maps to host localhost), or actual IP for physical device
const getBackendHost = () => {
  if (Platform.OS === 'android' && __DEV__) {
    // For Android physical device: use actual IP
    // For Android emulator: use 10.0.2.2 (automatically maps to host's localhost)
    // Since we're using a physical device, always use the computer IP
    return COMPUTER_IP;
  }
  // For iOS simulator, use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    return 'localhost';
  }
  return COMPUTER_IP;
};

// Use production URL in production, local URL in development
export const API_BASE_URL = __DEV__ 
  ? `http://${getBackendHost()}:${BACKEND_PORT}${API_PATH}`
  : PRODUCTION_API_URL;

// Log API configuration in development mode
if (__DEV__) {
  console.log('========================================');
  console.log('API Configuration:');
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Platform: ${Platform.OS}`);
  console.log(`Backend Host: ${getBackendHost()}`);
  console.log(`Port: ${BACKEND_PORT}`);
  console.log(`Path: ${API_PATH}`);
  console.log('========================================');
  console.log('⚠️  Make sure your backend server is running and accessible at this URL');
  console.log('========================================');
}
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