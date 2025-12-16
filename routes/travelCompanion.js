const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/uploadMiddleware');
const {
  createItineraryFromBooking,
  createCustomItinerary,
  getUserItineraries,
  getItineraryDetails,
  updateItinerary,
  shareItinerary,
  getSharedItinerary,
  updateChecklistItem,
  uploadTravelDocument,
  getTravelDocuments,
  deleteTravelDocument,
  getTravelCompanionDashboard
} = require('../controllers/travelCompanionController');

// Public routes
router.get('/shared/:shareCode', getSharedItinerary);

// Private routes
router.get('/dashboard', protect, getTravelCompanionDashboard);
router.get('/itineraries', protect, getUserItineraries);
router.get('/itinerary/:id', protect, getItineraryDetails);
router.get('/documents', protect, getTravelDocuments);

router.post('/itinerary/from-booking/:bookingId', protect, createItineraryFromBooking);
router.post('/itinerary', protect, createCustomItinerary);
router.post('/itinerary/:id/documents', protect, upload.single('document'), uploadTravelDocument);

router.put('/itinerary/:id', protect, updateItinerary);
router.put('/itinerary/:id/share', protect, shareItinerary);
router.put('/itinerary/:id/checklist/:itemId', protect, updateChecklistItem);

router.delete('/documents/:id', protect, deleteTravelDocument);

module.exports = router;
