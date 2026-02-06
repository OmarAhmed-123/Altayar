/**
 * Authentication Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { LoginRequest, RegisterRequest, User } from '../types';

export const authService = {
  login: API.auth.login,
  register: API.auth.register,
  logout: API.auth.logout,
  getCurrentUser: API.auth.getCurrentUser,
  updateProfile: API.auth.updateProfile,
};
