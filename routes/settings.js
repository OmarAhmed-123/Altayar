// File: routes/settings.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getGeneralSettings,
    updateGeneralSettings,
    createPage,
    getAllPages, // Corrected from getPages to getAllPages
    getPageBySlug,
    updatePage,
    deletePage
} = require('../controllers/settingsController');

const router = express.Router();

// --- General Settings (Super Admin Only) ---
router.route('/general')
    .get(protect, authorize('super_admin'), getGeneralSettings)
    .put(protect, authorize('super_admin'), updateGeneralSettings);

// --- CMS Pages Management ---

// Create a new page & get all pages for the admin view
router.route('/pages')
    .post(protect, authorize('super_admin', 'admin'), createPage)
    .get(protect, authorize('super_admin', 'admin'), getAllPages);

// Get a single page by its slug (for public front-end)
router.route('/pages/slug/:slug').get(getPageBySlug);

// Update or delete a specific page by its ID
router.route('/pages/:id')
    .put(protect, authorize('super_admin', 'admin'), updatePage)
    .delete(protect, authorize('super_admin'), deletePage);

module.exports = router;