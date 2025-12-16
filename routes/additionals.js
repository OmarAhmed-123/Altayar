const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
    getAdditionals,
    getAdditionalById,
    createAdditional,
    updateAdditional,
    deleteAdditional
} = require('../controllers/additionalController');

const router = express.Router();

// Public: Get all active additionals
router.route('/').get(getAdditionals);

// Public: Get single additional
router.route('/:id').get(getAdditionalById);

// Admin: Create, update, delete additionals
router.route('/')
    .post(protect, authorize('super_admin', 'admin', 'data_entry'), createAdditional);

router.route('/:id')
    .put(protect, authorize('super_admin', 'admin', 'data_entry'), updateAdditional)
    .delete(protect, authorize('super_admin', 'admin'), deleteAdditional);

module.exports = router;

