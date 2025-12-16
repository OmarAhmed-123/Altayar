const asyncHandler = require('express-async-handler');
const UserPreference = require('../models/UserPreference');
const PackageAnalytics = require('../models/PackageAnalytics');
const Package = require('../models/Package');
const { db } = require('../config/db');

// @desc    Get personalized recommendations for user
// @route   GET /api/recommendations
// @access  Private
exports.getPersonalizedRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10, category } = req.query;
  
  let recommendations = await UserPreference.getRecommendations(req.user.id, parseInt(limit));
  
  // If no personalized recommendations, get trending packages
  if (recommendations.length === 0) {
    const trending = await PackageAnalytics.getTrendingPackages(parseInt(limit));
    recommendations = trending.map(item => item.package);
  }
  
  // Filter by category if specified
  if (category) {
    recommendations = recommendations.filter(pkg => 
      pkg.category === category || pkg.destinations?.includes(category)
    );
  }
  
  res.json({
    success: true,
    data: recommendations,
    type: recommendations.length > 0 ? 'personalized' : 'trending'
  });
});

// @desc    Update user preferences
// @route   PUT /api/recommendations/preferences
// @access  Private
exports.updateUserPreferences = asyncHandler(async (req, res) => {
  const { interests, budgetRange, travelStyle, preferredDuration } = req.body;
  
  const updates = {};
  
  if (interests) {
    await UserPreference.updatePreferences(req.user.id, 'set_interests', { interests });
  }
  
  if (budgetRange) {
    await UserPreference.updatePreferences(req.user.id, 'set_budget', {
      min: budgetRange.min,
      max: budgetRange.max
    });
  }
  
  if (travelStyle) {
    await UserPreference.updatePreferences(req.user.id, 'set_travel_style', { style: travelStyle });
  }
  
  if (preferredDuration) {
    const preference = await UserPreference.query().findOne({ user_id: req.user.id });
    if (preference) {
      await preference.$query().patch({ preferred_duration: preferredDuration });
    }
  }
  
  res.json({
    success: true,
    message: 'Preferences updated successfully'
  });
});

// @desc    Track package view for recommendations
// @route   POST /api/recommendations/track-view
// @access  Private
exports.trackPackageView = asyncHandler(async (req, res) => {
  const { packageId } = req.body;
  
  if (!packageId) {
    res.status(400);
    throw new Error('Package ID is required');
  }
  
  // Track in analytics
  await PackageAnalytics.trackInteraction(packageId, req.user.id, 'view', {
    ip_address: req.ip,
    user_agent: req.get('User-Agent')
  });
  
  // Update user preferences
  await UserPreference.updatePreferences(req.user.id, 'view_package', { packageId });
  
  res.json({
    success: true,
    message: 'View tracked successfully'
  });
});

// @desc    Get trending packages
// @route   GET /api/recommendations/trending
// @access  Public
exports.getTrendingPackages = asyncHandler(async (req, res) => {
  const { limit = 10, days = 7 } = req.query;
  
  const trending = await PackageAnalytics.getTrendingPackages(parseInt(limit), parseInt(days));
  
  res.json({
    success: true,
    data: trending.map(item => item.package)
  });
});

// @desc    Get package analytics for admin
// @route   GET /api/recommendations/analytics/:packageId
// @access  Private/Admin
exports.getPackageAnalytics = asyncHandler(async (req, res) => {
  const { packageId } = req.params;
  const { days = 30 } = req.query;
  
  const metrics = await PackageAnalytics.getPackageMetrics(packageId, parseInt(days));
  
  res.json({
    success: true,
    data: {
      packageId,
      period: `${days} days`,
      metrics
    }
  });
});

// @desc    Get user behavior insights for admin
// @route   GET /api/recommendations/insights
// @access  Private/Admin
exports.getUserInsights = asyncHandler(async (req, res) => {
  const { db } = require('../config/db');
  
  // Get most popular packages
  const popularPackages = await PackageAnalytics.query()
    .where('action', 'view')
    .groupBy('package_id')
    .select('package_id', db.raw('count(*)::int as view_count'))
    .orderBy('view_count', 'desc')
    .limit(10)
    .withGraphFetched('package');
  
  // Get conversion rates
  const conversionData = await PackageAnalytics.query()
    .groupBy('action')
    .select('action', db.raw('count(*)::int as count'));
  
  // Get user engagement by day
  const engagementData = await PackageAnalytics.query()
    .select(db.raw('DATE(created_at) as date'), db.raw('count(*)::int as interactions'))
    .groupBy(db.raw('DATE(created_at)'))
    .orderBy('date', 'desc')
    .limit(30);
  
  res.json({
    success: true,
    data: {
      popularPackages,
      conversionRates: conversionData,
      dailyEngagement: engagementData
    }
  });
});
