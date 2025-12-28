// File: routes/invoices.js
// Invoice routes for manual invoice creation and management

const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  createManualInvoice,
  updateManualInvoice,
  getManualInvoice,
  getInvoice,
  getAllInvoices,
  downloadInvoicePDF,
  searchClients,
  getClients,
  sendManualInvoice,
} = require('../controllers/invoiceController');

const router = express.Router();

// CRITICAL: Order matters! Specific routes must come before parameterized routes
// Handle OPTIONS preflight requests for CORS
router.options('/manual', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

router.options('/clients', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

router.options('/clients/search', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

// --- Get All Clients ---
// @route GET /api/invoices/clients
// @access Private (Admin, Accountant, Sales)
// @desc Get all clients for manual invoice creation
// CRITICAL: This must come BEFORE /clients/search and /:id route (specific route)
router.get('/clients', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), getClients);

// --- Search Clients ---
// @route GET /api/invoices/clients/search
// @access Private (Admin, Accountant, Sales)
// @desc Search for clients by name, email, or company
// CRITICAL: This must come BEFORE /:id route (specific route)
router.get('/clients/search', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), searchClients);

// --- Manual Invoice Creation ---
// @route POST /api/invoices/manual
// @access Private (Admin, Accountant, Sales)
// @desc Create a manual invoice (not linked to a booking)
// CRITICAL: This must come BEFORE /:id route to avoid route conflicts
router.post('/manual', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), createManualInvoice);

// --- Update Manual Invoice ---
// @route PUT /api/invoices/manual/:id
// @access Private (Admin, Accountant, Sales)
// @desc Update a manual invoice
// CRITICAL: This must come BEFORE /:id route
router.put('/manual/:id', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), updateManualInvoice);

// --- Get Manual Invoice ---
// @route GET /api/invoices/manual/:id
// @access Private (Admin, Accountant, Sales)
// @desc Get a specific manual invoice
// CRITICAL: This must come BEFORE /:id route
router.get('/manual/:id', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), getManualInvoice);

// --- Send Manual Invoice ---
// @route POST /api/invoices/manual/:id/send
// @access Private (Admin, Accountant, Sales)
// @desc Send invoice to client via email
// CRITICAL: This must come BEFORE /:id route
router.post('/manual/:id/send', protect, authorize('super_admin', 'admin', 'accountant', 'sales'), sendManualInvoice);

// --- Get All Invoices (Admin) ---
// @route GET /api/invoices
// @access Private (Admin, Accountant)
// CRITICAL: This must come BEFORE /:id route
router.get('/', protect, authorize('super_admin', 'admin', 'accountant'), getAllInvoices);

// --- Download Invoice PDF ---
// @route GET /api/invoices/:id/pdf
// @access Private (Admin, Accountant, Sales, or invoice owner)
// CRITICAL: This must come BEFORE /:id route (more specific)
router.get('/:id/pdf', protect, downloadInvoicePDF);

// --- Get Invoice ---
// @route GET /api/invoices/:id
// @access Private (Admin, Accountant, Sales, or invoice owner)
// CRITICAL: This must come LAST (parameterized route)
router.get('/:id', protect, getInvoice);

module.exports = router;

