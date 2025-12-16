/**
 * Support Tickets Routes
 */

const express = require('express');
const router = express.Router();
const {
  createTicketFromChat,
  getMyTickets,
  getAllTickets,
  updateTicketStatus
} = require('../controllers/supportTicketController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Create ticket from chat
router.post('/from-chat', createTicketFromChat);

// Get user's tickets
router.get('/my', getMyTickets);

// Get all tickets (Admin/Staff)
router.get('/', authorize('admin', 'super_admin', 'sales', 'reservations'), getAllTickets);

// Update ticket status
router.put('/:id', updateTicketStatus);

module.exports = router;

