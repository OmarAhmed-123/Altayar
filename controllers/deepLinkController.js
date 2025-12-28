// Deep Link Controller
// Handles creation and management of deep links for mobile app

const asyncHandler = require('../middleware/asyncHandler');
const firebaseDynamicLinks = require('../services/firebaseDynamicLinks');

/**
 * Generate a deep link for sharing content
 * @route POST /api/deep-links/create
 * @access Private
 */
const createDeepLink = asyncHandler(async (req, res) => {
  const { type, id, params = {} } = req.body;
  
  if (!type || !id) {
    return res.status(400).json({
      success: false,
      message: 'Type and ID are required'
    });
  }

  // Base URL for deep links (should be your domain)
  const baseUrl = process.env.DEEP_LINK_BASE_URL || 'https://altayar.com';
  
  // Generate deep link based on type - comprehensive feature mapping
  let deepLinkPath = '';
  let webFallbackPath = '';
  
  // Helper function to map types to paths
  const getPathForType = (type, id) => {
    switch (type) {
      // Core Content Types
      case 'package':
        return { deep: `/package/${id}`, web: `/packages/${id}` };
      case 'trip':
        return { deep: `/trip/${id}`, web: `/trips/${id}` };
      case 'booking':
        return { deep: `/booking/${id}`, web: `/bookings/${id}` };
      case 'voucher':
        return { deep: `/voucher/${id}`, web: `/vouchers/${id}` };
      case 'membership':
        return { deep: `/membership/${id}`, web: `/memberships/${id}` };
      case 'profile':
        return { deep: `/profile/${id}`, web: `/profiles/${id}` };
      case 'blog':
        return { deep: `/blog/${id}`, web: `/blogs/${id}` };
      case 'comment':
        return { deep: `/comment/${id}`, web: `/comments/${id}` };
      case 'ad':
        return { deep: `/ad/${id}`, web: `/ads/${id}` };
      case 'transaction':
        return { deep: `/transaction/${id}`, web: `/transactions/${id}` };
      case 'report':
        return { deep: `/report/${id}`, web: `/reports/${id}` };
      case 'user':
        return { deep: `/user/${id}`, web: `/users/${id}` };
      case 'review':
        return { deep: `/review/${id}`, web: `/reviews/${id}` };
      case 'document':
        return { deep: `/document/${id}`, web: `/documents/${id}` };
      case 'notification':
        return { deep: `/notification/${id}`, web: `/notifications/${id}` };
      case 'quotation':
        return { deep: `/quotation/${id}`, web: `/quotations/${id}` };
      case 'support-ticket':
        return { deep: `/support-ticket/${id}`, web: `/support-tickets/${id}` };
      case 'affiliate':
        return { deep: `/affiliate/${id}`, web: `/affiliates/${id}` };
      case 'partner':
        return { deep: `/partner/${id}`, web: `/partners/${id}` };
      case 'marketing-campaign':
        return { deep: `/marketing-campaign/${id}`, web: `/marketing/${id}` };
      case 'recommendation':
        return { deep: `/recommendation/${id}`, web: `/recommendations/${id}` };
      case 'travel-companion':
        return { deep: `/travel-companion/${id}`, web: `/travel-companion/${id}` };
      // Pages/Sections (no ID required)
      case 'dashboard':
        return { deep: `/dashboard`, web: `/dashboard` };
      case 'accounting':
      case 'wallet':
        return { deep: `/accounting`, web: `/accounting` };
      case 'sales':
        return { deep: `/sales`, web: `/sales` };
      case 'activities':
      case 'activity':
        return { deep: `/activities`, web: `/activities` };
      case 'content':
        return { deep: `/content`, web: `/content` };
      case 'chat':
      case 'communication':
        return { deep: `/chat`, web: `/chat` };
      case 'settings':
        return { deep: `/settings`, web: `/settings` };
      case 'trip-maker':
        return { deep: `/trip-maker`, web: `/trip-maker` };
      case 'user-management':
      case 'rbac':
        return { deep: `/user-management`, web: `/user-management` };
      case 'home':
        return { deep: `/home`, web: `/home` };
      case 'auth':
      case 'login':
        return { deep: `/auth`, web: `/auth` };
      default:
        return null;
    }
  };

  const pathInfo = getPathForType(type, id);
  if (!pathInfo) {
    return res.status(400).json({
      success: false,
      message: `Invalid type: ${type}. Supported types: package, trip, booking, voucher, membership, profile, blog, comment, ad, transaction, report, user, review, document, notification, quotation, support-ticket, affiliate, partner, marketing-campaign, recommendation, travel-companion, dashboard, accounting, wallet, sales, activities, activity, content, chat, communication, settings, trip-maker, user-management, rbac, home, auth, login`
    });
  }
  
  deepLinkPath = pathInfo.deep;
  webFallbackPath = pathInfo.web;

  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key]);
    }
  });
  
  const queryString = queryParams.toString();
  const fullQueryString = queryString ? `?${queryString}` : '';

  // Generate deep link (for app)
  const deepLink = `${baseUrl}${deepLinkPath}${fullQueryString}`;
  
  // Generate web fallback URL (for landing page)
  const webFallbackUrl = process.env.LANDING_PAGE_URL 
    ? `${process.env.LANDING_PAGE_URL}${webFallbackPath}${fullQueryString}`
    : `${baseUrl}${webFallbackPath}${fullQueryString}`;

  // Generate custom scheme link (altayar://)
  const customSchemeLink = `altayar://open${deepLinkPath}${fullQueryString}`;

  // Create Firebase Dynamic Link (short, shareable link)
  let firebaseDynamicLink = null;
  try {
    firebaseDynamicLink = await firebaseDynamicLinks.createShareableLink(
      type,
      id,
      params,
      {}
    );
  } catch (error) {
    console.warn('⚠️ [Deep Link] Firebase Dynamic Link creation failed:', error.message);
    // Continue without Firebase Dynamic Link
  }

  res.status(200).json({
    success: true,
    data: {
      deepLink, // HTTPS link (App Links / Universal Links)
      customSchemeLink, // Custom scheme (altayar://)
      webFallbackUrl, // Web landing page URL
      firebaseDynamicLink: firebaseDynamicLink || deepLink, // Firebase Dynamic Link (short link)
      type,
      id,
      params,
      shareableUrl: firebaseDynamicLink || deepLink, // Use Firebase Dynamic Link if available
    },
    message: 'Deep link created successfully'
  });
});

/**
 * Generate a shareable link with metadata
 * @route POST /api/deep-links/share
 * @access Private
 */
const createShareableLink = asyncHandler(async (req, res) => {
  const { type, id, title, description, imageUrl, params = {} } = req.body;
  
  if (!type || !id) {
    return res.status(400).json({
      success: false,
      message: 'Type and ID are required'
    });
  }

  // Base URL for deep links (should be your domain)
  const baseUrl = process.env.DEEP_LINK_BASE_URL || 'https://altayar.com';
  
  // Generate deep link based on type - comprehensive feature mapping
  let deepLinkPath = '';
  let webFallbackPath = '';
  
  // Helper function to map types to paths
  const getPathForType = (type, id) => {
    switch (type) {
      // Core Content Types
      case 'package':
        return { deep: `/package/${id}`, web: `/packages/${id}` };
      case 'trip':
        return { deep: `/trip/${id}`, web: `/trips/${id}` };
      case 'booking':
        return { deep: `/booking/${id}`, web: `/bookings/${id}` };
      case 'voucher':
        return { deep: `/voucher/${id}`, web: `/vouchers/${id}` };
      case 'membership':
        return { deep: `/membership/${id}`, web: `/memberships/${id}` };
      case 'profile':
        return { deep: `/profile/${id}`, web: `/profiles/${id}` };
      case 'blog':
        return { deep: `/blog/${id}`, web: `/blogs/${id}` };
      case 'comment':
        return { deep: `/comment/${id}`, web: `/comments/${id}` };
      case 'ad':
        return { deep: `/ad/${id}`, web: `/ads/${id}` };
      case 'transaction':
        return { deep: `/transaction/${id}`, web: `/transactions/${id}` };
      case 'report':
        return { deep: `/report/${id}`, web: `/reports/${id}` };
      case 'user':
        return { deep: `/user/${id}`, web: `/users/${id}` };
      case 'review':
        return { deep: `/review/${id}`, web: `/reviews/${id}` };
      case 'document':
        return { deep: `/document/${id}`, web: `/documents/${id}` };
      case 'notification':
        return { deep: `/notification/${id}`, web: `/notifications/${id}` };
      case 'quotation':
        return { deep: `/quotation/${id}`, web: `/quotations/${id}` };
      case 'support-ticket':
        return { deep: `/support-ticket/${id}`, web: `/support-tickets/${id}` };
      case 'affiliate':
        return { deep: `/affiliate/${id}`, web: `/affiliates/${id}` };
      case 'partner':
        return { deep: `/partner/${id}`, web: `/partners/${id}` };
      case 'marketing-campaign':
        return { deep: `/marketing-campaign/${id}`, web: `/marketing/${id}` };
      case 'recommendation':
        return { deep: `/recommendation/${id}`, web: `/recommendations/${id}` };
      case 'travel-companion':
        return { deep: `/travel-companion/${id}`, web: `/travel-companion/${id}` };
      // Pages/Sections (no ID required)
      case 'dashboard':
        return { deep: `/dashboard`, web: `/dashboard` };
      case 'accounting':
      case 'wallet':
        return { deep: `/accounting`, web: `/accounting` };
      case 'sales':
        return { deep: `/sales`, web: `/sales` };
      case 'activities':
      case 'activity':
        return { deep: `/activities`, web: `/activities` };
      case 'content':
        return { deep: `/content`, web: `/content` };
      case 'chat':
      case 'communication':
        return { deep: `/chat`, web: `/chat` };
      case 'settings':
        return { deep: `/settings`, web: `/settings` };
      case 'trip-maker':
        return { deep: `/trip-maker`, web: `/trip-maker` };
      case 'user-management':
      case 'rbac':
        return { deep: `/user-management`, web: `/user-management` };
      case 'home':
        return { deep: `/home`, web: `/home` };
      case 'auth':
      case 'login':
        return { deep: `/auth`, web: `/auth` };
      default:
        return null;
    }
  };

  const pathInfo = getPathForType(type, id);
  if (!pathInfo) {
    return res.status(400).json({
      success: false,
      message: `Invalid type: ${type}. Supported types: package, trip, booking, voucher, membership, profile, blog, comment, ad, transaction, report, user, review, document, notification, quotation, support-ticket, affiliate, partner, marketing-campaign, recommendation, travel-companion, dashboard, accounting, wallet, sales, activities, activity, content, chat, communication, settings, trip-maker, user-management, rbac, home, auth, login`
    });
  }
  
  deepLinkPath = pathInfo.deep;
  webFallbackPath = pathInfo.web;

  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined) {
      queryParams.append(key, params[key]);
    }
  });
  
  const queryString = queryParams.toString();
  const fullQueryString = queryString ? `?${queryString}` : '';

  // Generate deep link (for app)
  const deepLink = `${baseUrl}${deepLinkPath}${fullQueryString}`;
  
  // Generate web fallback URL (for landing page)
  const webFallbackUrl = process.env.LANDING_PAGE_URL 
    ? `${process.env.LANDING_PAGE_URL}${webFallbackPath}${fullQueryString}`
    : `${baseUrl}${webFallbackPath}${fullQueryString}`;

  // Generate custom scheme link (altayar://)
  const customSchemeLink = `altayar://open${deepLinkPath}${fullQueryString}`;

  // Create Firebase Dynamic Link with metadata
  let firebaseDynamicLink = null;
  try {
    firebaseDynamicLink = await firebaseDynamicLinks.createShareableLink(
      type,
      id,
      params,
      {
        title,
        description,
        imageUrl,
      }
    );
  } catch (error) {
    console.warn('⚠️ [Deep Link] Firebase Dynamic Link creation failed:', error.message);
    // Continue without Firebase Dynamic Link
  }

  // Return shareable link with metadata
  res.status(200).json({
    success: true,
    data: {
      deepLink,
      customSchemeLink,
      webFallbackUrl,
      firebaseDynamicLink: firebaseDynamicLink || deepLink, // Firebase Dynamic Link (short link)
      shareableUrl: firebaseDynamicLink || deepLink, // Use Firebase Dynamic Link if available
      metadata: {
        title: title || `Altayar ${type}`,
        description: description || `Check out this ${type} on Altayar`,
        imageUrl: imageUrl || null,
        type,
        id,
      },
    },
    message: 'Shareable link created successfully'
  });
});

/**
 * Get deep link configuration
 * @route GET /api/deep-links/config
 * @access Public
 */
const getDeepLinkConfig = asyncHandler(async (req, res) => {
  const baseUrl = process.env.DEEP_LINK_BASE_URL || 'https://altayar.com';
  const landingPageUrl = process.env.LANDING_PAGE_URL || baseUrl;
  const firebaseDynamicLinksDomain = process.env.FIREBASE_DYNAMIC_LINKS_DOMAIN || 'altayar.page.link';
  
  res.status(200).json({
    success: true,
    data: {
      baseUrl,
      landingPageUrl,
      customScheme: 'altayar',
      androidPackageName: process.env.ANDROID_PACKAGE_NAME || 'com.example.Altayar',
      iosBundleId: process.env.IOS_BUNDLE_ID || 'com.example.Altayar',
      firebaseDynamicLinksDomain,
      firebaseDynamicLinksEnabled: !!process.env.FIREBASE_API_KEY,
      supportedTypes: [
        // Core Content Types
        'package', 'trip', 'booking', 'voucher', 'membership', 'profile', 'blog',
        'comment', 'ad', 'transaction', 'report', 'user', 'review', 'document',
        'notification', 'quotation', 'support-ticket', 'affiliate', 'partner',
        'marketing-campaign', 'recommendation', 'travel-companion',
        // Pages/Sections
        'dashboard', 'accounting', 'wallet', 'sales', 'activities', 'activity',
        'content', 'chat', 'communication', 'settings', 'trip-maker',
        'user-management', 'rbac', 'home', 'auth', 'login'
      ],
    },
    message: 'Deep link configuration retrieved successfully'
  });
});

module.exports = {
  createDeepLink,
  createShareableLink,
  getDeepLinkConfig,
};

