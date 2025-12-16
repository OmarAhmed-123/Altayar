const express = require('express');
const router = express.Router();
const { getActiveAds, createAd, updateAd, deleteAd, sendAdToUsers } = require('../controllers/adController');
const { protect, authorize } = require('../middleware/auth');
const { uploadAdImage } = require('../middleware/upload');

router.route('/')
    .get(getActiveAds) // Public
    .post(
        protect,
        authorize('super_admin', 'admin', 'sales'),
        uploadAdImage,
        createAd
    ); // Admin

router.route('/:id')
    .put(
        protect,
        authorize('super_admin', 'admin'),
        uploadAdImage,
        updateAd
    ) // Admin
    .delete(protect, authorize('super_admin', 'admin'), deleteAd); // Admin

router.route('/send/:id')
    .post(protect, authorize('super_admin', 'admin', 'sales'), sendAdToUsers); // Admin

module.exports = router;