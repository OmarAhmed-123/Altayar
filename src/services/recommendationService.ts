/**
 * Recommendation Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export const recommendationService = {
  getTrendingPackages: API.recommendation.getTrendingPackages,
  getPersonalizedRecommendations: API.recommendation.getPersonalizedRecommendations,
  updateUserPreferences: API.recommendation.updateUserPreferences,
  trackPackageView: API.recommendation.trackPackageView,
  getPackageAnalytics: API.recommendation.getPackageAnalytics,
  getUserInsights: API.recommendation.getUserInsights,
};

