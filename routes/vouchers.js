const express = require('express');
const { 
    getMyVouchers, 
    getAllVouchersAdmin, 
    useVoucher,
    createManualVoucher
} = require('../controllers/voucherController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer: Get my unused vouchers
router.route('/my').get(protect, getMyVouchers);

// Customer: Use voucher by code
router.route('/use/:code').put(protect, useVoucher);

// Admin/Agent: Get all vouchers
router.route('/admin')
    .get(protect, authorize('super_admin', 'admin', 'sales', 'accountant', 'agent'), getAllVouchersAdmin);

// Admin/Agent: Create manual voucher
router.route('/')
    .post(protect, authorize('super_admin', 'admin', 'sales', 'agent'), createManualVoucher);

module.exports = router;
