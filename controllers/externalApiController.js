const asyncHandler = require('express-async-handler');
const ApiIntegration = require('../models/ApiIntegration');
const ApiLog = require('../models/ApiLog');
const externalApiService = require('../services/externalApiService');

// @desc    Get place details from Google Maps
// @route   GET /api/external/maps/place/:placeId
// @access  Public
exports.getPlaceDetails = asyncHandler(async (req, res) => {
  const { placeId } = req.params;

  const placeDetails = await externalApiService.getPlaceDetails(placeId);

  res.json({
    success: true,
    data: placeDetails
  });
});

// @desc    Get directions from Google Maps
// @route   GET /api/external/maps/directions
// @access  Public
exports.getDirections = asyncHandler(async (req, res) => {
  const { origin, destination, mode = 'driving' } = req.query;

  if (!origin || !destination) {
    res.status(400);
    throw new Error('Origin and destination are required');
  }

  const directions = await externalApiService.getDirections(origin, destination, mode);

  res.json({
    success: true,
    data: directions
  });
});

// @desc    Geocode address
// @route   GET /api/external/maps/geocode
// @access  Public
exports.geocodeAddress = asyncHandler(async (req, res) => {
  const { address } = req.query;

  if (!address) {
    res.status(400);
    throw new Error('Address is required');
  }

  const geocode = await externalApiService.geocodeAddress(address);

  res.json({
    success: true,
    data: geocode
  });
});

// @desc    Get current weather
// @route   GET /api/external/weather/current
// @access  Public
exports.getCurrentWeather = asyncHandler(async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const weather = await externalApiService.getCurrentWeather(lat, lon);

  res.json({
    success: true,
    data: weather
  });
});

// @desc    Get weather forecast
// @route   GET /api/external/weather/forecast
// @access  Public
exports.getWeatherForecast = asyncHandler(async (req, res) => {
  const { lat, lon, days = 5 } = req.query;

  if (!lat || !lon) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const forecast = await externalApiService.getWeatherForecast(lat, lon, parseInt(days));

  res.json({
    success: true,
    data: forecast
  });
});

// @desc    Get exchange rate
// @route   GET /api/external/currency/rate
// @access  Public
exports.getExchangeRate = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    res.status(400);
    throw new Error('From and to currencies are required');
  }

  const rate = await externalApiService.getExchangeRate(from, to);

  res.json({
    success: true,
    data: rate
  });
});

// @desc    Search flights
// @route   POST /api/external/flights/search
// @access  Public
exports.searchFlights = asyncHandler(async (req, res) => {
  const { origin, destination, departureDate, returnDate, passengers = 1 } = req.body;

  if (!origin || !destination || !departureDate) {
    res.status(400);
    throw new Error('Origin, destination, and departure date are required');
  }

  const flights = await externalApiService.searchFlights(origin, destination, departureDate, returnDate, passengers);

  res.json({
    success: true,
    data: flights
  });
});

// @desc    Search hotels
// @route   POST /api/external/hotels/search
// @access  Public
exports.searchHotels = asyncHandler(async (req, res) => {
  const { location, checkIn, checkOut, guests = 1 } = req.body;

  if (!location || !checkIn || !checkOut) {
    res.status(400);
    throw new Error('Location, check-in, and check-out dates are required');
  }

  const hotels = await externalApiService.searchHotels(location, checkIn, checkOut, guests);

  res.json({
    success: true,
    data: hotels
  });
});

// @desc    Send SMS
// @route   POST /api/external/sms/send
// @access  Private/Admin
exports.sendSMS = asyncHandler(async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    res.status(400);
    throw new Error('Phone number and message are required');
  }

  const result = await externalApiService.sendSMS(to, message);

  res.json({
    success: true,
    data: result,
    message: 'SMS sent successfully'
  });
});

// @desc    Send email
// @route   POST /api/external/email/send
// @access  Private/Admin
exports.sendEmail = asyncHandler(async (req, res) => {
  const { to, subject, body, isHtml = false } = req.body;

  if (!to || !subject || !body) {
    res.status(400);
    throw new Error('To, subject, and body are required');
  }

  const result = await externalApiService.sendEmail(to, subject, body, isHtml);

  res.json({
    success: true,
    data: result,
    message: 'Email sent successfully'
  });
});

// @desc    Get API integration statistics
// @route   GET /api/external/statistics
// @access  Private/Admin
exports.getApiStatistics = asyncHandler(async (req, res) => {
  const { serviceName } = req.query;

  let stats;
  if (serviceName) {
    stats = await externalApiService.getIntegrationStats(serviceName);
  } else {
    stats = await externalApiService.getAllIntegrationStats();
  }

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Get API logs
// @route   GET /api/external/logs
// @access  Private/Admin
exports.getApiLogs = asyncHandler(async (req, res) => {
  const { serviceName, status, limit = 100 } = req.query;

  let logs;
  if (status === 'error') {
    logs = await ApiLog.getErrorLogs(parseInt(limit));
  } else if (serviceName) {
    const integration = await ApiIntegration.getByServiceName(serviceName);
    if (integration) {
      logs = await ApiLog.getLogsByIntegration(integration.id, parseInt(limit));
    } else {
      logs = [];
    }
  } else {
    logs = await ApiLog.getRecentLogs(parseInt(limit));
  }

  res.json({
    success: true,
    data: logs
  });
});

// @desc    Create API integration (Admin)
// @route   POST /api/external/admin/integrations
// @access  Private/Admin
exports.createApiIntegration = asyncHandler(async (req, res) => {
  const {
    serviceName,
    serviceType,
    apiKey,
    apiSecret,
    baseUrl,
    configuration,
    isProduction,
    rateLimit
  } = req.body;

  const integration = await ApiIntegration.query().insert({
    service_name: serviceName,
    service_type: serviceType,
    api_key: apiKey,
    api_secret: apiSecret,
    base_url: baseUrl,
    configuration: configuration || {},
    is_production: isProduction || false,
    rate_limit: rateLimit || 1000
  });

  // Update service cache
  await externalApiService.initialize();

  res.status(200).json({
    success: true,
    data: integration,
    message: 'API integration created successfully'
  });
});

// @desc    Update API integration (Admin)
// @route   PUT /api/external/admin/integrations/:id
// @access  Private/Admin
exports.updateApiIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const integration = await ApiIntegration.query().findById(id);
  if (!integration) {
    res.status(404);
    throw new Error('Integration not found');
  }

  const updatedIntegration = await integration.$query().patchAndFetch(updateData);

  // Update service cache
  await externalApiService.initialize();

  res.json({
    success: true,
    data: updatedIntegration,
    message: 'API integration updated successfully'
  });
});

// @desc    Get all API integrations (Admin)
// @route   GET /api/external/admin/integrations
// @access  Private/Admin
exports.getApiIntegrations = asyncHandler(async (req, res) => {
  const { serviceType, isActive } = req.query;

  let query = ApiIntegration.query().orderBy('created_at', 'desc');

  if (serviceType) {
    query = query.where('service_type', serviceType);
  }

  if (isActive !== undefined) {
    query = query.where('is_active', isActive === 'true');
  }

  const integrations = await query;

  res.json({
    success: true,
    data: integrations
  });
});

// @desc    Toggle integration status (Admin)
// @route   POST /api/external/admin/integrations/:id/toggle
// @access  Private/Admin
exports.toggleIntegrationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const integration = await ApiIntegration.query().findById(id);
  if (!integration) {
    res.status(404);
    throw new Error('Integration not found');
  }

  const updatedIntegration = await integration.$query().patch({
    is_active: !integration.is_active
  });

  // Update service cache
  await externalApiService.initialize();

  res.json({
    success: true,
    data: updatedIntegration,
    message: `Integration ${updatedIntegration.is_active ? 'activated' : 'deactivated'} successfully`
  });
});

// @desc    Test API integration (Admin)
// @route   POST /api/external/admin/integrations/:id/test
// @access  Private/Admin
exports.testApiIntegration = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { endpoint, method = 'GET', data } = req.body;

  const integration = await ApiIntegration.query().findById(id);
  if (!integration) {
    res.status(404);
    throw new Error('Integration not found');
  }

  try {
    const result = await externalApiService.makeRequest(
      integration.service_name,
      endpoint,
      method,
      data
    );

    res.json({
      success: true,
      data: result,
      message: 'API test successful'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      message: 'API test failed'
    });
  }
});
