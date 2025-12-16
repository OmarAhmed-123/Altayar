// File: routes/admin.js
const express = require('express');
const router = express.Router();
const { createAdminUser } = require('../controllers/adminController');

// @desc    Create admin user (one-time setup)
// @route   POST /api/admin/create-admin
// @access  Public (for initial setup only - should be protected in production)
router.post('/create-admin', createAdminUser);

module.exports = router;

