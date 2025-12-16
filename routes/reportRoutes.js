/**
 * Report Routes
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateUserReportPDF,
  getUserReportData,
} = require('../controllers/reportController');

// All routes require authentication
router.use(protect);

// Generate user report PDF
router.get('/user-pdf', generateUserReportPDF);

// Get user report data (without PDF)
router.get('/user-data', getUserReportData);

module.exports = router;

