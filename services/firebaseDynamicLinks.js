// Firebase Dynamic Links Service
// Creates short, shareable links that work across platforms

const axios = require('axios');

class FirebaseDynamicLinksService {
  constructor() {
    this.apiKey = process.env.FIREBASE_API_KEY;
    this.dynamicLinksDomain = process.env.FIREBASE_DYNAMIC_LINKS_DOMAIN || 'altayar.page.link';
    this.androidPackageName = process.env.ANDROID_PACKAGE_NAME || 'com.example.Altayar';
    this.iosBundleId = process.env.IOS_BUNDLE_ID || 'com.example.Altayar';
    this.baseUrl = process.env.DEEP_LINK_BASE_URL || 'https://altayar.com';
    this.landingPageUrl = process.env.LANDING_PAGE_URL || this.baseUrl;
  }

  /**
   * Create a Firebase Dynamic Link
   * @param {Object} options - Link creation options
   * @param {String} options.deepLink - The deep link URL (app:// or https://)
   * @param {String} options.webFallbackUrl - Web fallback URL
   * @param {String} options.title - Link title
   * @param {String} options.description - Link description
   * @param {String} options.imageUrl - Preview image URL
   * @param {Number} options.expirationTime - Expiration time in seconds (optional)
   * @returns {Promise<String>} Short dynamic link URL
   */
  async createDynamicLink(options) {
    const {
      deepLink,
      webFallbackUrl,
      title,
      description,
      imageUrl,
      expirationTime,
    } = options;

    if (!this.apiKey) {
      // If no API key, return the deep link as fallback
      console.warn('⚠️ [Firebase Dynamic Links] API key not configured, returning deep link');
      return deepLink;
    }

    try {
      const dynamicLinkUrl = `https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=${this.apiKey}`;

      const requestBody = {
        dynamicLinkInfo: {
          domainUriPrefix: `https://${this.dynamicLinksDomain}`,
          link: deepLink,
          androidInfo: {
            androidPackageName: this.androidPackageName,
            androidFallbackLink: webFallbackUrl,
          },
          iosInfo: {
            iosBundleId: this.iosBundleId,
            iosFallbackLink: webFallbackUrl,
            iosAppStoreId: process.env.IOS_APP_STORE_ID || '',
          },
          navigationInfo: {
            enableForcedRedirect: false,
          },
          socialMetaTagInfo: {
            socialTitle: title || 'Altayar',
            socialDescription: description || 'Discover amazing travel experiences',
            socialImageLink: imageUrl || '',
          },
        },
        suffix: {
          option: 'SHORT', // or 'UNGUESSABLE' for security
        },
      };

      // Add expiration if provided
      if (expirationTime) {
        const expirationDate = new Date();
        expirationDate.setSeconds(expirationDate.getSeconds() + expirationTime);
        requestBody.dynamicLinkInfo.expiration = {
          expirationTime: expirationDate.toISOString(),
        };
      }

      const response = await axios.post(dynamicLinkUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data && response.data.shortLink) {
        return response.data.shortLink;
      }

      throw new Error('Invalid response from Firebase Dynamic Links API');
    } catch (error) {
      console.error('❌ [Firebase Dynamic Links] Error creating link:', {
        message: error.message,
        response: error.response?.data,
      });

      // Return the deep link as fallback
      return deepLink;
    }
  }

  /**
   * Create a dynamic link for sharing content
   * @param {String} type - Content type (package, trip, booking, etc.)
   * @param {String} id - Content ID
   * @param {Object} params - Additional parameters
   * @param {Object} metadata - Link metadata (title, description, imageUrl)
   * @returns {Promise<String>} Dynamic link URL
   */
  async createShareableLink(type, id, params = {}, metadata = {}) {
    // Build deep link path
    let deepLinkPath = '';
    let webFallbackPath = '';

    // Map all available features to deep link paths
    switch (type) {
      // Core Content Types
      case 'package':
        deepLinkPath = `/package/${id}`;
        webFallbackPath = `/packages/${id}`;
        break;
      case 'trip':
        deepLinkPath = `/trip/${id}`;
        webFallbackPath = `/trips/${id}`;
        break;
      case 'booking':
        deepLinkPath = `/booking/${id}`;
        webFallbackPath = `/bookings/${id}`;
        break;
      case 'voucher':
        deepLinkPath = `/voucher/${id}`;
        webFallbackPath = `/vouchers/${id}`;
        break;
      case 'membership':
        deepLinkPath = `/membership/${id}`;
        webFallbackPath = `/memberships/${id}`;
        break;
      case 'profile':
        deepLinkPath = `/profile/${id}`;
        webFallbackPath = `/profiles/${id}`;
        break;
      case 'blog':
        deepLinkPath = `/blog/${id}`;
        webFallbackPath = `/blogs/${id}`;
        break;
      case 'comment':
        deepLinkPath = `/comment/${id}`;
        webFallbackPath = `/comments/${id}`;
        break;
      case 'ad':
        deepLinkPath = `/ad/${id}`;
        webFallbackPath = `/ads/${id}`;
        break;
      case 'transaction':
        deepLinkPath = `/transaction/${id}`;
        webFallbackPath = `/transactions/${id}`;
        break;
      case 'report':
        deepLinkPath = `/report/${id}`;
        webFallbackPath = `/reports/${id}`;
        break;
      case 'user':
        deepLinkPath = `/user/${id}`;
        webFallbackPath = `/users/${id}`;
        break;
      case 'review':
        deepLinkPath = `/review/${id}`;
        webFallbackPath = `/reviews/${id}`;
        break;
      case 'document':
        deepLinkPath = `/document/${id}`;
        webFallbackPath = `/documents/${id}`;
        break;
      case 'notification':
        deepLinkPath = `/notification/${id}`;
        webFallbackPath = `/notifications/${id}`;
        break;
      case 'quotation':
        deepLinkPath = `/quotation/${id}`;
        webFallbackPath = `/quotations/${id}`;
        break;
      case 'support-ticket':
        deepLinkPath = `/support-ticket/${id}`;
        webFallbackPath = `/support-tickets/${id}`;
        break;
      case 'affiliate':
        deepLinkPath = `/affiliate/${id}`;
        webFallbackPath = `/affiliates/${id}`;
        break;
      case 'partner':
        deepLinkPath = `/partner/${id}`;
        webFallbackPath = `/partners/${id}`;
        break;
      case 'marketing-campaign':
        deepLinkPath = `/marketing-campaign/${id}`;
        webFallbackPath = `/marketing/${id}`;
        break;
      case 'recommendation':
        deepLinkPath = `/recommendation/${id}`;
        webFallbackPath = `/recommendations/${id}`;
        break;
      case 'travel-companion':
        deepLinkPath = `/travel-companion/${id}`;
        webFallbackPath = `/travel-companion/${id}`;
        break;
      // Pages/Sections (no ID required - use '0' or empty)
      case 'dashboard':
        deepLinkPath = `/dashboard`;
        webFallbackPath = `/dashboard`;
        break;
      case 'accounting':
      case 'wallet':
        deepLinkPath = `/accounting`;
        webFallbackPath = `/accounting`;
        break;
      case 'sales':
        deepLinkPath = `/sales`;
        webFallbackPath = `/sales`;
        break;
      case 'activities':
      case 'activity':
        deepLinkPath = `/activities`;
        webFallbackPath = `/activities`;
        break;
      case 'content':
        deepLinkPath = `/content`;
        webFallbackPath = `/content`;
        break;
      case 'chat':
      case 'communication':
        deepLinkPath = `/chat`;
        webFallbackPath = `/chat`;
        break;
      case 'settings':
        deepLinkPath = `/settings`;
        webFallbackPath = `/settings`;
        break;
      case 'trip-maker':
        deepLinkPath = `/trip-maker`;
        webFallbackPath = `/trip-maker`;
        break;
      case 'user-management':
      case 'rbac':
        deepLinkPath = `/user-management`;
        webFallbackPath = `/user-management`;
        break;
      case 'home':
        deepLinkPath = `/home`;
        webFallbackPath = `/home`;
        break;
      case 'auth':
      case 'login':
        deepLinkPath = `/auth`;
        webFallbackPath = `/auth`;
        break;
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }

    // Build query string
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    const queryString = queryParams.toString();
    const fullQueryString = queryString ? `?${queryString}` : '';

    // Create deep link (app link)
    const deepLink = `${this.baseUrl}${deepLinkPath}${fullQueryString}`;

    // Create web fallback URL
    const webFallbackUrl = `${this.landingPageUrl}${webFallbackPath}${fullQueryString}`;

    // Create Firebase Dynamic Link
    const dynamicLink = await this.createDynamicLink({
      deepLink,
      webFallbackUrl,
      title: metadata.title || `Altayar ${type}`,
      description: metadata.description || `Check out this ${type} on Altayar`,
      imageUrl: metadata.imageUrl || null,
    });

    return dynamicLink;
  }

  /**
   * Get dynamic link statistics (requires Firebase Admin SDK)
   * This is a placeholder - implement with Firebase Admin SDK if needed
   */
  async getLinkStats(link) {
    // TODO: Implement with Firebase Admin SDK if analytics are needed
    return null;
  }
}

module.exports = new FirebaseDynamicLinksService();

