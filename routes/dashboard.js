// File: routes/dashboard.js

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getStats,
    getChartData,
    getRealtimeAnalytics,
    getUserEngagement,
    getRecentActivities,
    getRevenueAnalytics
} = require('../controllers/dashboardController');

const router = express.Router();

// Get comprehensive dashboard statistics
router.route('/stats').get(protect, authorize('super_admin', 'admin', 'accountant'), getStats);

// Get advanced chart data
router.route('/charts').get(protect, authorize('super_admin', 'admin', 'accountant', 'sales'), getChartData);

// Get real-time analytics
router.route('/realtime').get(protect, getRealtimeAnalytics);

// Get user engagement analytics
router.route('/engagement').get(protect, authorize('super_admin', 'admin'), getUserEngagement);

// Get recent activities
router.route('/recent-activities').get(protect, getRecentActivities);

// Get comprehensive revenue analytics
router.route('/revenue-analytics').get(protect, authorize('super_admin', 'admin', 'accountant'), getRevenueAnalytics);

module.exports = router;