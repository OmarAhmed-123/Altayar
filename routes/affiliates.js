const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// This file is deprecated - affiliate routes are now in /api/affiliate
// Keeping this file to avoid breaking existing references
router.get('/my-code', protect, (req, res) => {
  res.redirect('/api/affiliate/my-links');
});

router.get('/my-referrals', protect, (req, res) => {
  res.redirect('/api/affiliate/earnings');
});

module.exports = router;