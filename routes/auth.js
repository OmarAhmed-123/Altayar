const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');
const { getProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes - Get current user (with rate limiting to prevent duplicate requests)
router.get('/me', protect, generalLimiter, getProfile);

module.exports = router;
