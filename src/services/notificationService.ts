/**
 * Notification Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import { extractArray, extractData } from '../utils/apiResponse';

export const notificationService = {
  getNotifications: async () => extractArray(await API.notification.getNotifications()),
  getUnreadCount: async () => extractData(await API.notification.getUnreadCount()) ?? { unreadCount: 0 },
  markAsRead: API.notification.markAsRead,
  markAllAsRead: API.notification.markAllAsRead,
  createNotification: API.notification.createNotification,
};
