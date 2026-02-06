/**
 * Unified API Client
 * ==========================================
 * This file contains all API endpoints and methods for the application.
 * All services should use this client to ensure consistency and proper error handling.
 * ==========================================
 */

import axios, { AxiosInstance, AxiosError, AxiosProgressEvent } from 'axios';
import { Buffer } from 'buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  getCachedRequest, 
  cacheRequest, 
  getCacheDuration,
  shouldCacheRequest,
  cache404Response
} from './requestCache';
import { API_BASE_URL } from '../constants/theme';

// ==========================================
// Types & Interfaces
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'customer' | 'admin' | 'super_admin' | 'hr' | 'sales' | 'reservations' | 'data_entry' | 'accountant';
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role?: 'super_admin' | 'admin' | 'hr' | 'sales' | 'reservations' | 'data_entry' | 'accountant' | 'agent' | 'support' | 'customer';
  profilePictureUrl?: string;
  points?: number;
  cashback?: number;
  created_at?: string;
  updated_at?: string;
  is_super_admin?: boolean;
  isSuperAdmin?: boolean;
  created_by?: number | null;
}

export interface Package {
  id: number;
  title: string;
  description: string;
  price: number;
  duration?: number;
  location?: string;
  imageUrl?: string;
  category?: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: number;
  userId: number;
  packageId: number;
  bookingType: string;
  status: string;
  totalPrice: number;
  participants?: number;
  startDate?: string;
  endDate?: string;
  specialRequests?: string;
  details?: any;
  created_at?: string;
  updated_at?: string;
}

export interface Membership {
  id: number;
  name: string;
  description: string;
  price: number;
  benefits?: string[];
  duration?: number;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: number;
  userId: number;
  packageId: number;
  rating: number;
  comment: string;
  is_verified?: boolean;
  is_featured?: boolean;
  helpful_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Trip {
  id: number;
  userId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  destinations?: string[];
  isPublic?: boolean;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Voucher {
  id: number;
  user_id: number;
  code: string;
  type: 'dinner' | 'breakfast' | 'spa' | 'gym' | 'dental_cleaning' | 'makeup' | 'manual_gift';
  value: number;
  description?: string;
  issued_by?: number;
  expires_at?: string;
  is_used: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: 'membership_purchase' | 'booking_payment' | 'cashback_earned' | 'points_spent' | 'manual_deposit' | 'invoice_payment';
  amount: number;
  points_change: number;
  cashback_change: number;
  related_booking_id?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  totalPackages: number;
  activeMemberships: number;
  pendingBookings: number;
  monthlyRevenue: number;
  userGrowth: number;
}

export type ApiPayload<T = any> =
  | T
  | null
  | undefined
  | {
      success?: boolean;
      data?: T | null;
      message?: string;
      error?: string;
    };

// ==========================================
// Create Axios Instance with Interceptors
// ==========================================

const createApiClient = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 180000, // 180 seconds (3 minutes) timeout for large file uploads
    validateStatus: (status) => {
      // Don't throw error for status codes < 500
      return status < 500;
    },
      // Custom adapter to handle cached responses
      adapter: async (config) => {
        // CRITICAL FIX: Skip cache for POST/PUT/PATCH requests with FormData
        // FormData requests should never be cached
        const isFormData = config.data instanceof FormData;
        const method = config.method?.toUpperCase() || 'GET';
        const isModifyingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        
        // For FormData or modifying requests, skip cache and use default adapter
        if (isFormData || isModifyingRequest) {
          if (__DEV__ && isFormData) {
            console.log('[API Adapter] FormData detected - skipping cache, using default adapter');
          }
          // CRITICAL FIX: Create a fresh axios instance without custom adapter
          // This ensures we use the default adapter (XMLHttpRequest in React Native)
          const axiosInstance = axios.create({
            baseURL: config.baseURL || API_BASE_URL,
            timeout: config.timeout || 180000,
            headers: config.headers || {},
            // Don't set adapter - let axios use default
          });
          
          // Make request with the fresh instance
          return axiosInstance.request({
            ...config,
            adapter: undefined, // Explicitly remove adapter to use default
          });
        }
        
        // Check for cached response first (only for GET requests)
        const url = config.url || '';
        
        if (shouldCacheRequest(method, url)) {
          const cached = getCachedRequest(method, url, config.data, getCacheDuration(url));
          if (cached !== null && !cached.is404) {
            // Return cached response directly
            if (__DEV__) {
              console.log(`[API Cache Hit] ${method} ${url}`);
            }
            return Promise.resolve({
              data: cached.data,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
              __CACHED_RESPONSE__: true,
            } as any);
          }
          
          // Handle cached 404
          if (cached?.is404) {
            return Promise.reject({
              response: {
                status: 404,
                statusText: 'Not Found',
                data: cached.data,
                headers: {},
              },
              config,
              __CACHED_404__: true,
            } as any);
          }
        }
        
        // No cache found, proceed with normal axios request
        // CRITICAL FIX: Create a fresh axios instance without custom adapter
        // This ensures we use the default adapter (XMLHttpRequest in React Native)
        const axiosInstance = axios.create({
          baseURL: config.baseURL || API_BASE_URL,
          timeout: config.timeout || 180000,
          headers: config.headers || {},
          // Don't set adapter - let axios use default
        });
        
        // Make request with the fresh instance
        return axiosInstance.request({
          ...config,
          adapter: undefined, // Explicitly remove adapter to use default
        });
      },
  });

  // Request Interceptor: Add token, check cache, and log requests
  api.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('[API Client] Error getting token from storage:', error);
      }

      // CRITICAL FIX: Handle FormData properly for React Native
      // React Native FormData needs special handling
      if (config.data instanceof FormData) {
        // For FormData, don't set Content-Type - let axios/browser set it with boundary
        // React Native's FormData implementation handles this automatically
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
        
        // CRITICAL: Increase timeout for file uploads
        if (!config.timeout || config.timeout < 180000) {
          config.timeout = 180000; // 3 minutes for large file uploads
        }
        
        // CRITICAL: Ensure adapter is not set (let axios use default)
        // Setting adapter manually causes "defaultAdapter is not a function" error
        if (config.adapter) {
          delete config.adapter;
        }
        
        // Ensure proper headers for multipart/form-data
        if (__DEV__) {
          console.log('[API Request] FormData detected:', {
            url: config.url,
            hasFile: true,
            timeout: config.timeout,
            headers: Object.keys(config.headers),
            baseURL: config.baseURL,
            adapter: config.adapter || 'default (not set)',
          });
        }
      }

      // Cache checking is now handled in the adapter
      // No need to check here

      // Log API calls in development mode
      if (__DEV__) {
        const method = config.method?.toUpperCase() || 'GET';
        const url = config.url || '';
        const isFormData = config.data instanceof FormData;
        console.log(
          `[API Request] ${method} ${config.baseURL}${url}`,
          isFormData 
            ? { type: 'FormData', hasFile: true }
            : config.data ? { data: typeof config.data === 'object' ? Object.keys(config.data) : 'data' } : ''
        );
      }

      return config;
    },
    (error) => {
      // Handle cached 404 response
      if (error?.__CACHED_404__) {
        return Promise.reject({
          response: error.response,
          config: error.config,
        } as AxiosError);
      }
      
      // Other request errors (not cached responses - those are handled above)
      if (error?.__CACHED_RESPONSE__) {
        // This shouldn't happen, but handle it just in case
        return Promise.resolve({
          data: error.data,
          status: error.status || 200,
          statusText: error.statusText || 'OK',
          headers: error.headers || {},
          config: error.config,
        });
      }
      
      console.error('[API Request Error]', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor: Handle errors, cache responses, and log responses
  api.interceptors.response.use(
    (response) => {
      // Handle cached responses - don't cache them again, just log and return
      const responseAny = response as any;
      if (responseAny?.__CACHED_RESPONSE__) {
        if (__DEV__) {
          const method = response.config?.method?.toUpperCase() || 'GET';
          const url = response.config?.url || '';
          console.log(`[API Cache Hit] ${method} ${url} - Using cached data`);
        }
        // Remove the flag before returning
        const { __CACHED_RESPONSE__: _discardedCachedFlag, ...cleanResponse } = responseAny;
        return cleanResponse;
      }
      
      // Cache successful GET responses (only non-cached ones)
      const method = response.config.method?.toUpperCase() || 'GET';
      const url = response.config.url || '';
      
      if (shouldCacheRequest(method, url) && response.status === 200) {
        const cacheDuration = getCacheDuration(url);
        cacheRequest(method, url, response.config.data, response.data, cacheDuration);
      }
      
      // Log successful responses in development mode
      if (__DEV__) {
        console.log(
          `[API Response] ${method} ${url} - Status: ${response.status}`
        );
      }
      return response;
    },
    async (error: AxiosError | any) => {
      // Handle cached responses - these are not real errors
      if (error?.__CACHED_RESPONSE__) {
        return Promise.resolve({
          data: error.data,
          status: error.status || 200,
          statusText: error.statusText || 'OK',
          headers: error.headers || {},
          config: error.config,
        });
      }

      // Handle cached 404 responses
      if (error?.__CACHED_404__) {
        return Promise.reject({
          response: error.response,
          config: error.config,
        } as AxiosError);
      }

      const originalRequest = error.config;

      // Log errors in development mode (only for real errors)
      if (__DEV__ && !error?.__CACHED_RESPONSE__ && !error?.__CACHED_404__) {
        const url = originalRequest
          ? `${originalRequest.baseURL}${originalRequest.url}`
          : 'Unknown URL';
        console.error(
          `[API Error] ${error.config?.method?.toUpperCase()} ${url}`,
          {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          }
        );
      }

      // Handle 404 Not Found - cache to prevent repeated requests
      if (error.response?.status === 404) {
        const method = originalRequest?.method?.toUpperCase() || 'GET';
        const url = originalRequest?.url || '';
        
        // Cache 404 responses for endpoints that might not exist (like membership card)
        if (shouldCacheRequest(method, url) && url.includes('/memberships/card/my')) {
          cache404Response(method, url, originalRequest?.data);
          if (__DEV__) {
            console.log(`[API Client] Cached 404 for ${method} ${url} to prevent repeated requests`);
          }
        }
      }

      // CRITICAL: Handle Network Errors with better error messages
      // CRITICAL FIX: Don't treat ERR_CANCELED as a network error - it's usually intentional
      if ((error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) && 
          error.code !== 'ERR_CANCELED') {
        // Network error - server unreachable or connection failed
        const url = originalRequest
          ? `${originalRequest.baseURL}${originalRequest.url}`
          : 'Unknown URL';
        
        if (__DEV__) {
          console.error('[API Network Error] Unable to reach server.', {
            url: url,
            errorCode: error.code,
            errorMessage: error.message,
            baseURL: API_BASE_URL,
            timestamp: new Date().toISOString()
          });
        }
        
        // Return a more descriptive error
        return Promise.reject({
          ...error,
          response: {
            status: undefined,
            statusText: undefined,
            data: {
              success: false,
              message: 'Network Error - Unable to reach server. Please check your connection and try again.',
              error: 'ERR_NETWORK',
              url: url
            }
          },
          message: 'Network Error - Unable to reach server. Please check your connection and try again.'
        });
      }
      
      // CRITICAL FIX: Handle ERR_CANCELED gracefully - don't show error, just return silently
      if (error.code === 'ERR_CANCELED') {
        if (__DEV__) {
          console.log('[API Client] Request canceled:', originalRequest?.url);
        }
        // Return a canceled error that won't trigger error handlers
        return Promise.reject({
          ...error,
          __CANCELED__: true, // Mark as canceled
          response: {
            status: undefined,
            statusText: undefined,
            data: {
              success: false,
              message: 'Request canceled',
              error: 'ERR_CANCELED'
            }
          },
          message: 'Request canceled'
        });
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (error.response?.status === 401) {
        // For login/register endpoints, don't clear token (user is trying to authenticate)
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || 
                               originalRequest?.url?.includes('/auth/register');
        
        // Don't clear token for /auth/me if it's the first load (might be expected)
        const isAuthMe = originalRequest?.url?.includes('/auth/me');
        
        // CRITICAL: Don't clear token for video/media requests - they might be public
        const isMediaRequest = originalRequest?.url?.includes('/uploads/') || 
                               originalRequest?.url?.includes('/media/') ||
                               originalRequest?.url?.match(/\.(mp4|mov|avi|webm|m4v|3gp|mkv|jpg|jpeg|png|gif|webp)$/i);
        
        if (!isAuthEndpoint && !isAuthMe && !isMediaRequest) {
          // For protected endpoints, clear token and let auth store handle redirect
          try {
            await AsyncStorage.removeItem('token');
            if (__DEV__) {
              console.warn('[API Client] 401 Unauthorized - Token cleared');
            }
          } catch (storageError) {
            console.error('[API Client] Error removing token:', storageError);
          }
        } else if (isAuthMe && __DEV__) {
          // For /auth/me, this might be expected on first load
          console.log('[API Client] 401 on /auth/me - User may not be authenticated yet');
        }
      }

      // Handle 429 Too Many Requests - Rate Limit Exceeded
      if (error.response?.status === 429) {
        // Type-safe access to error response data
        const errorData = error.response?.data as {
          retryAfter?: number;
          limit?: number;
          remaining?: number;
          message?: string;
        } | undefined;
        
        const retryAfter = errorData?.retryAfter || 15; // Default 15 seconds
        const isAuthRequest = originalRequest?.url?.includes('/auth/login') || 
                             originalRequest?.url?.includes('/auth/register');
        
        if (__DEV__) {
          console.warn(
            `[API Client] 429 Rate Limit Exceeded - Retry after ${retryAfter} seconds`,
            {
              url: originalRequest?.url,
              limit: errorData?.limit,
              remaining: errorData?.remaining,
              isAuthRequest,
            }
          );
        }

        // For image requests, silently fail (don't show error to user)
        const isImageRequest = originalRequest?.url?.includes('/images/');
        if (isImageRequest) {
          // Return a mock response to prevent app crash
          return Promise.resolve({
            data: { success: false, message: 'Rate limit exceeded, please wait' },
            status: 429,
            statusText: 'Too Many Requests',
            headers: error.response?.headers || {},
            config: originalRequest || {},
          });
        }

        // For auth requests, provide a user-friendly error message
        if (isAuthRequest) {
          const errorMessage = errorData?.message || 
                              `تم إرسال طلبات كثيرة. يرجى المحاولة مرة أخرى بعد ${retryAfter} ثانية`;
          
          // Return error with Arabic message for auth endpoints
          return Promise.reject({
            ...error,
            response: {
              ...error.response,
              data: {
                success: false,
                message: errorMessage,
                retryAfter,
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          });
        }

        // For other requests, return the error but don't trigger refresh
        // The error will be handled by the calling component
      }

      // Handle network errors - provide detailed diagnostics
      if (!error.response && !error?.__CACHED_RESPONSE__) {
        // Network error - backend might not be available
        // Only log if it's not a cached response and not a 401 that we're handling
        const isAuthMe = originalRequest?.url?.includes('/auth/me');
        const shouldLog = !isAuthMe || error.code !== 'ECONNREFUSED';
        
        if (__DEV__ && shouldLog) {
          const errorDetails = {
            code: error.code,
            message: error.message,
            hostname: originalRequest?.baseURL?.replace(/^https?:\/\//, '').split('/')[0],
            url: originalRequest ? `${originalRequest.baseURL}${originalRequest.url}` : 'Unknown',
          };
          
          // Only show detailed error for non-auth endpoints or if it's a real connection issue
          if (!isAuthMe) {
            // Extract IP from API_BASE_URL for better error messages
            const urlMatch = API_BASE_URL.match(/http:\/\/([^:]+):(\d+)/);
            const backendIP = urlMatch ? urlMatch[1] : '192.168.1.2';
            const backendPort = urlMatch ? urlMatch[2] : '5000';
            
            console.error(
              '[API Network Error]',
              'Unable to reach server.',
              `\nBackend URL: ${API_BASE_URL}`,
              `\nError Code: ${error.code || 'UNKNOWN'}`,
              `\nError Message: ${error.message || 'Network error'}`,
              `\n\nTroubleshooting:`,
              `\n1. Make sure backend server is running:`,
              `   cd E:\\Altayar-app\\Altayar-app-final\\backend && npm start`,
              `\n2. Check if backend is accessible:`,
              `   curl http://${backendIP}:${backendPort}/api/health`,
              `   or open in browser: http://${backendIP}:${backendPort}/api/health`,
              `\n3. Verify IP address matches your computer's IP:`,
              `   - Run: ipconfig (Windows) or ifconfig (Mac/Linux)`,
              `   - Find IPv4 Address under your active network adapter`,
              `   - Update COMPUTER_IP in src/constants/theme.ts if different`,
              `\n4. Check firewall settings:`,
              `   - Port ${backendPort} should be open`,
              `   - Windows Firewall: Allow Node.js through firewall`,
              `\n5. Ensure device is on the same network as your computer`,
              `\n6. Try restarting the backend server`,
              `\n\nFull Error:`,
              errorDetails
            );
          }
        }
      }

      // Enhance error object with response data for easier handling
      if (error.response?.data) {
        (error as any).responseData = error.response.data;
      }

      return Promise.reject(error);
    }
  );

  return api;
};

// Export the default API client instance
export const apiClient = createApiClient();

// ==========================================
// API Services - All endpoints in one place
// ==========================================

/**
 * Authentication APIs
 */
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<any> => {
    const response = await apiClient.post('/auth/login', credentials);
    // Backend returns: { id, name, email, role, token, ... }
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<any> => {
    const response = await apiClient.post('/auth/register', userData);
    // Backend returns: { id, name, email, role, token, ... }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
  },

  getCurrentUser: async (): Promise<any> => {
    // Backend has /api/profile endpoint, but we use /api/auth/me for consistency
    // CRITICAL: Add retry logic for network errors with improved error handling
    let lastError: any = null;
    const maxRetries = 3;
    const timeout = 15000; // 15 seconds timeout (increased from 10)
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // CRITICAL: Use AbortController for better timeout control
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await apiClient.get('/auth/me', {
            timeout: timeout,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          // Backend returns user data directly
          return response.data;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error: any) {
        lastError = error;
        
        // CRITICAL: Check if error is abort/timeout
        if (error.name === 'AbortError' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          if (attempt < maxRetries) {
            const waitTime = 1000 * attempt; // Exponential backoff: 1s, 2s, 3s
            if (__DEV__) {
              console.warn(`[Auth API] Timeout on attempt ${attempt}/${maxRetries}, retrying in ${waitTime}ms...`);
            }
            await new Promise<void>(resolve => setTimeout(() => resolve(), waitTime));
            continue;
          } else {
            // All retries failed due to timeout
            throw new Error('انتهت مهلة الاتصال. يرجى التحقق من اتصال الإنترنت أو محاولة لاحقاً.');
          }
        }
        
        // Only retry on network errors, not on auth errors (401, 403)
        if (
          (error.code === 'ERR_NETWORK' || 
           error.message === 'Network Error' || 
           !error.response) && 
          attempt < maxRetries
        ) {
          const waitTime = 1000 * attempt; // Exponential backoff: 1s, 2s, 3s
          if (__DEV__) {
            console.warn(`[Auth API] Network error on attempt ${attempt}/${maxRetries}, retrying in ${waitTime}ms...`);
          }
          await new Promise<void>(resolve => setTimeout(() => resolve(), waitTime));
          continue;
        }
        
        // For auth errors (401, 403), don't retry - just throw
        if (error.response?.status === 401 || error.response?.status === 403) {
          await AsyncStorage.removeItem('token'); // Clear invalid token
          throw new Error('غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.');
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // If all retries failed, throw the last error with user-friendly message
    if (lastError?.code === 'ERR_NETWORK' || lastError?.message === 'Network Error') {
      throw new Error('خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت.');
    }
    throw lastError;
  },

  updateProfile: async (userData: Partial<User> & { firstName?: string; lastName?: string }, imageUri?: string): Promise<any> => {
    try {
      // If image is provided, use FormData for multipart/form-data
      if (imageUri) {
        const formData = new FormData();
        if (userData.name) formData.append('name', userData.name);
        if (userData.email) formData.append('email', userData.email);
        if (userData.phone !== undefined) formData.append('phone', userData.phone || '');
        if ((userData as any).firstName) formData.append('firstName', (userData as any).firstName);
        if ((userData as any).lastName) formData.append('lastName', (userData as any).lastName);
        
        // Add image file
        // Handle both file:// URIs and regular paths
        let fileUri = imageUri;
        if (fileUri.startsWith('file://')) {
          // For Android, keep file:// prefix, for iOS remove it
          if (Platform.OS === 'ios') {
            fileUri = fileUri.replace('file://', '');
          }
        }
        
        const filename = imageUri.split('/').pop() || 'profile.jpg';
        // Determine MIME type from filename extension
        let mimeType = 'image/jpeg';
        if (filename.toLowerCase().endsWith('.png')) {
          mimeType = 'image/png';
        } else if (filename.toLowerCase().endsWith('.gif')) {
          mimeType = 'image/gif';
        } else if (filename.toLowerCase().endsWith('.webp')) {
          mimeType = 'image/webp';
        }
        
        formData.append('profilePicture', {
          uri: fileUri,
          type: mimeType,
          name: filename,
        } as any);

        const response = await apiClient.put('/profile', formData, {
          headers: {
            'Content-Type': undefined, // Let axios set it automatically with boundary
          },
          timeout: 30000, // 30 seconds timeout
        });
        return response.data;
      } else {
        // Regular JSON update
        const response = await apiClient.put('/profile', userData, {
          timeout: 30000, // 30 seconds timeout
        });
        return response.data;
      }
    } catch (error: any) {
      // Enhanced error handling
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى');
      } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
        throw new Error('خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت');
      } else if (error.response?.status === 500) {
        throw new Error('خطأ في السيرفر. يرجى المحاولة مرة أخرى');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw error;
      }
    }
  },
};

/**
 * User Management APIs
 */
export const userAPI = {
  getUsers: async (params?: { role?: string; search?: string; page?: number }): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get('/users', {
      params: params && Object.keys(params).length > 0 ? params : undefined,
    });
    return response.data;
  },

  getUserById: async (id: number): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: number, userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/users/profile', userData);
    return response.data;
  },

  addManualGift: async (
    id: number,
    giftData: {
      points?: number;
      cashback?: number;
      voucherType?: string;
      description?: string;
    }
  ): Promise<ApiResponse<{ message: string; user: User }>> => {
    const response = await apiClient.post(`/users/gift/${id}`, giftData);
    return response.data;
  },
};

/**
 * Package APIs
 */
export const packageAPI = {
  getPackages: async (): Promise<ApiResponse<Package[]>> => {
    const response = await apiClient.get('/packages');
    return response.data;
  },

  getPackageById: async (id: string | number): Promise<ApiResponse<Package>> => {
    const response = await apiClient.get(`/packages/${id}`);
    return response.data;
  },

  createPackage: async (packageData: Partial<Package>): Promise<ApiResponse<Package>> => {
    const response = await apiClient.post('/packages', packageData);
    return response.data;
  },

  updatePackage: async (id: string, packageData: Partial<Package>): Promise<ApiResponse<Package>> => {
    const response = await apiClient.put(`/packages/${id}`, packageData);
    return response.data;
  },

  deletePackage: async (id: string): Promise<void> => {
    await apiClient.delete(`/packages/${id}`);
  },
};

/**
 * Booking APIs
 */
export const bookingAPI = {
  createBooking: async (bookingData: {
    packageId?: string;
    participants: number;
    startDate: string;
    endDate: string;
    specialRequests?: string;
    totalPrice?: number;
    images?: string[]; // Array of image URIs
    bookingType?: 'tour' | 'nile_cruise' | 'flight_ticket' | 'hotel_booking' | 'transfer' | 'nile_trip' | 'general_tour';
  }): Promise<ApiResponse<Booking>> => {
    // Transform frontend format to backend format
    const backendData = {
      bookingType: bookingData.bookingType || 'general_tour',
      details: {
        ...(bookingData.packageId && { packageId: parseInt(bookingData.packageId) }),
        participants: bookingData.participants,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        specialRequests: bookingData.specialRequests,
      },
      totalPrice: bookingData.totalPrice || 0,
    };

    // If images are provided, use FormData
    if (bookingData.images && bookingData.images.length > 0) {
      const formData = new FormData();
      formData.append('bookingType', backendData.bookingType);
      formData.append('totalPrice', backendData.totalPrice.toString());
      formData.append('details', JSON.stringify(backendData.details));
      
      // Add images
      bookingData.images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `booking-image-${index}.jpg`;
        const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        formData.append('images', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          type: mimeType,
          name: filename,
        } as any);
      });

      const response = await apiClient.post('/bookings', formData, {
        headers: {
          'Content-Type': undefined, // Let axios set it automatically with boundary
        },
      });
      return response.data;
    } else {
      // Regular JSON request
      const response = await apiClient.post('/bookings', backendData);
      return response.data;
    }
  },

  getMyBookings: async (): Promise<ApiResponse<Booking[]>> => {
    const response = await apiClient.get('/bookings/myactivities');
    return response.data;
  },

  getAllBookings: async (): Promise<ApiResponse<Booking[]>> => {
    const response = await apiClient.get('/bookings/admin');
    return response.data;
  },

  getBookingById: async (id: string): Promise<ApiResponse<Booking>> => {
    const response = await apiClient.get(`/bookings/${id}`);
    return response.data;
  },

  updateBookingStatus: async (id: string, status: string): Promise<ApiResponse<Booking>> => {
    const response = await apiClient.put(`/bookings/${id}`, { status });
    return response.data;
  },

  cancelBooking: async (id: string): Promise<void> => {
    await apiClient.put(`/bookings/${id}`, { status: 'cancelled' });
  },
};

/**
 * Membership APIs
 */
export const membershipAPI = {
  getMemberships: async (): Promise<ApiResponse<Membership[]>> => {
    const response = await apiClient.get('/memberships');
    return response.data;
  },

  getMembershipById: async (id: string): Promise<ApiResponse<Membership>> => {
    const response = await apiClient.get(`/memberships/${id}`);
    return response.data;
  },

  getMyMembershipCard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/memberships/card/my');
    return response.data;
  },

  subscribeToMembership: async (membershipId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/memberships/subscribe', { membershipId });
    return response.data;
  },

  downloadMembershipPDF: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/memberships/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  createMembership: async (membershipData: Partial<Membership>): Promise<ApiResponse<Membership>> => {
    const response = await apiClient.post('/memberships', membershipData);
    return response.data;
  },

  updateMembership: async (id: string, membershipData: Partial<Membership>): Promise<ApiResponse<Membership>> => {
    const response = await apiClient.put(`/memberships/${id}`, membershipData);
    return response.data;
  },

  deleteMembership: async (id: string): Promise<void> => {
    await apiClient.delete(`/memberships/${id}`);
  },
};

/**
 * Review APIs
 */
export const reviewAPI = {
  getPackageReviews: async (packageId: string): Promise<ApiResponse<{ reviews: Review[]; stats: any; pagination: any }>> => {
    const response = await apiClient.get(`/reviews/package/${packageId}`);
    return response.data;
  },

  getMyReviews: async (): Promise<ApiResponse<Review[]>> => {
    const response = await apiClient.get('/reviews/my');
    return response.data;
  },

  createReview: async (packageId: string, reviewData: { rating: number; comment: string }): Promise<ApiResponse<Review>> => {
    const response = await apiClient.post(`/reviews/package/${packageId}`, reviewData);
    return response.data;
  },

  updateReview: async (reviewId: string, reviewData: { rating?: number; comment?: string }): Promise<ApiResponse<Review>> => {
    const response = await apiClient.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  markReviewHelpfulness: async (reviewId: string, isHelpful: boolean = true): Promise<void> => {
    await apiClient.post(`/reviews/${reviewId}/helpfulness`, { isHelpful });
  },

  getAllReviews: async (): Promise<ApiResponse<Review[]>> => {
    const response = await apiClient.get('/reviews/admin');
    return response.data;
  },

  getReviewStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/reviews/statistics');
    return response.data;
  },

  verifyReview: async (reviewId: string): Promise<ApiResponse<Review>> => {
    const response = await apiClient.put(`/reviews/${reviewId}/verify`);
    return response.data;
  },

  featureReview: async (reviewId: string): Promise<ApiResponse<Review>> => {
    const response = await apiClient.put(`/reviews/${reviewId}/feature`);
    return response.data;
  },
};

/**
 * Trip APIs
 */
export const tripAPI = {
  getMyTrips: async (): Promise<ApiResponse<Trip[]>> => {
    const response = await apiClient.get('/trips/my');
    return response.data;
  },

  getAllTrips: async (): Promise<ApiResponse<Trip[]>> => {
    const response = await apiClient.get('/trips/admin');
    return response.data;
  },

  createTrip: async (tripData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    destinations: string[];
    isPublic: boolean;
    images?: string[]; // Array of image URIs
  }): Promise<ApiResponse<Trip>> => {
    // If images are provided, use FormData
    if (tripData.images && tripData.images.length > 0) {
      const formData = new FormData();
      formData.append('title', tripData.title);
      formData.append('description', tripData.description);
      formData.append('startDate', tripData.startDate);
      formData.append('endDate', tripData.endDate);
      formData.append('isPublic', tripData.isPublic.toString());
      formData.append('destinations', JSON.stringify(tripData.destinations));
      
      // Add images
      tripData.images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `trip-image-${index}.jpg`;
        const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        formData.append('images', {
          uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
          type: mimeType,
          name: filename,
        } as any);
      });

      const response = await apiClient.post('/trips', formData, {
        headers: {
          'Content-Type': undefined, // Let axios set it automatically with boundary
        },
      });
      return response.data;
    } else {
      // Regular JSON request
      const response = await apiClient.post('/trips', tripData);
      return response.data;
    }
  },

  updateTrip: async (id: string, tripData: Partial<Trip>): Promise<ApiResponse<Trip>> => {
    const response = await apiClient.put(`/trips/${id}`, tripData);
    return response.data;
  },

  deleteTrip: async (id: string): Promise<void> => {
    await apiClient.delete(`/trips/${id}`);
  },

  updateTripStatus: async (id: string, status: string): Promise<ApiResponse<Trip>> => {
    const response = await apiClient.put(`/trips/status/${id}`, { status });
    return response.data;
  },
};

/**
 * Notification APIs
 */
export const notificationAPI = {
  getNotifications: async (): Promise<ApiResponse<Notification[]>> => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ unreadCount: number }>> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      const notifications = await notificationAPI.getNotifications();
      const notificationsData = Array.isArray(notifications) ? notifications : (notifications.data || []);
      const unreadNotifications = notificationsData.filter((n: any) => !n.is_read && !n.isRead);
      await Promise.all(
        unreadNotifications.map((notification: any) =>
          notificationAPI.markAsRead(notification.id?.toString() || notification.notification_id?.toString() || '')
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  },

  createNotification: async (notificationData: {
    userId: number;
    title: string;
    message: string;
    type?: string;
  }): Promise<ApiResponse<Notification>> => {
    const response = await apiClient.post('/notifications', notificationData);
    return response.data;
  },
};

/**
 * Voucher APIs
 */
export const voucherAPI = {
  getMyVouchers: async (): Promise<ApiResponse<Voucher[]>> => {
    const response = await apiClient.get('/vouchers/my');
    return response.data;
  },

  getAllVouchers: async (): Promise<ApiResponse<Voucher[]>> => {
    const response = await apiClient.get('/vouchers/admin');
    return response.data;
  },

  useVoucher: async (code: string): Promise<ApiResponse<{ message: string; voucher: Voucher }>> => {
    const response = await apiClient.put(`/vouchers/use/${code}`);
    return response.data;
  },

  createManualVoucher: async (voucherData: {
    userId: number;
    type: string;
    value?: number;
    description?: string;
    expiresAt?: string;
  }): Promise<ApiResponse<Voucher>> => {
    const response = await apiClient.post('/vouchers', voucherData);
    return response.data;
  },
};

/**
 * Transaction APIs
 */
export const transactionAPI = {
  getUserTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get('/transactions');
    return response.data;
  },

  getAllTransactions: async (): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get('/transactions/all');
    return response.data;
  },

  generateInvoice: async (bookingId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/reports/invoice/${bookingId}`);
    return response.data;
  },

  getSalesReports: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/reports/sales');
    return response.data;
  },

  getPaymentHistory: async (): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get('/reports/payment-history');
    return response.data;
  },
};

/**
 * Dashboard APIs
 */
export const dashboardAPI = {
  getStats: async (period?: number): Promise<ApiResponse<DashboardStats>> => {
    const params = period ? { period: period.toString() } : {};
    const response = await apiClient.get('/dashboard/stats', { params });
    return response.data;
  },

  getChartData: async (type?: string, period?: number): Promise<ApiResponse<any>> => {
    const params: any = {};
    if (type) params.type = type;
    if (period) params.period = period.toString();
    const response = await apiClient.get('/dashboard/charts', { params });
    return response.data;
  },

  getRealtimeAnalytics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/dashboard/realtime');
    return response.data;
  },

  getUserEngagement: async (period?: number): Promise<ApiResponse<any>> => {
    const params = period ? { period: period.toString() } : {};
    const response = await apiClient.get('/dashboard/engagement', { params });
    return response.data;
  },

  getRecentActivities: async (limit?: number): Promise<ApiResponse<any[]>> => {
    const params = limit ? { limit: limit.toString() } : {};
    const response = await apiClient.get('/dashboard/recent-activities', { params });
    return response.data;
  },
};

/**
 * Settings APIs
 */
export const settingsAPI = {
  getGeneralSettings: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/settings/general');
    return response.data;
  },

  updateGeneralSettings: async (settings: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/settings/general', settings);
    return response.data;
  },

  getAllPages: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/settings/pages');
    return response.data;
  },

  getPageBySlug: async (slug: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/settings/pages/slug/${slug}`);
    return response.data;
  },

  createPage: async (pageData: {
    title: string;
    slug: string;
    content: string;
    meta_title?: string;
    meta_description?: string;
    is_published?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/settings/pages', pageData);
    return response.data;
  },

  updatePage: async (id: number, pageData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/settings/pages/${id}`, pageData);
    return response.data;
  },

  deletePage: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.delete(`/settings/pages/${id}`);
    return response.data;
  },
};

/**
 * Payment APIs
 */
export const paymentAPI = {
  // Generic payment methods
  createPaymentIntent: async (data: {
    type: 'booking' | 'membership';
    itemId: string | number;
    amount: number;
    currency?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/payments/create-intent', data);
    return response.data;
  },

  confirmPayment: async (data: {
    transactionId: number;
    paymentMethod?: string;
    paymentDetails?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/payments/confirm', data);
    return response.data;
  },

  getPaymentMethods: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/payments/methods');
    return response.data;
  },

  // Fawaterak payment methods
  createFawaterakInvoice: async (data: {
    type: 'booking' | 'membership';
    itemId: string | number;
    amount: number;
    currency?: string;
    description?: string;
  }, retryCount = 0): Promise<ApiResponse<any>> => {
    const MAX_RETRIES = 2; // Maximum 2 retries
    const RETRY_DELAY = 2000; // 2 seconds delay between retries
    
    try {
      const response = await apiClient.post('/payments/fawaterak/create-invoice', data, {
        timeout: 65000, // 65 seconds timeout (backend has 60s timeout + 5s buffer)
      });
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for Fawaterak API
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message?.includes('Network');
      const isTimeoutError = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.response?.status === 504;
      const isServerError = error.response?.status === 500;
      
      // Retry logic for network errors and timeouts
      if (retryCount < MAX_RETRIES && (isNetworkError || isTimeoutError)) {
        console.log(`🔄 Retrying Fawaterak invoice creation (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise<void>(resolve =>
          setTimeout(() => resolve(), RETRY_DELAY * (retryCount + 1)),
        ); // Exponential backoff
        return API.payment.createFawaterakInvoice(data, retryCount + 1);
      }
      
      // Provide user-friendly error messages
      if (isTimeoutError) {
        throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى - قد يستغرق الاتصال بـ Fawaterak بعض الوقت');
      } else if (isNetworkError) {
        throw new Error('خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى');
      } else if (isServerError) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error;
        if (errorMessage?.includes('timeout') || errorMessage?.includes('ETIMEDOUT')) {
          throw new Error('انتهت مهلة الاتصال بخدمة Fawaterak. يرجى المحاولة مرة أخرى بعد قليل');
        }
        throw new Error(errorMessage || 'خطأ في السيرفر. يرجى المحاولة مرة أخرى');
      } else if (error.response?.status === 504) {
        throw new Error('انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى - قد يستغرق الاتصال بـ Fawaterak بعض الوقت');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw error;
      }
    }
  },

  checkFawaterakStatus: async (transactionId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/payments/fawaterak/status/${transactionId}`);
    return response.data;
  },
};

/**
 * Image APIs
 */
export const imageAPI = {
  getImageByCategory: async (category: string, options?: {
    width?: number;
    height?: number;
    query?: string;
  }): Promise<ApiResponse<{ imageUrl: string; category: string; query: string }>> => {
    const params: any = {};
    if (options?.width) params.width = options.width.toString();
    if (options?.height) params.height = options.height.toString();
    if (options?.query) params.query = options.query;
    const response = await apiClient.get(`/images/${category}`, { params });
    return response.data;
  },

  getBatchImages: async (categories: string[], options?: {
    width?: number;
    height?: number;
  }): Promise<ApiResponse<{ images: Array<{ category: string; imageUrl: string }> }>> => {
    const body: any = { categories };
    if (options?.width) body.width = options.width;
    if (options?.height) body.height = options.height;
    const response = await apiClient.post('/images/batch', body);
    return response.data;
  },

  getServiceImages: async (): Promise<ApiResponse<{
    services: Array<{
      id: number;
      name: string;
      category: string;
      query: string;
      imageUrl: string;
    }>;
  }>> => {
    const response = await apiClient.get('/images/services');
    return response.data;
  },
};

/**
 * Blog APIs
 */
export const blogAPI = {
  getBlogs: async (params?: Record<string, any>): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/blogs', { params });
    return response.data;
  },

  getBlogById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/blogs/${id}`);
    return response.data;
  },

  likeBlog: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/blogs/like/${id}`);
    return response.data;
  },

  createBlog: async (blogData: {
    title: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    isReel?: boolean;
    category?: string;
    destination?: string;
    tags?: string[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/blogs', blogData);
    return response.data;
  },

  createBlogWithMultipleFiles: async (
    files: Array<{ uri: string; type: 'image' | 'video'; filename?: string }>,
    title: string,
    content: string,
    onUploadProgress?: (progressEvent: { loaded: number; total: number }) => void,
  ): Promise<ApiResponse<any>> => {
    // CRITICAL: Create FormData with multiple files for one reel
    const formData = new FormData();
    
    // Add all files with the same field name 'media' (for multer.array)
    files.forEach((file, index) => {
      const filename = file.filename || file.uri.split('/').pop() || `reel-${Date.now()}-${index}.${file.type === 'video' ? 'mp4' : 'jpg'}`;
      
      let mimeType = 'image/jpeg';
      if (file.type === 'video') {
        if (filename.endsWith('.mp4')) mimeType = 'video/mp4';
        else if (filename.endsWith('.mov')) mimeType = 'video/quicktime';
        else if (filename.endsWith('.webm')) mimeType = 'video/webm';
        else mimeType = 'video/mp4';
      } else {
        if (filename.endsWith('.png')) mimeType = 'image/png';
        else if (filename.endsWith('.gif')) mimeType = 'image/gif';
        else if (filename.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg';
      }
      
      // Handle URI properly for both Android and iOS
      let fileUri = file.uri;
      if (Platform.OS === 'ios' && fileUri.startsWith('file://')) {
        fileUri = fileUri.replace('file://', '');
      } else if (Platform.OS === 'android' && !fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
        fileUri = `file://${fileUri}`;
      }
      
      formData.append('media', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);
    });
    
    // Add other fields
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    formData.append('mediaType', files[0]?.type || 'image');
    formData.append('isReel', 'true');
    formData.append('category', 'reels');
    
    // Use the same upload logic as createBlogWithFile
    return API.blog.createBlogWithFile(
      formData,
      onUploadProgress
        ? event =>
            onUploadProgress({
              loaded: event?.loaded ?? 0,
              total: event?.total ?? 1,
            })
        : undefined,
    );
  },

  createBlogWithFile: async (formData: FormData, onUploadProgress?: (progressEvent: AxiosProgressEvent) => void): Promise<ApiResponse<any>> => {
    // CRITICAL FIX: Use fetch API directly for FormData in React Native
    // fetch API handles FormData natively and is more reliable than axios for file uploads
    // Get token from storage
    let token: string | null = null;
    try {
      token = await AsyncStorage.getItem('token');
    } catch (error) {
      console.error('[Upload] Error getting token:', error);
    }
    
    // CRITICAL: Add retry logic for network errors
    let lastError: any = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        onUploadProgress?.({ loaded: 0, total: 1 } as AxiosProgressEvent);
        if (__DEV__) {
          console.log(`[Upload] Attempt ${attempt}/${maxRetries} - Starting upload with fetch API...`);
          console.log('[Upload] FormData details:', {
            hasFile: formData instanceof FormData,
            url: `${API_BASE_URL}/blogs`,
            hasToken: !!token,
            timestamp: new Date().toISOString()
          });
        }
        
        // CRITICAL: Prepare headers - DON'T set Content-Type for FormData
        // React Native fetch API will set it automatically with boundary
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        
        // Add Authorization header if token exists
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // CRITICAL: Use fetch API directly - it handles FormData natively in React Native
        // This is more reliable than axios for file uploads
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout
        
        try {
          const response = await fetch(`${API_BASE_URL}/blogs`, {
            method: 'POST',
            headers: headers, // Don't set Content-Type - fetch will set it with boundary
            body: formData, // FormData is sent directly
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          // Check if response is ok
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw {
              response: {
                status: response.status,
                statusText: response.statusText,
                data: errorData,
              },
              message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          
          const data = await response.json();
          onUploadProgress?.({ loaded: 1, total: 1 } as AxiosProgressEvent);
          
          if (__DEV__) {
            console.log(`[Upload] Success on attempt ${attempt}:`, {
              status: response.status,
              hasData: !!data,
              dataKeys: data ? Object.keys(data) : [],
            });
          }
          
          return data;
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          // Handle AbortError (timeout)
          if (fetchError.name === 'AbortError') {
            throw {
              code: 'ECONNABORTED',
              message: 'Request timeout',
              response: null,
            };
          }
          
          throw fetchError;
        }
      } catch (error: any) {
        lastError = error;
        
        if (__DEV__) {
          console.error(`[Upload] Attempt ${attempt} failed:`, {
            code: error.code,
            name: error.name,
            message: error.message,
            response: error.response ? {
              status: error.response.status,
              data: error.response.data,
            } : null,
          });
        }
        
        // Only retry on network errors, not on validation errors
        if ((error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.name === 'AbortError' || error.message?.includes('timeout') || error.message?.includes('Network')) && attempt < maxRetries) {
          const waitTime = 1000 * attempt; // Exponential backoff: 1s, 2s, 3s
          console.warn(`[Upload] Network error (${error.code || error.name}), retrying in ${waitTime}ms...`);
          await new Promise<void>(resolve => setTimeout(() => resolve(), waitTime));
          continue;
        }
        
        // Enhanced error handling for file uploads
        if (error.code === 'ECONNABORTED' || error.name === 'AbortError' || error.message?.includes('timeout')) {
          throw new Error('انتهت مهلة الاتصال. الملف كبير جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى');
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
          // Enhanced network error handling with retry suggestion
          const errorMsg = 'خطأ في الاتصال. يرجى التحقق من:\n' +
            '1. أن السيرفر يعمل على http://192.168.1.2:5000\n' +
            '2. أن الجهاز على نفس الشبكة\n' +
            '3. أن Firewall يسمح بالاتصال\n' +
            '4. المحاولة مرة أخرى';
          throw new Error(errorMsg);
        } else if (error.response?.status === 413) {
          throw new Error('الملف كبير جداً. الحد الأقصى هو 100MB');
        } else if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.message || 'بيانات غير صحيحة';
          throw new Error(errorMessage);
        } else if (error.response?.status === 500) {
          throw new Error('خطأ في السيرفر. يرجى المحاولة مرة أخرى');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw error;
        }
      }
    }
    
    // If all retries failed, throw the last error
    throw lastError;
  },

  saveBlog: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/blogs/save/${id}`);
    return response.data;
  },

  shareBlog: async (id: string, shareData?: { shareType?: string }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/blogs/share/${id}`, shareData || {});
    return response.data;
  },

  getSavedBlogs: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/blogs/saved');
    return response.data;
  },
};

/**
 * Comment APIs
 */
export const commentAPI = {
  addComment: async (commentData: {
    resourceType: string;
    resourceId: string | number;
    content: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/comments', commentData);
    return response.data;
  },

  getCommentsByResource: async (type: string, id: string | number): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/comments/${type}/${id}`);
    return response.data;
  },

  deleteComment: async (id: string): Promise<void> => {
    await apiClient.delete(`/comments/${id}`);
  },
};

/**
 * Additional APIs
 */
export const additionalAPI = {
  getAdditionals: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/additionals');
    return response.data;
  },

  getAdditionalById: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/additionals/${id}`);
    return response.data;
  },

  createAdditional: async (additionalData: {
    name: string;
    description?: string;
    price: number;
    category?: string;
    icon?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/additionals', additionalData);
    return response.data;
  },

  updateAdditional: async (id: string, additionalData: {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    icon?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/additionals/${id}`, additionalData);
    return response.data;
  },

  deleteAdditional: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/additionals/${id}`);
    return response.data;
  },
};

/**
 * Ad APIs
 */
export const adAPI = {
  getActiveAds: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/ads');
    return response.data;
  },

  createAd: async (adData: {
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    startDate?: string;
    endDate?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/ads', adData);
    return response.data;
  },

  updateAd: async (id: string, adData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/ads/${id}`, adData);
    return response.data;
  },

  deleteAd: async (id: string): Promise<void> => {
    await apiClient.delete(`/ads/${id}`);
  },

  sendAdToUsers: async (id: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/ads/send/${id}`);
    return response.data;
  },
};

/**
 * Chat APIs
 */
export const chatAPI = {
  getBotInfo: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/chat/bot/info');
    return response.data;
  },

  startBotChat: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/chat/bot');
    return response.data;
  },

  accessChat: async (userId: string | number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/chat', { userId });
    return response.data;
  },

  fetchChats: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/chat');
    return response.data;
  },

  sendMessage: async (messageData: {
    chatId: string | number;
    content: string;
    file?: {
      uri: string;
      type: string;
      name: string;
    };
  }): Promise<ApiResponse<any>> => {
    // If file is provided, use FormData
    if (messageData.file) {
      const formData = new FormData();
      formData.append('chatId', messageData.chatId.toString());
      formData.append('content', messageData.content || '');
      
      const filename = messageData.file.name || messageData.file.uri.split('/').pop() || 'file';
      const mimeType = messageData.file.type || 'application/octet-stream';
      
      formData.append('file', {
        uri: Platform.OS === 'android' ? messageData.file.uri : messageData.file.uri.replace('file://', ''),
        type: mimeType,
        name: filename,
      } as any);

      const response = await apiClient.post('/chat/message', formData, {
        headers: {
          'Content-Type': undefined, // Let axios set it automatically with boundary
        },
      });
      return response.data;
    } else {
      // Regular JSON request
      const response = await apiClient.post('/chat/message', {
        chatId: messageData.chatId,
        content: messageData.content,
      });
      return response.data;
    }
  },

  allMessages: async (chatId: string | number): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/chat/message/${chatId}`);
    return response.data;
  },

  getAllUsersForChat: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/chat/users');
    return response.data;
  },

  markMessagesAsRead: async (chatId: string | number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/chat/message/${chatId}/read`);
    return response.data;
  },

  sendGeminiBotMessage: async (chatId: string | number, message: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/chat/gemini/bot', { chatId, message });
    return response.data;
  },
};

/**
 * Document APIs
 */
export const documentAPI = {
  getMyDocuments: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/documents');
    const data = (response as any).data || response;
    if (Array.isArray(data)) {
      return { success: true, data };
    }
    return { success: true, data: [] };
  },

  uploadDocument: async (documentData: FormData): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/documents', documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocumentById: async (id: string | number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  },

  deleteDocument: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },

  getAllDocuments: async (): Promise<ApiResponse<any[]>> => {
    // Note: This endpoint might need to be added to backend for admin
    const response = await apiClient.get('/documents/admin');
    const data = (response as any).data || response;
    if (Array.isArray(data)) {
      return { success: true, data };
    }
    return { success: true, data: [] };
  },
};

/**
 * Affiliate APIs
 */
export const affiliateAPI = {
  // Public APIs
  getAffiliateCampaigns: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/affiliate/campaigns');
    return response.data;
  },

  trackAffiliateClick: async (clickData: {
    linkId: number;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/affiliate/track-click', clickData);
    return response.data;
  },

  // Private APIs
  getMyAffiliateLinks: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/affiliate/my-links');
    return response.data;
  },

  getAffiliateLinkDetails: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/affiliate/links/${id}`);
    return response.data;
  },

  joinAffiliateCampaign: async (campaignId: number, baseUrl?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/affiliate/join/${campaignId}`, { baseUrl });
    return response.data;
  },

  processReferral: async (referralData: {
    linkId: number;
    referredUserId: number;
    action?: string;
    metadata?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/affiliate/process-referral', referralData);
    return response.data;
  },

  getAffiliateEarnings: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/affiliate/earnings');
    return response.data;
  },

  requestPayout: async (payoutData: {
    amount: number;
    paymentMethod: string;
    accountDetails?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/affiliate/request-payout', payoutData);
    return response.data;
  },

  // Admin APIs
  getAffiliateDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/affiliate/admin/dashboard');
    return response.data;
  },

  getAllAffiliateCampaigns: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/affiliate/admin/campaigns');
    return response.data;
  },

  getAffiliateCampaignDetails: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/affiliate/admin/campaigns/${id}`);
    return response.data;
  },

  createAffiliateCampaign: async (campaignData: {
    name: string;
    description?: string;
    commissionType: string;
    commissionValue: number;
    startDate: string;
    endDate?: string;
    eligibilityCriteria?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/affiliate/admin/campaigns', campaignData);
    return response.data;
  },

  // Additional methods for compatibility
  getMyCode: async (): Promise<ApiResponse<{ code: string; link: string }>> => {
    const response = await apiClient.get('/affiliate/my-code');
    return response.data;
  },

  getMyReferrals: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/affiliate/my-referrals');
    return response.data;
  },
};

/**
 * Recommendation APIs
 */
export const recommendationAPI = {
  getTrendingPackages: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/recommendations/trending');
    return response.data;
  },

  getPersonalizedRecommendations: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/recommendations');
    return response.data;
  },

  updateUserPreferences: async (preferences: any): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/recommendations/preferences', preferences);
    return response.data;
  },

  trackPackageView: async (packageId: string | number): Promise<void> => {
    await apiClient.post('/recommendations/track-view', { packageId });
  },

  getPackageAnalytics: async (packageId: string | number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/recommendations/analytics/${packageId}`);
    return response.data;
  },

  getUserInsights: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/recommendations/insights');
    return response.data;
  },
};

/**
 * Travel Companion APIs
 */
export const travelCompanionAPI = {
  getTravelCompanionDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/travel-companion/dashboard');
    return response.data;
  },

  getUserItineraries: async (filters?: {
    status?: 'upcoming' | 'past' | 'current';
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<any>> => {
    const params = filters || {};
    const response = await apiClient.get('/travel-companion/itineraries', { params });
    return response.data;
  },

  getItineraryDetails: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/travel-companion/itinerary/${id}`);
    return response.data;
  },

  createItineraryFromBooking: async (bookingId: number, itineraryData: {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    activities?: any[];
    accommodations?: any[];
    transportation?: any[];
    emergencyContacts?: any[];
    checklist?: any[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/travel-companion/itinerary/from-booking/${bookingId}`, itineraryData);
    return response.data;
  },

  createCustomItinerary: async (itineraryData: {
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    destinations?: string[];
    activities?: any[];
    accommodations?: any[];
    transportation?: any[];
    emergencyContacts?: any[];
    checklist?: any[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/travel-companion/itinerary', itineraryData);
    return response.data;
  },

  updateItinerary: async (id: number, updateData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/travel-companion/itinerary/${id}`, updateData);
    return response.data;
  },

  shareItinerary: async (id: number, isShared: boolean): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/travel-companion/itinerary/${id}/share`, { isShared });
    return response.data;
  },

  getSharedItinerary: async (shareCode: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/travel-companion/shared/${shareCode}`);
    return response.data;
  },

  updateChecklistItem: async (itineraryId: number, itemId: string, completed: boolean): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/travel-companion/itinerary/${itineraryId}/checklist/${itemId}`, { completed });
    return response.data;
  },

  uploadTravelDocument: async (itineraryId: number, documentData: FormData): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/travel-companion/itinerary/${itineraryId}/documents`, documentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getTravelDocuments: async (filters?: {
    type?: string;
    status?: 'expiring' | 'expired';
  }): Promise<ApiResponse<any[]>> => {
    const params = filters || {};
    const response = await apiClient.get('/travel-companion/documents', { params });
    return response.data;
  },

  deleteTravelDocument: async (id: number): Promise<void> => {
    await apiClient.delete(`/travel-companion/documents/${id}`);
  },

  // Additional methods for compatibility
  getCompanions: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/travel-companion/companions');
    return response.data;
  },

  createCompanionRequest: async (requestData: {
    destination: string;
    startDate: string;
    endDate: string;
    description?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/travel-companion/companions', requestData);
    return response.data;
  },

  updateCompanionRequest: async (id: number, updateData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/travel-companion/companions/${id}`, updateData);
    return response.data;
  },

  deleteCompanionRequest: async (id: number): Promise<void> => {
    await apiClient.delete(`/travel-companion/companions/${id}`);
  },
};

/**
 * File Management APIs
 */
export const fileManagementAPI = {
  downloadMembershipCard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/files/membership-card');
    return response.data;
  },

  downloadMembershipCardPDF: async (cardId: number): Promise<Blob> => {
    const response = await apiClient.get(`/files/membership-card/pdf/${cardId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getMembershipCardQR: async (cardId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/files/membership-card/qr/${cardId}`);
    return response.data;
  },

  downloadVoucher: async (voucherId: number): Promise<Blob> => {
    const response = await apiClient.get(`/files/voucher/${voucherId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadInvoice: async (bookingId: number): Promise<Blob> => {
    const response = await apiClient.get(`/files/invoice/${bookingId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getUserDownloads: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/files/downloads');
    return response.data;
  },

  getDownloadUrl: async (fileType: string, id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/files/download-url/${fileType}/${id}`);
    return response.data;
  },

  uploadCustomFile: async (fileData: FormData): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/files/upload', fileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Admin APIs
  getDownloadStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/files/statistics');
    return response.data;
  },

  getPopularDownloads: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/files/popular');
    return response.data;
  },
};

/**
 * Marketing Automation APIs
 */
export const marketingAPI = {
  getMarketingDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/marketing/dashboard');
    return response.data;
  },

  getCampaigns: async (filters?: {
    status?: string;
    type?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<any>> => {
    const params = filters || {};
    const response = await apiClient.get('/marketing/campaigns', { params });
    return response.data;
  },

  getCampaignDetails: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/marketing/campaigns/${id}`);
    return response.data;
  },

  getCampaignStatistics: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/marketing/campaigns/${id}/statistics`);
    return response.data;
  },

  createCampaign: async (campaignData: {
    name: string;
    description?: string;
    type: string;
    targetCriteria?: any;
    content: any;
    scheduledAt?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/marketing/campaigns', campaignData);
    return response.data;
  },

  updateCampaign: async (id: number, campaignData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/marketing/campaigns/${id}`, campaignData);
    return response.data;
  },

  scheduleCampaign: async (id: number, scheduledAt: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/marketing/campaigns/${id}/schedule`, { scheduledAt });
    return response.data;
  },

  startCampaign: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/marketing/campaigns/${id}/start`);
    return response.data;
  },

  pauseCampaign: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/marketing/campaigns/${id}/pause`);
    return response.data;
  },

  getAutomatedTriggers: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/marketing/triggers');
    return response.data;
  },

  createAutomatedTrigger: async (triggerData: {
    name: string;
    eventType: string;
    conditions?: any;
    actions?: any;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/marketing/triggers', triggerData);
    return response.data;
  },

  updateAutomatedTrigger: async (id: number, triggerData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/marketing/triggers/${id}`, triggerData);
    return response.data;
  },

  toggleTriggerStatus: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/marketing/triggers/${id}/toggle`);
    return response.data;
  },

  testTrigger: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/marketing/triggers/${id}/test`);
    return response.data;
  },
};

/**
 * Partner Portal APIs
 */
export const partnerAPI = {
  // Public APIs
  applyToBePartner: async (applicationData: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    website?: string;
    address?: string;
    businessType: string;
    services?: string[];
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/partners/apply', applicationData);
    return response.data;
  },

  getAvailableServices: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/partners/services/available');
    return response.data;
  },

  // Private APIs
  bookPartnerService: async (serviceId: number, bookingData: {
    startDate: string;
    endDate?: string;
    participants?: number;
    specialRequests?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/partners/services/${serviceId}/book`, bookingData);
    return response.data;
  },

  getMyPartnerBookings: async (): Promise<ApiResponse<any[]>> => {
    // Note: This endpoint might need to be added to backend
    const response = await apiClient.get('/partners/my-bookings');
    return response.data;
  },

  // Admin APIs
  getPartnerDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/partners/dashboard');
    return response.data;
  },

  getPartners: async (filters?: {
    status?: string;
    businessType?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<any>> => {
    const params = filters || {};
    const response = await apiClient.get('/partners', { params });
    return response.data;
  },

  getPartnerDetails: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/partners/${id}`);
    return response.data;
  },

  approvePartner: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/partners/${id}/approve`);
    return response.data;
  },

  suspendPartner: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/partners/${id}/suspend`);
    return response.data;
  },

  rejectPartner: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/partners/${id}/reject`);
    return response.data;
  },

  getPartnerServices: async (partnerId: number): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/partners/${partnerId}/services`);
    return response.data;
  },

  createPartnerService: async (partnerId: number, serviceData: {
    name: string;
    description?: string;
    price: number;
    category?: string;
    duration?: number;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/partners/${partnerId}/services`, serviceData);
    return response.data;
  },

  getPartnerBookings: async (partnerId: number): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/partners/${partnerId}/bookings`);
    return response.data;
  },

  updateBookingStatus: async (bookingId: number, status: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/partners/bookings/${bookingId}/status`, { status });
    return response.data;
  },
};

/**
 * Localization APIs
 */
export const localizationAPI = {
  getLanguages: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/localization/languages');
    return response.data;
  },

  getTranslations: async (languageCode: string, category?: string): Promise<ApiResponse<any>> => {
    const params = category ? { category } : {};
    const response = await apiClient.get(`/localization/translations/${languageCode}`, { params });
    return response.data;
  },

  getCurrencies: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/localization/currencies');
    return response.data;
  },

  convertCurrency: async (amount: number, fromCurrency: string, toCurrency: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/localization/convert-currency', {
      amount,
      fromCurrency,
      toCurrency,
    });
    return response.data;
  },

  getUserPreferences: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/localization/user/preferences');
    return response.data;
  },

  updateUserLanguage: async (languageCode: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/localization/user/language', { languageCode });
    return response.data;
  },

  updateUserCurrency: async (currencyCode: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/localization/user/currency', { currencyCode });
    return response.data;
  },

  // Admin APIs
  getLocalizationDashboard: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/localization/admin/dashboard');
    return response.data;
  },

  getTranslationStats: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/localization/admin/translations/statistics');
    return response.data;
  },

  getMissingTranslations: async (languageCode: string, referenceLanguage?: string): Promise<ApiResponse<any>> => {
    const params = referenceLanguage ? { referenceLanguage } : {};
    const response = await apiClient.get(`/localization/admin/translations/missing/${languageCode}`, { params });
    return response.data;
  },

  createLanguage: async (languageData: {
    code: string;
    name: string;
    nativeName: string;
    flagEmoji?: string;
    isRtl?: boolean;
    isDefault?: boolean;
    sortOrder?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/localization/admin/languages', languageData);
    return response.data;
  },

  updateLanguage: async (id: number, languageData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/localization/admin/languages/${id}`, languageData);
    return response.data;
  },

  createCurrency: async (currencyData: {
    code: string;
    name: string;
    symbol: string;
    exchangeRate?: number;
    isDefault?: boolean;
    decimalPlaces?: number;
    position?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/localization/admin/currencies', currencyData);
    return response.data;
  },

  updateCurrency: async (id: number, currencyData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/localization/admin/currencies/${id}`, currencyData);
    return response.data;
  },

  updateExchangeRates: async (rates: Record<string, number>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/localization/admin/exchange-rates', { rates });
    return response.data;
  },

  setTranslation: async (key: string, languageCode: string, value: string, category?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/localization/admin/translations', {
      key,
      languageCode,
      value,
      category,
    });
    return response.data;
  },

  setTranslationsBulk: async (languageCode: string, translations: Record<string, string>, category?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/localization/admin/translations/bulk', {
      languageCode,
      translations,
      category,
    });
    return response.data;
  },
};

/**
 * External API APIs
 */
export const externalAPI = {
  // Maps APIs
  getPlaceDetails: async (placeId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/external/maps/place/${placeId}`);
    return response.data;
  },

  getDirections: async (origin: string, destination: string, mode?: string): Promise<ApiResponse<any>> => {
    const params = { origin, destination, mode: mode || 'driving' };
    const response = await apiClient.get('/external/maps/directions', { params });
    return response.data;
  },

  geocodeAddress: async (address: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/external/maps/geocode', { params: { address } });
    return response.data;
  },

  // Weather APIs
  getCurrentWeather: async (lat: number, lon: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/external/weather/current', {
      params: { lat, lon },
    });
    return response.data;
  },

  getWeatherForecast: async (lat: number, lon: number, days?: number): Promise<ApiResponse<any>> => {
    const params = { lat, lon, days: days || 5 };
    const response = await apiClient.get('/external/weather/forecast', { params });
    return response.data;
  },

  // Currency APIs
  getExchangeRate: async (from: string, to: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/external/currency/rate', {
      params: { from, to },
    });
    return response.data;
  },

  // Flight APIs
  searchFlights: async (searchData: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/external/flights/search', searchData);
    return response.data;
  },

  // Hotel APIs
  searchHotels: async (searchData: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/external/hotels/search', searchData);
    return response.data;
  },

  // Communication APIs (Admin only)
  sendSMS: async (to: string, message: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/external/sms/send', { to, message });
    return response.data;
  },

  sendEmail: async (emailData: {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/external/email/send', emailData);
    return response.data;
  },

  // Admin APIs
  getApiStatistics: async (serviceName?: string): Promise<ApiResponse<any>> => {
    const params = serviceName ? { serviceName } : {};
    const response = await apiClient.get('/external/statistics', { params });
    return response.data;
  },

  getApiLogs: async (filters?: {
    serviceName?: string;
    status?: string;
    limit?: number;
  }): Promise<ApiResponse<any[]>> => {
    const params = filters || {};
    const response = await apiClient.get('/external/logs', { params });
    return response.data;
  },

  getApiIntegrations: async (filters?: {
    serviceType?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any[]>> => {
    const params = filters || {};
    const response = await apiClient.get('/external/admin/integrations', { params });
    return response.data;
  },

  createApiIntegration: async (integrationData: {
    serviceName: string;
    serviceType: string;
    apiKey: string;
    apiSecret?: string;
    baseUrl?: string;
    configuration?: any;
    isProduction?: boolean;
    rateLimit?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/external/admin/integrations', integrationData);
    return response.data;
  },

  updateApiIntegration: async (id: number, updateData: Partial<any>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/external/admin/integrations/${id}`, updateData);
    return response.data;
  },

  toggleIntegrationStatus: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/external/admin/integrations/${id}/toggle`);
    return response.data;
  },

  testApiIntegration: async (id: number, testData: {
    endpoint: string;
    method?: string;
    data?: any;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/external/admin/integrations/${id}/test`, testData);
    return response.data;
  },
};

/**
 * Geolocation APIs
 */
export const geolocationAPI = {
  updateUserLocation: async (locationData: {
    latitude: number;
    longitude: number;
    countryCode?: string;
    timezone?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.put('/geolocation/update-location', locationData);
    return response.data;
  },

  getVisitedLocations: async (limit?: number): Promise<ApiResponse<any[]>> => {
    const params = limit ? { limit } : {};
    const response = await apiClient.get('/geolocation/visited-locations', { params });
    return response.data;
  },

  addVisitedLocation: async (locationData: {
    locationName: string;
    latitude: number;
    longitude: number;
    country: string;
    city?: string;
    visitType?: string;
    bookingId?: number;
    visitDate?: string;
    notes?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/geolocation/add-location', locationData);
    return response.data;
  },

  getMapData: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/geolocation/map-data');
    return response.data;
  },

  getTravelStatistics: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/geolocation/travel-stats');
    return response.data;
  },

  getCountryCurrencies: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/geolocation/country-currencies');
    return response.data;
  },

  getPopularCurrencies: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/geolocation/popular-currencies');
    return response.data;
  },

  detectCurrencyFromLocation: async (locationData: {
    latitude?: number;
    longitude?: number;
    countryCode?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/geolocation/detect-currency', locationData);
    return response.data;
  },

  getCurrentLocationInfo: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/geolocation/current-location');
    return response.data;
  },

  getLanguagesOrdered: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/geolocation/languages-ordered');
    return response.data;
  },

  getCurrenciesOrdered: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/geolocation/currencies-ordered');
    return response.data;
  },
};

/**
 * OAuth APIs
 */
export const oauthAPI = {
  getOAuthConfig: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/oauth/config');
    return response.data;
  },

  googleLogin: async (): Promise<any> => {
    const response = await apiClient.get('/oauth/google');
    return response.data;
  },

  appleLogin: async (): Promise<any> => {
    const response = await apiClient.get('/oauth/apple');
    return response.data;
  },

  tokenExchange: async (tokenData: {
    provider: string;
    token: string;
    idToken?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/oauth/token-exchange', tokenData);
    return response.data;
  },

  getUserProviders: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/oauth/providers');
    return response.data;
  },

  linkProvider: async (providerData: {
    provider: string;
    token: string;
    idToken?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/oauth/link', providerData);
    return response.data;
  },

  unlinkProvider: async (provider: string): Promise<void> => {
    await apiClient.delete(`/oauth/unlink/${provider}`);
  },
};

/**
 * Admin APIs
 */
export const adminAPI = {
  createAdminUser: async (adminData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/admin/create-admin', adminData);
    return response.data;
  },
};

/**
 * Report APIs
 */
export const reportAPI = {
  generateUserReportPDF: async (): Promise<Blob> => {
    const response = await apiClient.get('/reports/user-pdf', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Get PDF download URL with authentication
   * Returns a URL that can be used to download the PDF directly
   */
  getPDFDownloadURL: async (): Promise<string> => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const url = `${API_BASE_URL}/reports/user-pdf?token=${encodeURIComponent(token)}`;
      return url;
    } catch (error) {
      console.error('[Report API] Error getting PDF download URL:', error);
      throw error;
    }
  },

  /**
   * Download PDF as base64 for React Native
   * Returns base64 string that can be used to create a data URI
   */
  downloadPDFAsBase64: async (): Promise<string> => {
    try {
      const response = await apiClient.get('/reports/user-pdf', {
        responseType: 'arraybuffer',
      });
      
      // Convert ArrayBuffer to base64 (React Native compatible)
      const arrayBuffer = response.data;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      // Use btoa if available, otherwise use manual base64 encoding
      let base64: string;
      if (typeof Buffer !== 'undefined') {
        base64 = Buffer.from(binary, 'binary').toString('base64');
      } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).btoa === 'function') {
        base64 = (globalThis as any).btoa(binary);
      } else {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        let result = '';
        let i = 0;
        while (i < binary.length) {
          const a = binary.charCodeAt(i++);
          const b = i < binary.length ? binary.charCodeAt(i++) : 0;
          const c = i < binary.length ? binary.charCodeAt(i++) : 0;
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63);
          result += chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
        }
        base64 = result;
      }
      
      return base64;
    } catch (error: any) {
      console.error('[Report API] Error downloading PDF as base64:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to download PDF');
    }
  },

  getUserReportData: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/reports/user-data');
    return response.data;
  },

  generateInvoice: async (bookingId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/reports/invoice/${bookingId}`);
    return response.data;
  },

  getSalesReports: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get('/reports/sales');
    return response.data;
  },

  getPaymentHistory: async (): Promise<ApiResponse<Transaction[]>> => {
    const response = await apiClient.get('/reports/payment-history');
    return response.data;
  },
};

/**
 * Quotation/Proposal APIs
 */
export const quotationAPI = {
  getQuotations: async (params?: {
    status?: string;
    customerId?: number;
    salesId?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/quotations', { params });
    return response.data;
  },

  getQuotationById: async (id: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/quotations/${id}`);
    return response.data;
  },

  createQuotation: async (data: {
    customerId: number;
    packageId?: number;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    notes?: string;
    validUntil?: string;
    discount?: number;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/quotations', data);
    return response.data;
  },

  updateQuotation: async (id: number, data: Partial<{
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    notes?: string;
    validUntil?: string;
    discount?: number;
    status?: string;
  }>): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/quotations/${id}`, data);
    return response.data;
  },

  sendQuotation: async (id: number, options?: {
    sendEmail?: boolean;
    sendNotification?: boolean;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`/quotations/${id}/send`, options || {});
    return response.data;
  },

  generateQuotationPDF: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/quotations/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  deleteQuotation: async (id: number): Promise<void> => {
    await apiClient.delete(`/quotations/${id}`);
  },
};

/**
 * Support Tickets API
 */
export const supportTicketAPI = {
  createTicketFromChat: async (ticketData: {
    chatId: number;
    subject?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/support-tickets/from-chat', ticketData);
    return response.data;
  },

  getMyTickets: async (status?: string): Promise<ApiResponse<any[]>> => {
    const params = status ? { status } : {};
    const response = await apiClient.get('/support-tickets/my', { params });
    return response.data;
  },

  getAllTickets: async (filters?: {
    status?: string;
    priority?: string;
    assignedTo?: number;
  }): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get('/support-tickets', { params: filters });
    return response.data;
  },

  updateTicketStatus: async (id: number, updateData: {
    status?: string;
    assignedTo?: number;
    priority?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.put(`/support-tickets/${id}`, updateData);
    return response.data;
  },
};

/**
 * Health Check API
 */
export const healthAPI = {
  check: async (): Promise<ApiResponse<{ status: string; message: string; timestamp: string }>> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// ==========================================
// Export all APIs as a single object
// ==========================================

export const API = {
  payment: paymentAPI,
  image: imageAPI,
  auth: authAPI,
  user: userAPI,
  package: packageAPI,
  booking: bookingAPI,
  membership: membershipAPI,
  review: reviewAPI,
  trip: tripAPI,
  notification: notificationAPI,
  voucher: voucherAPI,
  transaction: transactionAPI,
  supportTicket: supportTicketAPI,
  dashboard: dashboardAPI,
  settings: settingsAPI,
  blog: blogAPI,
  comment: commentAPI,
  ad: adAPI,
  chat: chatAPI,
  document: documentAPI,
  affiliate: affiliateAPI,
  recommendation: recommendationAPI,
  travelCompanion: travelCompanionAPI,
  fileManagement: fileManagementAPI,
  marketing: marketingAPI,
  partner: partnerAPI,
  localization: localizationAPI,
  external: externalAPI,
  geolocation: geolocationAPI,
  oauth: oauthAPI,
  admin: adminAPI,
  additional: additionalAPI,
  report: reportAPI,
  quotation: quotationAPI,
  health: healthAPI,
};

// Default export
export default API;
