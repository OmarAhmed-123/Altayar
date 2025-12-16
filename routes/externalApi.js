const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getPlaceDetails,
  getDirections,
  geocodeAddress,
  getCurrentWeather,
  getWeatherForecast,
  getExchangeRate,
  searchFlights,
  searchHotels,
  sendSMS,
  sendEmail,
  getApiStatistics,
  getApiLogs,
  createApiIntegration,
  updateApiIntegration,
  getApiIntegrations,
  toggleIntegrationStatus,
  testApiIntegration
} = require('../controllers/externalApiController');

// Public routes
router.get('/maps/place/:placeId', getPlaceDetails);
router.get('/maps/directions', getDirections);
router.get('/maps/geocode', geocodeAddress);
router.get('/weather/current', getCurrentWeather);
router.get('/weather/forecast', getWeatherForecast);
router.get('/currency/rate', getExchangeRate);
router.post('/flights/search', searchFlights);
router.post('/hotels/search', searchHotels);

// Private routes
router.post('/sms/send', protect, authorize('super_admin', 'admin'), sendSMS);
router.post('/email/send', protect, authorize('super_admin', 'admin'), sendEmail);

// Admin routes
router.get('/statistics', protect, authorize('super_admin', 'admin'), getApiStatistics);
router.get('/logs', protect, authorize('super_admin', 'admin'), getApiLogs);
router.get('/admin/integrations', protect, authorize('super_admin', 'admin'), getApiIntegrations);
router.post('/admin/integrations', protect, authorize('super_admin', 'admin'), createApiIntegration);
router.put('/admin/integrations/:id', protect, authorize('super_admin', 'admin'), updateApiIntegration);
router.post('/admin/integrations/:id/toggle', protect, authorize('super_admin', 'admin'), toggleIntegrationStatus);
router.post('/admin/integrations/:id/test', protect, authorize('super_admin', 'admin'), testApiIntegration);

module.exports = router;
