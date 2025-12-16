// File: routes/payments.js
const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentMethods,
} = require('../controllers/paymentController');
const {
  createFawaterakInvoice,
  handleFawaterakCallback,
  checkPaymentStatus,
} = require('../controllers/fawaterakController');

const router = express.Router();

// Generic payment routes
// @route POST /api/payments/create-intent
// @access Private
router.post('/create-intent', protect, createPaymentIntent);

// @route POST /api/payments/confirm
// @access Private
router.post('/confirm', protect, confirmPayment);

// @route GET /api/payments/methods
// @access Private
router.get('/methods', protect, getPaymentMethods);

// Fawaterak payment routes
// @route POST /api/payments/fawaterak/create-invoice
// @access Private
router.post('/fawaterak/create-invoice', protect, createFawaterakInvoice);

// @route POST /api/payments/fawaterak/callback
// @access Public (called by Fawaterak)
router.post('/fawaterak/callback', handleFawaterakCallback);

// @route GET /api/payments/fawaterak/status/:transactionId
// @access Private
router.get('/fawaterak/status/:transactionId', protect, checkPaymentStatus);

module.exports = router;

