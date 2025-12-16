const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createPackageReview,
  getPackageReviews,
  markReviewHelpfulness,
  getMyReviews,
  updateReview,
  deleteReview,
  getAllReviewsAdmin,
  verifyReview,
  featureReview,
  getReviewStatistics
} = require('../controllers/reviewController');

// Public routes
router.get('/package/:packageId', getPackageReviews);

// Private routes
router.post('/package/:packageId', protect, createPackageReview);
router.get('/my', protect, getMyReviews);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);
router.post('/:reviewId/helpfulness', protect, markReviewHelpfulness);

// Admin routes
router.get('/admin', protect, authorize('super_admin', 'admin', 'sales'), getAllReviewsAdmin);
router.get('/statistics', protect, authorize('super_admin', 'admin'), getReviewStatistics);
router.put('/:reviewId/verify', protect, authorize('super_admin', 'admin'), verifyReview);
router.put('/:reviewId/feature', protect, authorize('super_admin', 'admin'), featureReview);

module.exports = router;