const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  updateUserLocation,
  getVisitedLocations,
  addVisitedLocation,
  getMapData,
  getTravelStatistics,
  getCountryCurrencies,
  getPopularCurrencies,
  detectCurrencyFromLocation,
  getCurrentLocationInfo,
  getLanguagesOrdered,
  getCurrenciesOrdered
} = require('../controllers/geolocationController');

// Public routes
router.get('/country-currencies', getCountryCurrencies);
router.get('/popular-currencies', getPopularCurrencies);
router.get('/languages-ordered', getLanguagesOrdered);
router.get('/currencies-ordered', getCurrenciesOrdered);
router.post('/detect-currency', detectCurrencyFromLocation);

// Private routes
router.get('/current-location', protect, getCurrentLocationInfo);
router.get('/visited-locations', protect, getVisitedLocations);
router.get('/map-data', protect, getMapData);
router.get('/travel-stats', protect, getTravelStatistics);
router.put('/update-location', protect, updateUserLocation);
router.post('/add-location', protect, addVisitedLocation);

module.exports = router;
