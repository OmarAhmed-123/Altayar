/**
 * Centralized API Services Export
 * ==========================================
 * All services now use the unified API client from apiClient.ts
 * ==========================================
 */

// Export unified API client
export { API, apiClient } from './apiClient';
export { imageService } from './imageService';

// Export individual services (for backward compatibility)
export { authService } from './authService';
export { packageService } from './packageService';
export { bookingService } from './bookingService';
export { membershipService } from './membershipService';
export { notificationService } from './notificationService';
export { reviewService } from './reviewService';
export { tripService } from './tripService';
export type {
  LoginRequest,
  RegisterRequest,
  User,
  Package,
  Booking,
  Membership,
  Review,
  Trip,
  Notification,
  DashboardStats,
} from './apiClient';

export { voucherService } from './voucherService';
export { transactionService, type SalesReport } from './transactionService';
export { userService } from './userService';
export { settingsService, type Page, type GeneralSettings } from './settingsService';
export {
  dashboardService,
  type ChartData,
  type RealtimeAnalytics,
  type UserEngagement,
  type RecentActivity,
} from './dashboardService';
export { reportService, type UserReportData } from './reportService';
export { blogService } from './blogService';
export { commentService } from './commentService';
export { adService } from './adService';
export { chatService } from './chatService';
export { documentService } from './documentService';
export { affiliateService } from './affiliateService';
export { recommendationService } from './recommendationService';
export { travelCompanionService } from './travelCompanionService';
export { oauthService } from './oauthService';
export { partnerService } from './partnerService';
export { marketingService } from './marketingService';
export { geolocationService } from './geolocationService';
export { externalApiService } from './externalApiService';

// Re-export types from main types file
export type { ApiResponse, PaginatedResponse } from '../types';
