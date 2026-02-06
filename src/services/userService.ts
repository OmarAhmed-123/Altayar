/**
 * User Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { User } from '../types';

export const userService = {
  getUsers: API.user.getUsers,
  getUserById: API.user.getUserById,
  updateUserRole: API.user.updateUserRole,
  deleteUser: API.user.deleteUser,
  getProfile: API.user.getProfile,
  updateProfile: API.user.updateProfile,
  addManualGift: API.user.addManualGift,
};
