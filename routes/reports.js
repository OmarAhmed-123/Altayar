// File: routes/reports.js
const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { 
    generateInvoice, 
    getSalesReports, 
    getPaymentHistory 
} = require('../controllers/transactionController');
const { 
    generateUserReportPDF,
    getUserReportData,
    getReportDownloadUrl,
    getPaymentHistory: getPaymentHistoryFromReport
} = require('../controllers/reportController');

const router = express.Router();

// --- User Reports Access ---

// @route GET /api/reports/user-pdf
// @access Private
router.get('/user-pdf', protect, generateUserReportPDF);

// @route GET /api/reports/user-data
// @access Private
router.get('/user-data', protect, getUserReportData);

// @route GET /api/reports/download-url
// @access Private
// Returns a download URL with token in query string for direct PDF download
router.get('/download-url', protect, getReportDownloadUrl);

// @route GET /api/reports/payment-history
// @access Private (User or Admin/Accountant)
router.get('/payment-history', protect, (req, res, next) => {
    // If user is admin/accountant, use transactionController version
    // Otherwise, use reportController version for user's own history
    if (req.user.role === 'super_admin' || req.user.role === 'admin' || req.user.role === 'accountant') {
        return getPaymentHistory(req, res, next);
    }
    return getPaymentHistoryFromReport(req, res, next);
});

// --- Employee/Admin Reports Access ---

// @route GET /api/reports/sales
// @access Private (Admin, Accountant)
router.get('/sales', protect, authorize('super_admin', 'admin', 'accountant'), getSalesReports);

// @route GET /api/reports/invoice/:bookingId
// @access Private (Admin, Accountant, Sales)
router.get('/invoice/:bookingId', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), generateInvoice);

module.exports = router;
