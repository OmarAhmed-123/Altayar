/**
 * Review Service
 * Uses the unified API client
 */
import { API } from './apiClient';
import type { Review } from '../types';

export const reviewService = {
  getPackageReviews: API.review.getPackageReviews,
  getMyReviews: API.review.getMyReviews,
  createReview: API.review.createReview,
  updateReview: API.review.updateReview,
  deleteReview: API.review.deleteReview,
  markReviewHelpfulness: API.review.markReviewHelpfulness,
  getAllReviews: API.review.getAllReviews,
  getReviewStatistics: API.review.getReviewStatistics,
  verifyReview: API.review.verifyReview,
  featureReview: API.review.featureReview,
};
