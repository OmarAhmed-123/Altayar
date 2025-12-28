// Deep Links Routes
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createDeepLink,
  createShareableLink,
  getDeepLinkConfig,
} = require('../controllers/deepLinkController');

// Public routes
router.get('/config', getDeepLinkConfig);

// Protected routes (require authentication)
router.post('/create', protect, createDeepLink);
router.post('/share', protect, createShareableLink);

module.exports = router;

