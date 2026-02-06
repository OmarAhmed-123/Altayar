/**
 * Mock Data Service
 * 
 * ⚠️ DISABLED - This service is no longer used.
 * All data now comes from the real backend API.
 * 
 * This file is kept for reference only but should not be imported or used.
 * All USE_MOCK_DATA checks have been removed from the codebase.
 */

// Mock data is completely disabled - using real backend data only
export const USE_MOCK_DATA = false;

// Empty exports to prevent import errors (if any files still reference this)
export const mockUser = null;
export const mockMembershipCard = null;
export const mockBookings: any[] = [];
export const mockPackages: any[] = [];
export const mockTransactions: any[] = [];
export const mockTrips: any[] = [];
export const mockReviews: any[] = [];
export const mockNotifications: any[] = [];
export const mockMemberships: any[] = [];

export const mockDataService = {
  getUser: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getMembershipCard: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getBookings: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getPackages: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getTransactions: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getTrips: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getReviews: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getNotifications: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  /**
   * @deprecated Mock data disabled. Use notificationService.getUnreadCount instead.
   */
  getUnreadCount: async (_eventId?: string) => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  getMemberships: async () => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
  /**
   * @deprecated Mock data disabled. Use membershipService.getMembershipById instead.
   */
  getMembershipById: async (_id: string) => {
    throw new Error('Mock data is disabled. Use real backend API instead.');
  },
};
