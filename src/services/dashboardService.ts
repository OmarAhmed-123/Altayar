/**
 * Dashboard Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { DashboardStats } from './apiClient';

// Re-export types
export type { DashboardStats } from './apiClient';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface RealtimeAnalytics {
  onlineUsers: number;
  activeBookings: number;
  recentSignups: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export interface UserEngagement {
  averageSessionTime: number;
  pageViews: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{
    page: string;
    views: number;
  }>;
}

export interface RecentActivity {
  id: number;
  type: 'booking' | 'user' | 'payment' | 'review';
  description: string;
  timestamp: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export const dashboardService = {
  getStats: API.dashboard.getStats,
  getChartData: API.dashboard.getChartData,
  getRealtimeAnalytics: API.dashboard.getRealtimeAnalytics,
  getUserEngagement: API.dashboard.getUserEngagement,
  getRecentActivities: API.dashboard.getRecentActivities,
};
