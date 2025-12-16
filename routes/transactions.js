// File: routes/transactions.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const { 
    getUserTransactions, 
    getAllTransactions, 
    generateInvoice,
    getSalesReports,
    getPaymentHistory
} = require('../controllers/transactionController');

const router = express.Router();

// --- Customer and General User Access ---
// @route GET /api/transactions
// @access Private (Get current user's transaction history)
// @rateLimit Applied to prevent duplicate requests
router.get('/', protect, generalLimiter, getUserTransactions);

// --- Admin/Employee Management ---
// @route GET /api/transactions/all
// @access Private (Admin, Accountant)
router.get('/all', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), getAllTransactions);

// --- Reports ---
// @route GET /api/transactions/invoice/:bookingId
// @access Private (Admin, Accountant, Sales)
router.get('/invoice/:bookingId', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), generateInvoice);

// @route GET /api/transactions/sales
// @access Private (Admin, Accountant)
router.get('/sales', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), getSalesReports);

// @route GET /api/transactions/payment-history
// @access Private (Admin, Accountant)
router.get('/payment-history', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), getPaymentHistory);

module.exports = router;
