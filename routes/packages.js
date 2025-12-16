// File: routes/packages.js
const express = require('express');
const router = express.Router();
const { 
    getPackages, 
    getPackageById, 
    createPackage, 
    updatePackage, 
    deletePackage,
    getPackageBookings
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/auth');

// Chain GET (public) and POST (admin) for the root route
router.route('/')
    .get(getPackages)
    .post(protect, authorize('super_admin', 'admin'), createPackage);

// Get bookings related to a package (must come before /:id route)
router.get('/:id/bookings', protect, authorize('super_admin', 'admin', 'accountant'), getPackageBookings);

// Chain GET (public), PUT (admin), and DELETE (super_admin) for a specific package
router.route('/:id')
    .get(getPackageById)
    .put(protect, authorize('super_admin', 'admin'), updatePackage)
    .delete(protect, authorize('super_admin'), deletePackage);

// This is the most important line, ensure it exists at the very end
module.exports = router;