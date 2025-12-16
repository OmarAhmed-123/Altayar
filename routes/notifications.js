// File: routes/notifications.js

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const { 
    getNotifications, 
    markAsRead, 
    getUnreadCount, 
    createNotification // Corrected function name
} = require('../controllers/notificationController');

const router = express.Router();

// --- Customer & Staff Routes ---

// Get all notifications for the current user (with rate limiting)
router.route('/')
    .get(protect, generalLimiter, getNotifications);

// Get the count of unread notifications (with rate limiting)
router.route('/unread-count')
    .get(protect, generalLimiter, getUnreadCount);

// Mark a specific notification as read
router.route('/:id/read')
    .put(protect, markAsRead);

// --- Admin/Staff Only Route ---

// Create and send a notification to a specific user
router.route('/')
    .post(protect, authorize('super_admin', 'admin', 'sales'), createNotification);

module.exports = router;