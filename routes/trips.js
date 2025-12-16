const express = require('express');
const { 
    createTrip, 
    getMyTrips,
    updateTrip,
    deleteTrip,
    updateTripStatus,
    getAllTripsAdmin
} = require('../controllers/tripController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer: Create/save trip
router.route('/').post(protect, createTrip);

// Customer: Get my trips
router.route('/my').get(protect, getMyTrips);

// Admin: Get all submitted trips
router.route('/admin')
    .get(protect, authorize('super_admin', 'admin', 'reservations'), getAllTripsAdmin);

// Customer: Update or delete their own trip
router.route('/:id')
    .put(protect, updateTrip)
    .delete(protect, deleteTrip);

// Admin/Reservations: Update trip status
router.route('/status/:id')
    .put(protect, authorize('super_admin', 'admin', 'reservations'), updateTripStatus);

module.exports = router;
