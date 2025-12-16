const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const UserVisitedLocation = require('../models/UserVisitedLocation');
const CountryCurrency = require('../models/CountryCurrency');
const Currency = require('../models/Currency');
const Language = require('../models/Language');

// @desc    Update user location
// @route   PUT /api/geolocation/update-location
// @access  Private
exports.updateUserLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, countryCode, timezone } = req.body;

  if (!latitude || !longitude) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  // Auto-detect currency based on country
  let currency = null;
  if (countryCode) {
    const countryCurrency = await CountryCurrency.getCurrencyByCountry(countryCode);
    if (countryCurrency) {
      currency = await Currency.getByCode(countryCurrency.currency_code);
    }
  }

  // Update user location
  const updateData = {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    country_code: countryCode,
    timezone: timezone,
    last_location_update: new Date()
  };

  if (currency) {
    updateData.currency_id = currency.id;
  }

  const updatedUser = await User.query().findById(req.user.id).patchAndFetch(updateData);

  res.json({
    success: true,
    data: {
      user: updatedUser,
      detected_currency: currency
    },
    message: 'Location updated successfully'
  });
});

// @desc    Get user's visited locations
// @route   GET /api/geolocation/visited-locations
// @access  Private
exports.getVisitedLocations = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;

  const locations = await UserVisitedLocation.getUserVisitedLocations(req.user.id, parseInt(limit));

  res.json({
    success: true,
    data: locations
  });
});

// @desc    Add visited location
// @route   POST /api/geolocation/add-location
// @access  Private
exports.addVisitedLocation = asyncHandler(async (req, res) => {
  const { 
    locationName, 
    latitude, 
    longitude, 
    country, 
    city, 
    visitType, 
    bookingId, 
    visitDate, 
    notes 
  } = req.body;

  if (!locationName || !latitude || !longitude || !country) {
    res.status(400);
    throw new Error('Location name, coordinates, and country are required');
  }

  const location = await UserVisitedLocation.addVisitedLocation(req.user.id, {
    locationName,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    country,
    city,
    visitType,
    bookingId,
    visitDate: visitDate ? new Date(visitDate) : new Date(),
    notes
  });

  res.status(200).json({
    success: true,
    data: location,
    message: 'Location added successfully'
  });
});

// @desc    Get user's travel map data
// @route   GET /api/geolocation/map-data
// @access  Private
exports.getMapData = asyncHandler(async (req, res) => {
  const mapData = await UserVisitedLocation.getMapData(req.user.id);

  res.json({
    success: true,
    data: mapData
  });
});

// @desc    Get travel statistics
// @route   GET /api/geolocation/travel-stats
// @access  Private
exports.getTravelStatistics = asyncHandler(async (req, res) => {
  const stats = await UserVisitedLocation.getTravelStatistics(req.user.id);

  res.json({
    success: true,
    data: stats
  });
});

// @desc    Get country currencies
// @route   GET /api/geolocation/country-currencies
// @access  Public
exports.getCountryCurrencies = asyncHandler(async (req, res) => {
  const currencies = await CountryCurrency.getAllCountryCurrencies();

  res.json({
    success: true,
    data: currencies
  });
});

// @desc    Get popular currencies
// @route   GET /api/geolocation/popular-currencies
// @access  Public
exports.getPopularCurrencies = asyncHandler(async (req, res) => {
  const currencies = await CountryCurrency.getPopularCurrencies();

  res.json({
    success: true,
    data: currencies
  });
});

// @desc    Auto-detect currency from location
// @route   POST /api/geolocation/detect-currency
// @access  Public
exports.detectCurrencyFromLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, countryCode } = req.body;

  let currency = null;

  if (countryCode) {
    const countryCurrency = await CountryCurrency.getCurrencyByCountry(countryCode);
    if (countryCurrency) {
      currency = await Currency.getByCode(countryCurrency.currency_code);
    }
  } else if (latitude && longitude) {
    currency = await CountryCurrency.detectCurrencyFromLocation(latitude, longitude);
  }

  res.json({
    success: true,
    data: {
      currency,
      country_code: countryCode
    }
  });
});

// @desc    Get user's current location info
// @route   GET /api/geolocation/current-location
// @access  Private
exports.getCurrentLocationInfo = asyncHandler(async (req, res) => {
  const user = await User.query()
    .findById(req.user.id)
    .withGraphFetched('[language, currency]')
    .first();

  const locationInfo = {
    latitude: user.latitude,
    longitude: user.longitude,
    country_code: user.country_code,
    timezone: user.timezone,
    last_location_update: user.last_location_update,
    language: user.language,
    currency: user.currency
  };

  res.json({
    success: true,
    data: locationInfo
  });
});

// @desc    Get languages with Arabic first
// @route   GET /api/geolocation/languages-ordered
// @access  Public
exports.getLanguagesOrdered = asyncHandler(async (req, res) => {
  const languages = await Language.getActiveLanguages();
  
  // Sort languages: Arabic first, then English, then others
  const sortedLanguages = languages.sort((a, b) => {
    if (a.code === 'ar') return -1;
    if (b.code === 'ar') return 1;
    if (a.code === 'en') return -1;
    if (b.code === 'en') return 1;
    return a.name.localeCompare(b.name);
  });

  res.json({
    success: true,
    data: sortedLanguages
  });
});

// @desc    Get currencies with popular ones first
// @route   GET /api/geolocation/currencies-ordered
// @access  Public
exports.getCurrenciesOrdered = asyncHandler(async (req, res) => {
  const currencies = await Currency.getActiveCurrencies();
  
  // Sort currencies: USD first, then EUR, then others
  const sortedCurrencies = currencies.sort((a, b) => {
    if (a.code === 'USD') return -1;
    if (b.code === 'USD') return 1;
    if (a.code === 'EUR') return -1;
    if (b.code === 'EUR') return 1;
    if (a.code === 'SAR') return -1;
    if (b.code === 'SAR') return 1;
    if (a.code === 'EGP') return -1;
    if (b.code === 'EGP') return 1;
    return a.name.localeCompare(b.name);
  });

  res.json({
    success: true,
    data: sortedCurrencies
  });
});
