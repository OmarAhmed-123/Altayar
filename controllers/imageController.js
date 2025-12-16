// File: controllers/imageController.js
const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Unsplash API Configuration (Free tier - no API key needed for basic usage)
// For production, you should use your own Unsplash API key
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

// Image mapping for different categories
const IMAGE_CATEGORIES = {
  // Services
  flight: 'airplane',
  hotel: 'hotel',
  restaurant: 'restaurant',
  activity: 'travel',
  
  // Actions
  booking: 'booking',
  trip: 'trip',
  review: 'review',
  profile: 'profile',
  membership: 'membership',
  
  // Status
  pending: 'waiting',
  confirmed: 'success',
  cancelled: 'cancel',
  completed: 'check',
  
  // Features
  search: 'search',
  notification: 'notification',
  settings: 'settings',
  language: 'language',
};

// Helper function to get image from Unsplash
const getUnsplashImage = async (query, width = 200, height = 200) => {
  try {
    // Use Unsplash Source API (no key required, but rate limited)
    // Format: https://source.unsplash.com/{width}x{height}/?{keywords}
    // For better results, we can use specific keywords
    const keywords = query.split('+').join(',');
    const imageUrl = `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keywords)}`;
    return imageUrl;
  } catch (error) {
    console.error('Error getting Unsplash image:', error);
    // Fallback to placeholder with Vodafone red color
    return `https://via.placeholder.com/${width}x${height}/E60012/FFFFFF?text=${encodeURIComponent(query)}`;
  }
};

// @desc    Get image URL for a category/keyword
// @route   GET /api/images/:category
// @access  Public
exports.getImageByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { width = 200, height = 200, query } = req.query;

  // Map category to search query
  const searchQuery = query || IMAGE_CATEGORIES[category] || category;

  try {
    // Return null or empty string instead of actual image URL
    // User requested that images should not appear
    res.json({
      success: true,
      imageUrl: null,
      category,
      query: searchQuery,
      message: 'Image service disabled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get image',
      error: error.message,
    });
  }
});

// @desc    Get multiple images for categories
// @route   POST /api/images/batch
// @access  Public
exports.getBatchImages = asyncHandler(async (req, res) => {
  const { categories, width = 200, height = 200 } = req.body;

  if (!Array.isArray(categories)) {
    res.status(400);
    throw new Error('Categories must be an array');
  }

  try {
    // Return null or empty URLs instead of actual image URLs
    // User requested that images should not appear
    const images = categories.map((category) => {
      const searchQuery = IMAGE_CATEGORIES[category] || category;
      return {
        category,
        imageUrl: null,
        query: searchQuery,
      };
    });

    res.json({
      success: true,
      images,
      message: 'Image service disabled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get batch images',
      error: error.message,
    });
  }
});

// @desc    Get service images (for home screen features)
// @route   GET /api/images/services
// @access  Public
exports.getServiceImages = asyncHandler(async (req, res) => {
  const services = [
    { id: 1, name: 'رحلات جوية', category: 'flight', query: 'airplane travel' },
    { id: 2, name: 'فنادق', category: 'hotel', query: 'hotel resort' },
    { id: 3, name: 'مطاعم', category: 'restaurant', query: 'restaurant food' },
    { id: 4, name: 'أنشطة', category: 'activity', query: 'travel adventure' },
  ];

  try {
    // Return null or empty URLs instead of actual image URLs
    // User requested that images should not appear
    const images = services.map((service) => {
      return {
        ...service,
        imageUrl: null,
      };
    });

    res.json({
      success: true,
      services: images,
      message: 'Image service disabled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get service images',
      error: error.message,
    });
  }
});

