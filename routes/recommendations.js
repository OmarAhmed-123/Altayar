const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPersonalizedRecommendations,
  updateUserPreferences,
  trackPackageView,
  getTrendingPackages,
  getPackageAnalytics,
  getUserInsights
} = require('../controllers/recommendationController');

// Public routes
router.get('/trending', getTrendingPackages);

// Private routes
router.get('/', protect, getPersonalizedRecommendations);
router.put('/preferences', protect, updateUserPreferences);
router.post('/track-view', protect, trackPackageView);

// Admin routes
router.get('/analytics/:packageId', protect, authorize('super_admin', 'admin', 'sales'), getPackageAnalytics);
router.get('/insights', protect, authorize('super_admin', 'admin'), getUserInsights);

module.exports = router;
