// File: routes/images.js
const express = require('express');
const {
  getImageByCategory,
  getBatchImages,
  getServiceImages,
} = require('../controllers/imageController');

const router = express.Router();

// @route GET /api/images/:category
// @access Public
router.get('/:category', getImageByCategory);

// @route POST /api/images/batch
// @access Public
router.post('/batch', getBatchImages);

// @route GET /api/images/services
// @access Public
router.get('/services', getServiceImages);

module.exports = router;

