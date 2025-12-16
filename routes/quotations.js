/**
 * Quotations Routes
 */

const express = require('express');
const router = express.Router();
const {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  sendQuotation,
  generateQuotationPDF,
  deleteQuotation
} = require('../controllers/quotationController');
const { protect, authorize } = require('../middleware/auth');

// Get all quotations (Admin/Sales only)
router.get('/', protect, authorize('admin', 'super_admin', 'sales', 'reservations'), getQuotations);

// Get quotation by ID
router.get('/:id', protect, authorize('admin', 'super_admin', 'sales', 'reservations', 'customer'), getQuotationById);

// Create new quotation (Sales/Admin only)
router.post('/', protect, authorize('admin', 'super_admin', 'sales', 'reservations'), createQuotation);

// Update quotation
router.put('/:id', protect, authorize('admin', 'super_admin', 'sales', 'reservations'), updateQuotation);

// Send quotation to customer
router.post('/:id/send', protect, authorize('admin', 'super_admin', 'sales', 'reservations'), sendQuotation);

// Generate PDF - Allow token in query string for direct downloads
// Note: protect middleware already handles token from query string
router.get('/:id/pdf', protect, authorize('admin', 'super_admin', 'sales', 'reservations', 'customer'), generateQuotationPDF);

// Delete quotation
router.delete('/:id', protect, authorize('admin', 'super_admin', 'sales', 'reservations'), deleteQuotation);

module.exports = router;

