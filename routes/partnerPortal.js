const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  applyToBePartner,
  getPartners,
  getPartnerDetails,
  approvePartner,
  suspendPartner,
  rejectPartner,
  getPartnerServices,
  createPartnerService,
  getPartnerBookings,
  updateBookingStatus,
  getPartnerDashboard,
  getAvailableServices,
  bookPartnerService,
  getMyPartnerBookings
} = require('../controllers/partnerPortalController');

// Public routes
router.post('/apply', applyToBePartner);
router.get('/services/available', getAvailableServices);

// Private routes
router.get('/my-bookings', protect, getMyPartnerBookings);
router.post('/services/:serviceId/book', protect, bookPartnerService);

// Admin routes
router.get('/dashboard', protect, authorize('super_admin', 'admin'), getPartnerDashboard);
router.get('/', protect, authorize('super_admin', 'admin'), getPartners);
router.get('/:id', protect, authorize('super_admin', 'admin'), getPartnerDetails);
router.get('/:id/services', protect, authorize('super_admin', 'admin'), getPartnerServices);
router.get('/:id/bookings', protect, authorize('super_admin', 'admin'), getPartnerBookings);

router.post('/:id/approve', protect, authorize('super_admin', 'admin'), approvePartner);
router.post('/:id/suspend', protect, authorize('super_admin', 'admin'), suspendPartner);
router.post('/:id/reject', protect, authorize('super_admin', 'admin'), rejectPartner);
router.post('/:id/services', protect, authorize('super_admin', 'admin'), createPartnerService);

router.put('/bookings/:id/status', protect, authorize('super_admin', 'admin'), updateBookingStatus);

module.exports = router;
