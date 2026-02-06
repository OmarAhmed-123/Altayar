import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginRequest, RegisterRequest } from './../types';
import { authService } from './../services/authService';
import { buildProfilePictureUrl } from './../utils/imageUrlBuilder';

const sanitizeAvatarUrl = (avatar?: string | null) => {
  if (!avatar) {
    return null;
  }
  if (avatar.includes('source.unsplash.com')) {
    return null;
  }
  return avatar;
};
// Mock data removed - using real backend data only

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateUser: (userData: Partial<User>, imageUri?: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          // Use real backend API
          const response = await authService.login(credentials);
          // Backend returns: { success: true, id, name, email, role, token, ... } or { success: false, message }
          const data = response.data || response;
          
          // Check if login was successful
          if (data.success === false) {
            // Handle rate limit errors with user-friendly message
            let errorMessage = data.message || 'فشل تسجيل الدخول';
            
            // Check if it's a rate limit error
            if (data.code === 'RATE_LIMIT_EXCEEDED' || errorMessage.includes('Too many')) {
              const retryAfter = data.retryAfter || 15;
              errorMessage = `تم إرسال طلبات كثيرة. يرجى المحاولة مرة أخرى بعد ${retryAfter} ثانية`;
            } else if (errorMessage.includes('Too many requests')) {
              errorMessage = 'تم إرسال طلبات كثيرة. يرجى المحاولة مرة أخرى بعد قليل';
            } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
              errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            }
            
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }
          
          // Extract token and user data
          const token = data.token;
          if (!token) {
            throw new Error('No token received from server');
          }
          
          await AsyncStorage.setItem('token', token);
          
          // Construct avatar URL properly using the image URL builder
          let avatarUrl = data.profile_picture_url || data.profilePictureUrl;
          if (avatarUrl) {
            avatarUrl = buildProfilePictureUrl(avatarUrl) || avatarUrl;
          }
          
          // Transform backend user data to frontend format
          const isSuperAdmin = Boolean(data.is_super_admin ?? data.isSuperAdmin);

          const transformedUser = {
            ...data,
            firstName: data.name?.split(' ')[0] || '',
            lastName: data.name?.split(' ').slice(1).join(' ') || '',
            avatar: sanitizeAvatarUrl(avatarUrl),
            isActive: true,
            createdAt: data.created_at || data.createdAt,
            updatedAt: data.updated_at || data.updatedAt,
            isSuperAdmin,
          };
          
          set({
            user: transformedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Extract error message from various possible formats
          let errorMessage = 'فشل تسجيل الدخول';
          
          if (error.response?.data) {
            // Backend returns { success: false, message: '...' }
            const data = error.response.data;
            errorMessage = data.message || data.error || 'فشل تسجيل الدخول';
            
            // Handle rate limit errors
            if (data.code === 'RATE_LIMIT_EXCEEDED' || errorMessage.includes('Too many')) {
              const retryAfter = data.retryAfter || 15;
              errorMessage = `تم إرسال طلبات كثيرة. يرجى المحاولة مرة أخرى بعد ${retryAfter} ثانية`;
            }
          } else if (error.responseData) {
            // From enhanced error object
            const data = error.responseData;
            errorMessage = data.message || data.error || 'فشل تسجيل الدخول';
            
            // Handle rate limit errors
            if (data.code === 'RATE_LIMIT_EXCEEDED' || errorMessage.includes('Too many')) {
              const retryAfter = data.retryAfter || 15;
              errorMessage = `تم إرسال طلبات كثيرة. يرجى المحاولة مرة أخرى بعد ${retryAfter} ثانية`;
            }
          } else if (error.message) {
            errorMessage = error.message;
            
            // Handle rate limit in message
            if (errorMessage.includes('Too many') || errorMessage.includes('429')) {
              errorMessage = 'تم إرسال طلبات كثيرة. يرجى المحاولة مرة أخرى بعد قليل';
            }
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      register: async (userData: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          // Use real backend API
          const response = await authService.register(userData);
          // Backend returns: { success: true, id, name, email, role, token, ... } or { success: false, message }
          const data = response.data || response;
          
          // Check if registration was successful
          if (data.success === false) {
            const errorMessage = data.message || 'Registration failed';
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }
          
          // Extract token and user data
          const token = data.token;
          if (!token) {
            throw new Error('No token received from server');
          }
          
          await AsyncStorage.setItem('token', token);
          
          // Construct avatar URL properly using the image URL builder
          let avatarUrl = data.profile_picture_url || data.profilePictureUrl;
          if (avatarUrl) {
            avatarUrl = buildProfilePictureUrl(avatarUrl) || avatarUrl;
          }
          
          // Transform backend user data to frontend format
          const isSuperAdmin = Boolean(data.is_super_admin ?? data.isSuperAdmin);

          const transformedUser = {
            ...data,
            firstName: data.name?.split(' ')[0] || '',
            lastName: data.name?.split(' ').slice(1).join(' ') || '',
            avatar: sanitizeAvatarUrl(avatarUrl),
            isActive: true,
            createdAt: data.created_at || data.createdAt,
            updatedAt: data.updated_at || data.updatedAt,
            isSuperAdmin,
          };
          
          set({
            user: transformedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Extract error message from various possible formats
          let errorMessage = 'Registration failed';
          
          if (error.response?.data) {
            // Backend returns { success: false, message: '...' }
            errorMessage = error.response.data.message || error.response.data.error || 'Registration failed';
          } else if (error.responseData) {
            // From enhanced error object
            errorMessage = error.responseData.message || error.responseData.error || 'Registration failed';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
          await AsyncStorage.removeItem('token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Logout failed',
          });
        }
      },

      loadUser: async () => {
        set({ isLoading: true, error: null });
        try {
          // Use real backend API
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
            return;
          }
          
          // Try to get user from backend
          try {
            const response = await authService.getCurrentUser();
            // Backend returns: { success: true, id, name, email, ... } or user data directly
            const data = response.data || response;
            const user = data.success !== undefined ? (data.success ? data : null) : data;
            
            // Check if response is valid
            if (!user || !user.id) {
              throw new Error('Invalid user data received');
            }
            
            // Construct avatar URL properly using the image URL builder
            let avatarUrl = user.profile_picture_url || user.profilePictureUrl;
            if (avatarUrl) {
              avatarUrl = buildProfilePictureUrl(avatarUrl) || avatarUrl;
            }
            
            // Transform backend user data to frontend format
            const isSuperAdmin = Boolean(user.is_super_admin ?? user.isSuperAdmin);

            const transformedUser = {
              ...user,
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ').slice(1).join(' ') || '',
              avatar: sanitizeAvatarUrl(avatarUrl),
              isActive: true,
              createdAt: user.created_at || user.createdAt,
              updatedAt: user.updated_at || user.updatedAt,
              isSuperAdmin,
            };
            
            set({
              user: transformedUser,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (apiError: any) {
            // Don't treat cached responses as errors
            if (apiError?.__CACHED_RESPONSE__) {
              return;
            }

            // If API call fails with 401, token is invalid
            if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
              // 401 on /auth/me is expected if user is not logged in - don't clear everything
              if (__DEV__) {
                console.log('401 on /auth/me - User may not be authenticated');
              }
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            } else {
              // For network errors, don't clear token immediately - might be temporary
              if (__DEV__) {
                console.warn('Failed to load user from backend:', apiError?.message || 'Network error');
              }
              // Only clear if it's a persistent error (not network)
              if (apiError?.response?.status && apiError.response.status !== 0) {
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                });
              } else {
                // Network error - keep token but mark as not authenticated
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                });
              }
            }
          }
        } catch (error: any) {
          // Catch any other errors (storage errors, etc.)
          console.warn('Error in loadUser:', error?.message || 'Unknown error');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      updateUser: async (userData: Partial<User>, imageUri?: string) => {
        set({ isLoading: true });
        try {
          // Use real backend API
          const response = await authService.updateProfile(userData, imageUri);
          const updatedUser = response.data || response;
          
          // Construct avatar URL properly using the image URL builder
          let avatarUrl = updatedUser.profile_picture_url || updatedUser.profilePictureUrl;
          if (avatarUrl) {
            avatarUrl = buildProfilePictureUrl(avatarUrl) || avatarUrl;
          } else if (!avatarUrl && imageUri) {
            // If no URL from backend but we have local URI, keep it temporarily
            avatarUrl = imageUri;
          }
          
          const isSuperAdmin = Boolean(updatedUser.is_super_admin ?? updatedUser.isSuperAdmin);

          const transformedUser = {
            ...updatedUser,
            firstName: updatedUser.name?.split(' ')[0] || '',
            lastName: updatedUser.name?.split(' ').slice(1).join(' ') || '',
            avatar: sanitizeAvatarUrl(avatarUrl),
            isActive: true,
            createdAt: updatedUser.created_at || updatedUser.createdAt,
            updatedAt: updatedUser.updated_at || updatedUser.updatedAt,
            isSuperAdmin,
          };
          set({
            user: transformedUser,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update profile',
          });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
