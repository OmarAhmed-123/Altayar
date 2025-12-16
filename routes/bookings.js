const express = require('express');
const { 
    createBooking, 
    getAllBookingsAdmin, 
    getMyActivities,
    getBookingById,
    updateBookingStatus,
    createBookingByAdmin,
    deleteBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Customer: Create booking/order
router.route('/').post(protect, createBooking);

// Customer: Get my activities/orders (with rate limiting to prevent duplicate requests)
router.route('/myactivities').get(protect, generalLimiter, getMyActivities);

// Admin/Staff/Agent: Get all bookings
// Admin/SuperAdmin: Create booking for any user
router.route('/admin')
    .get(protect, authorize('super_admin', 'admin', 'reservations', 'accountant', 'agent', 'sales'), getAllBookingsAdmin)
    .post(protect, authorize('super_admin', 'admin'), createBookingByAdmin);

// Customer/Admin/Agent: Get single booking by ID
// Admin/Staff/Agent: Update booking status
// Admin/SuperAdmin: Delete booking
router.route('/:id')
    .get(protect, getBookingById)
    .put(protect, authorize('super_admin', 'admin', 'reservations', 'agent', 'sales'), updateBookingStatus)
    .delete(protect, authorize('super_admin', 'admin'), deleteBooking);

module.exports = router;
