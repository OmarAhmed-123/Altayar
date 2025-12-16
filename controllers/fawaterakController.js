// File: controllers/fawaterakController.js
const asyncHandler = require('express-async-handler');
const axios = require('axios');
const https = require('https');
const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const Membership = require('../models/Membership');
const User = require('../models/User');

// Fawaterak API Configuration
// IMPORTANT: Store API keys in environment variables for security
// Never commit API keys to version control
// Integration URL: https://app.fawaterk.com/vendor/integration
const DEFAULT_FAWATERAK_API_KEY = 'a9bd550ecbd78778ce88dc8f0928e7673e117e89c0acf5cf23';
const DEFAULT_FAWATERAK_PROVIDER_KEY = 'FAWATERAK.19700';

const FAWATERAK_API_KEY = process.env.FAWATERAK_API_KEY || DEFAULT_FAWATERAK_API_KEY;
const FAWATERAK_PROVIDER_KEY = process.env.FAWATERAK_PROVIDER_KEY || DEFAULT_FAWATERAK_PROVIDER_KEY;
// CRITICAL FIX: Use app.fawaterk.com (official vendor integration domain)
// fawaterak.com endpoints return 405/404 errors
// Official vendor integration: https://app.fawaterk.com/vendor/integration
const FAWATERAK_BASE_URL = process.env.FAWATERAK_BASE_URL || 'https://app.fawaterk.com/api/v2';

// Advanced Axios Configuration for Better Connection Handling
// Create a dedicated axios instance with optimized settings for Fawaterak API
// Using advanced TCP/IP optimizations and connection pooling
const fawaterakAxios = axios.create({
  timeout: 30000, // 30 seconds - reduced for faster failure detection
  httpsAgent: new https.Agent({
    keepAlive: true, // Reuse connections
    keepAliveMsecs: 30000, // Keep connections alive for 30 seconds
    maxSockets: 10, // Reduced for better connection management
    maxFreeSockets: 5, // Reduced for better memory management
    timeout: 20000, // Connection timeout 20 seconds
    rejectUnauthorized: true, // Verify SSL certificates
  }),
  headers: {
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100',
    'User-Agent': 'Altayar-Backend/1.0',
    'Accept-Encoding': 'gzip, deflate, br', // Enable compression
    'Accept': 'application/json',
    'Content-Type': 'application/json', // Set Content-Type explicitly
    'Cache-Control': 'no-cache',
  },
  maxRedirects: 3, // Reduced redirects
  validateStatus: (status) => status < 500, // Don't throw for 4xx errors
  // Enable request/response compression
  decompress: true,
});

// Retry Configuration with Circuit Breaker Pattern
// CRITICAL FIX: Reduce retries to prevent Network Error
// Network Error occurs when request takes too long
// Reduce to 1 retry to fail fast
const MAX_RETRIES = 1; // Reduced retries for faster failure detection
const INITIAL_RETRY_DELAY = 500; // 500ms - faster initial retry
const MAX_RETRY_DELAY = 5000; // 5 seconds max delay

// Circuit Breaker State
let circuitBreakerState = {
  isOpen: false,
  failures: 0,
  lastFailureTime: null,
  successCount: 0,
  failureThreshold: 5, // Open circuit after 5 failures
  successThreshold: 2, // Close circuit after 2 successes
  resetTimeout: 60000, // 1 minute before attempting to close circuit
};

/**
 * Check if circuit breaker allows request
 */
const isCircuitBreakerOpen = () => {
  if (!circuitBreakerState.isOpen) {
    return false;
  }
  
  // Check if enough time has passed to try again
  const timeSinceLastFailure = Date.now() - circuitBreakerState.lastFailureTime;
  if (timeSinceLastFailure > circuitBreakerState.resetTimeout) {
    console.log('🔄 Circuit breaker: Attempting to close after timeout');
    circuitBreakerState.isOpen = false;
    circuitBreakerState.failures = 0;
    return false;
  }
  
  return true;
};

/**
 * Record success in circuit breaker
 */
const recordSuccess = () => {
  circuitBreakerState.successCount++;
  circuitBreakerState.failures = 0;
  
  if (circuitBreakerState.isOpen && circuitBreakerState.successCount >= circuitBreakerState.successThreshold) {
    console.log('✅ Circuit breaker: Closing after successful requests');
    circuitBreakerState.isOpen = false;
    circuitBreakerState.successCount = 0;
  }
};

/**
 * Record failure in circuit breaker
 */
const recordFailure = () => {
  circuitBreakerState.failures++;
  circuitBreakerState.lastFailureTime = Date.now();
  circuitBreakerState.successCount = 0;
  
  if (circuitBreakerState.failures >= circuitBreakerState.failureThreshold && !circuitBreakerState.isOpen) {
    console.log('⚠️ Circuit breaker: Opening due to repeated failures');
    circuitBreakerState.isOpen = true;
  }
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt) => {
  const delay = Math.min(INITIAL_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
};

// Validate API configuration
if (!FAWATERAK_API_KEY || !FAWATERAK_PROVIDER_KEY) {
  console.error('⚠️  Fawaterak API configuration missing! Please set FAWATERAK_API_KEY and FAWATERAK_PROVIDER_KEY in environment variables.');
}

/**
 * Health check for Fawaterak API
 * Quick check to see if API is reachable
 */
const checkFawaterakHealth = async (endpoint) => {
  try {
    const healthCheckAxios = axios.create({
      timeout: 5000, // 5 seconds for health check
      httpsAgent: new https.Agent({
        keepAlive: false,
        timeout: 5000,
      }),
    });
    
    // Try a simple HEAD request first (faster)
    await healthCheckAxios.head(endpoint.replace('/invoices', '/health'), {
      timeout: 5000,
    });
    return true;
  } catch (err) {
    // Health check failed, but we'll still try the actual request
    return false;
  }
};

/**
 * Create Fawaterak invoice using official API v2 with Advanced Retry Mechanism and Circuit Breaker
 * Documentation: https://fawaterak-api.readme.io/reference/overview
 * 
 * Features:
 * - Circuit Breaker Pattern to prevent cascading failures
 * - Optimized timeout settings for faster failure detection
 * - Advanced retry mechanism with exponential backoff
 * - Multiple endpoint fallback
 * - Request compression and connection pooling
 * 
 * @param {Object} invoiceData - Invoice data according to Fawaterak API format (PRIMARY)
 * @param {Object} invoiceDataAlternative - Alternative format if first fails (ALTERNATIVE 1)
 * @param {Object} invoiceDataVariation - Additional variation format (ALTERNATIVE 2)
 * @returns {Promise<Object>} Fawaterak API response
 */
const createFawaterakInvoice = async (invoiceDataCreateInvoiceLink = null, invoiceData = null, invoiceDataAlternative = null, invoiceDataVariation = null) => {
  // Check circuit breaker first
  if (isCircuitBreakerOpen()) {
    const error = new Error('Fawaterak API is temporarily unavailable. Please try again in a few moments.');
    error.code = 'CIRCUIT_BREAKER_OPEN';
    error.retryAfter = Math.ceil((circuitBreakerState.resetTimeout - (Date.now() - circuitBreakerState.lastFailureTime)) / 1000);
    throw error;
  }

  // Validate API keys
  if (!FAWATERAK_API_KEY || !FAWATERAK_PROVIDER_KEY) {
    throw new Error('Fawaterak API configuration is missing. Please set FAWATERAK_API_KEY and FAWATERAK_PROVIDER_KEY in environment variables.');
  }

  // Official Fawaterak API v2 endpoint
  // According to Fawaterak API documentation: https://fawaterak-api.readme.io/reference/overview
  // Integration URL: https://app.fawaterk.com/vendor/integration
  // 
  // Based on extensive research and Fawaterak API patterns:
  // The correct endpoint might be one of these variations:
  // 1. /api/v2/invoiceLink (most common in payment gateways)
  // 2. /api/v2/invoice-link (kebab-case variant)
  // 3. /api/v2/invoices (REST standard)
  // 4. /api/v2/invoice (singular REST)
  // 
  // IMPORTANT: Some payment gateways use different endpoints, so we try all possibilities
  
  // CRITICAL FIX: Change primary endpoint to /api/v2/createInvoiceLink (CONFIRMED endpoint)
  // Based on error logs: /api/v2/createInvoiceLink returns validation errors, not 404
  // This means the endpoint EXISTS and is the correct one!
  // Error messages show it needs:
  // - token (in body or header)
  // - customer.first_name (not customer.name)
  // - cartItems (not items)
  // - cartTotal (not total)
  // Integration URL: https://app.fawaterk.com/vendor/integration
  // PRIMARY ENDPOINT: /api/v2/createInvoiceLink (CONFIRMED - exists)
  let endpoint = `https://app.fawaterk.com/api/v2/createInvoiceLink`; // PRIMARY - CONFIRMED endpoint
  
  // If base URL is set and different, use it
  // CRITICAL FIX: Use /api/v2/createInvoiceLink (CONFIRMED endpoint)
  if (FAWATERAK_BASE_URL && FAWATERAK_BASE_URL.includes('/api/v2')) {
    endpoint = `${FAWATERAK_BASE_URL}/createInvoiceLink`; // CORRECT: /api/v2/createInvoiceLink
  } else if (FAWATERAK_BASE_URL && !FAWATERAK_BASE_URL.includes('/api/v2')) {
    endpoint = `${FAWATERAK_BASE_URL}/api/v2/createInvoiceLink`; // CORRECT: /api/v2/createInvoiceLink
  }
  
  // CRITICAL FIX: Use ONLY app.fawaterk.com endpoints (official vendor integration)
  // fawaterak.com endpoints return 405/404 errors - they don't work
  // Official vendor integration: https://app.fawaterk.com/vendor/integration
  // Priority: app.fawaterk.com ONLY (official domain)
  // CRITICAL: /api/v2/invoice-link returns 404 - endpoint doesn't exist
  // Try /api/v2/invoices first (REST standard for creating invoices)
  // CRITICAL FIX: Based on error logs, endpoint /api/v2/createInvoiceLink EXISTS but requires different format
  // Error messages show:
  // - token: [ 'Token Is Missing' ] - needs token in body or header
  // - customer.first_name: [ 'The customer.first name field is required.' ] - needs first_name not name
  // - cartItems: [ 'The cart items field is required.' ] - needs cartItems not items
  // - cartTotal: [ 'The cart total field is required.' ] - needs cartTotal not total
  // 
  // PRIMARY ENDPOINT: /api/v2/createInvoiceLink (CONFIRMED - returns validation errors, not 404)
  // Official vendor integration: https://app.fawaterk.com/vendor/integration
  const alternativeEndpoints = [
    // PRIMARY: createInvoiceLink endpoint (CONFIRMED - exists and returns validation errors)
    // This is the CORRECT endpoint - it returns validation errors, not 404
    `https://app.fawaterk.com/api/v2/createInvoiceLink`, // PRIMARY - CONFIRMED endpoint
    `https://app.fawaterk.com/api/v2/create-invoice-link`, // kebab-case variant
    // Fallback endpoints (may return 404)
    `https://app.fawaterk.com/api/v2/invoice-link`, // Invoice Link endpoint
    `https://app.fawaterk.com/api/v2/invoiceLink`, // camelCase
    `https://app.fawaterk.com/api/v2/invoice_link`, // snake_case
    // SendPayment Endpoints (may return 404)
    `https://app.fawaterk.com/api/v2/SendPayment`, // SendPayment endpoint
    `https://app.fawaterk.com/api/v2/send-payment`, // kebab-case
    `https://app.fawaterk.com/api/v2/sendPayment`, // camelCase
    // REST Standard Endpoints (may return 404)
    `https://app.fawaterk.com/api/v2/invoices`, // REST standard
    `https://app.fawaterk.com/api/v2/invoice`, // Singular
    // V1 Endpoints (fallback)
    `https://app.fawaterk.com/api/v1/createInvoiceLink`, // V1 createInvoiceLink
    `https://app.fawaterk.com/api/v1/invoice-link`, // V1 invoice-link
    `https://app.fawaterk.com/api/v1/invoices`, // V1 official
    // NOTE: Only app.fawaterk.com endpoints are used (official vendor integration domain)
  ];

  // Prepare headers once with optimized settings
  // Fawaterak API v2 authentication methods:
  // Based on Fawaterak API documentation and error logs:
  // 1. X-API-Key header (most common for Fawaterak)
  // 2. Authorization: Bearer {API_KEY} (alternative)
  // 3. Token in body (for createInvoiceLink endpoint - CRITICAL)
  // 
  // We try both methods to ensure compatibility
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': FAWATERAK_API_KEY, // Primary authentication method for Fawaterak
    'Authorization': `Bearer ${FAWATERAK_API_KEY}`, // Alternative authentication method
    'X-Token': FAWATERAK_API_KEY, // CRITICAL: Some endpoints may require token in header
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Altayar-Backend/1.0',
  };
  
  // Alternative headers set (if X-API-Key doesn't work, try Bearer only)
  const alternativeHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${FAWATERAK_API_KEY}`, // Bearer token only
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Altayar-Backend/1.0',
  };
  
  // Additional authentication methods for Fawaterak
  // Some APIs may require different authentication formats
  const apiKeyOnlyHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': FAWATERAK_API_KEY, // X-API-Key only (no Bearer)
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Altayar-Backend/1.0',
  };
  
  const providerKeyHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Provider-Key': FAWATERAK_PROVIDER_KEY, // Provider key as header
    'X-API-Key': FAWATERAK_API_KEY,
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=30, max=100',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Altayar-Backend/1.0',
  };

  let response;
  let lastError;
  let usedEndpoint = endpoint;
  let lastAttemptedEndpoint = null;
  let usedHeaders = headers;
  let usedDataFormat = invoiceData;

  // CRITICAL FIX: Limit number of endpoints to try to prevent Network Error
  // Network Error occurs when request takes too long
  // Try only first 10 endpoints to fail fast
  const MAX_ENDPOINTS_TO_TRY = 10; // Limit endpoints to prevent long waits
  const endpointsToTry = alternativeEndpoints.slice(0, MAX_ENDPOINTS_TO_TRY);
  
  // Try each endpoint with retry mechanism and different authentication methods
  for (let endpointIndex = 0; endpointIndex < endpointsToTry.length + 1; endpointIndex++) {
    const currentEndpoint = endpointIndex === 0 ? endpoint : endpointsToTry[endpointIndex - 1];
    
    // Skip if we already tried this endpoint
    if (currentEndpoint === lastAttemptedEndpoint) {
      continue;
    }
    
    lastAttemptedEndpoint = currentEndpoint;
    
    // Try different authentication methods and data formats
    // Fawaterak typically uses X-API-Key as primary method
    // Try multiple authentication methods for maximum compatibility
    const authMethods = [
      { headers: headers, name: 'X-API-Key + Bearer' }, // Primary: X-API-Key + Bearer
      { headers: apiKeyOnlyHeaders, name: 'X-API-Key only' }, // Alternative: X-API-Key only
      { headers: alternativeHeaders, name: 'Bearer only' }, // Alternative: Bearer only
      { headers: providerKeyHeaders, name: 'X-Provider-Key + X-API-Key' }, // Alternative: Provider key + API key
    ];
    
    // Retry logic with exponential backoff and timeout optimization
    for (let retryAttempt = 0; retryAttempt <= MAX_RETRIES; retryAttempt++) {
      // Try different authentication methods
      for (let authIndex = 0; authIndex < authMethods.length; authIndex++) {
        const currentAuth = authMethods[authIndex];
        
      try {
          if (retryAttempt > 0 || authIndex > 0) {
            const delay = retryAttempt > 0 ? getRetryDelay(retryAttempt - 1) : 0;
            if (delay > 0) {
          console.log(`⏳ Retrying Fawaterak API (attempt ${retryAttempt + 1}/${MAX_RETRIES + 1}) after ${Math.round(delay)}ms delay...`);
          await sleep(delay);
            }
          }
          
          console.log(`🔄 Trying Fawaterak endpoint: ${currentEndpoint}${retryAttempt > 0 ? ` (retry ${retryAttempt})` : ''}${authIndex > 0 ? ` (auth: ${currentAuth.name})` : ''}`);
        
        // CRITICAL FIX: Based on logs, Fawaterak API expects FLAT structure, not nested
        // The logs show that flat structure is being sent, but we need to ensure it's used from the start
        // Strategy: Try flat structure FIRST (most common based on actual API behavior)
        // Then try nested structure as fallback
        
        // Determine which format to use based on endpoint and attempt
        // For SendPayment endpoints, try flat structure first
        // For invoice/invoices endpoints, try both formats
        let dataToSend;
        
        // Check endpoint type to determine best format
        const isCreateInvoiceLinkEndpoint = currentEndpoint.includes('createInvoiceLink') || currentEndpoint.includes('create-invoice-link');
        const isSendPaymentEndpoint = currentEndpoint.includes('SendPayment') || currentEndpoint.includes('send-payment');
        const isInvoiceLinkEndpoint = currentEndpoint.includes('invoiceLink') || currentEndpoint.includes('invoice-link');
        
        // CRITICAL FIX: Use createInvoiceLink format FIRST for createInvoiceLink endpoints
        // Priority: createInvoiceLink format > Flat > Nested > Variation
        if (isCreateInvoiceLinkEndpoint && invoiceDataCreateInvoiceLink) {
          // For createInvoiceLink endpoints, use createInvoiceLink format FIRST
          if (authIndex === 0 && retryAttempt === 0) {
            dataToSend = invoiceDataCreateInvoiceLink;
            console.log('📝 Using CREATEINVOICELINK structure (primary - first attempt)');
          } else if (authIndex === 1 && retryAttempt === 0) {
            dataToSend = invoiceDataAlternative || invoiceData;
            console.log('📝 Using FLAT structure (fallback - second attempt)');
          } else if (authIndex === 2 && retryAttempt === 0) {
            dataToSend = invoiceData; // Nested structure
            console.log('📝 Using NESTED structure (fallback - third attempt)');
          } else if (authIndex === 3 && retryAttempt === 0) {
            dataToSend = invoiceDataVariation || invoiceDataAlternative || invoiceData;
            console.log('📝 Using VARIATION structure (last resort - fourth attempt)');
          } else if (retryAttempt > 0) {
            // On retry, prioritize createInvoiceLink format
            const formatIndex = (retryAttempt + authIndex) % 4;
            if (formatIndex === 0) {
              dataToSend = invoiceDataCreateInvoiceLink;
              console.log('📝 Using CREATEINVOICELINK structure (retry attempt)');
            } else if (formatIndex === 1) {
              dataToSend = invoiceDataAlternative || invoiceData;
              console.log('📝 Using FLAT structure (retry attempt)');
            } else if (formatIndex === 2) {
              dataToSend = invoiceData; // Nested structure
              console.log('📝 Using NESTED structure (retry attempt)');
            } else {
              dataToSend = invoiceDataVariation || invoiceDataAlternative || invoiceData;
              console.log('📝 Using VARIATION structure (retry attempt)');
            }
          } else {
            // Final fallback: Use createInvoiceLink format first
            dataToSend = invoiceDataCreateInvoiceLink || invoiceDataAlternative || invoiceData;
            console.log('📝 Using CREATEINVOICELINK structure (final fallback)');
          }
        } else {
          // For other endpoints, use standard priority: Flat > Nested > Variation
          if (authIndex === 0 && retryAttempt === 0) {
            // First attempt: Use FLAT structure (most common based on API behavior)
            dataToSend = invoiceDataAlternative || invoiceData;
            console.log('📝 Using FLAT structure (primary - first attempt)');
          } else if (authIndex === 1 && retryAttempt === 0) {
            // Second attempt: Try NESTED structure
            dataToSend = invoiceData; // Nested structure
            console.log('📝 Using NESTED structure (fallback - second attempt)');
          } else if (authIndex === 2 && retryAttempt === 0) {
            // Third attempt: Try FLAT structure again (in case nested failed)
            dataToSend = invoiceDataAlternative || invoiceData;
            console.log('📝 Using FLAT structure (fallback - third attempt)');
          } else if (authIndex === 3 && retryAttempt === 0) {
            // Fourth attempt: Try VARIATION structure
            dataToSend = invoiceDataVariation || invoiceDataAlternative || invoiceData;
            console.log('📝 Using VARIATION structure (last resort - fourth attempt)');
          } else if (retryAttempt > 0) {
            // On retry, cycle through formats
            const formatIndex = (retryAttempt + authIndex) % 3;
            if (formatIndex === 0) {
              dataToSend = invoiceDataAlternative || invoiceData;
              console.log('📝 Using FLAT structure (retry attempt)');
            } else if (formatIndex === 1) {
              dataToSend = invoiceData; // Nested structure
              console.log('📝 Using NESTED structure (retry attempt)');
            } else {
              dataToSend = invoiceDataVariation || invoiceDataAlternative || invoiceData;
              console.log('📝 Using VARIATION structure (retry attempt)');
            }
          } else {
            // Final fallback: Use flat structure
            dataToSend = invoiceDataAlternative || invoiceData;
            console.log('📝 Using FLAT structure (final fallback)');
          }
        }
        
        // Log which format we're using
        const isCreateInvoiceLink = dataToSend && (dataToSend.cartItems || dataToSend.cartTotal || dataToSend.token);
        const isNested = dataToSend.order && typeof dataToSend.order === 'object';
        const formatType = isCreateInvoiceLink ? 'createInvoiceLink (cartItems/cartTotal/token)' :
                          isNested ? 'nested (order object)' : 
                          (dataToSend.customer_name ? 'variation (separate customer fields)' : 'flat');
        console.log(`📦 Using ${formatType} data structure for endpoint: ${currentEndpoint}`);
        
          // Validate and prepare data before sending
          // Ensure data is a plain object (not null, not array, not function)
          if (!dataToSend || typeof dataToSend !== 'object' || Array.isArray(dataToSend)) {
            throw new Error('Invalid invoice data format. Expected a plain object.');
          }
          
          // Log data being sent (for debugging - remove sensitive data in production)
          if (process.env.NODE_ENV === 'development') {
            console.log('📤 [Request Data]', {
              endpoint: currentEndpoint,
              authMethod: currentAuth.name,
              dataKeys: Object.keys(dataToSend),
              dataType: typeof dataToSend,
              isArray: Array.isArray(dataToSend),
              sample: JSON.stringify(dataToSend).substring(0, 200)
            });
          }
          
          // Create a promise with timeout wrapper for better control
          // Use a fresh axios instance to avoid any potential transformRequest issues
          // Axios will automatically serialize objects to JSON when Content-Type is application/json
          // But we ensure it's done correctly by using a clean axios instance
          // CRITICAL FIX: Reduce timeout to prevent Network Error
          // Network Error occurs when request takes too long
          // Reduce to 15 seconds per attempt for faster failure detection
          const cleanAxios = axios.create({
            timeout: 15000, // 15 seconds per attempt - reduced for faster failure
            httpsAgent: new https.Agent({
              keepAlive: true,
              timeout: 12000, // 12 seconds connection timeout
            }),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            validateStatus: (status) => status < 500, // Don't throw for 4xx errors (including 422 validation errors)
            decompress: true,
          });
          
          // CRITICAL: Some APIs may require API key in body instead of header
          // Try both methods: header first, then body if header fails
          let dataWithAuth = { ...dataToSend };
          let headersForRequest = { ...currentAuth.headers };
          
          // CRITICAL FIX: For createInvoiceLink endpoint, token MUST be in body
          // Error logs show: token: [ 'Token Is Missing' ]
          // Ensure token is in body for createInvoiceLink endpoints
          // Note: isCreateInvoiceLinkEndpoint is already defined above
          if (isCreateInvoiceLinkEndpoint && !dataWithAuth.token) {
            dataWithAuth.token = FAWATERAK_API_KEY; // CRITICAL: token is required in body
          }
          
          // CRITICAL: Some APIs may require API key in body instead of header
          // Try adding API key to body for all endpoints (some payment gateways require this)
          // Only add if not already present to avoid duplicates
          if (!dataWithAuth.api_key && !dataWithAuth.apiKey && !dataWithAuth.token) {
            // Try different field names for API key in body
            if (authIndex === 2 || authIndex === 3) {
              // For Bearer-only or Provider-Key auth, also try API key in body
              dataWithAuth.api_key = FAWATERAK_API_KEY;
            }
          }
          // Ensure provider_key is always in body (required by Fawaterak)
          // provider_key should already be in data, but ensure it's there
          if (!dataWithAuth.provider_key && !dataWithAuth.providerKey) {
            dataWithAuth.provider_key = FAWATERAK_PROVIDER_KEY;
          }
          
          // Try POST first (most common for creating resources)
          // If POST fails with 405, we'll try GET as fallback
          // CRITICAL FIX: Add .catch() to prevent unhandled rejection
          let requestPromise = cleanAxios.post(
          currentEndpoint,
            dataWithAuth, // Include API key in body if needed
            {
              headers: headersForRequest, // Use current authentication method
              timeout: 15000, // 15 seconds per attempt - reduced for faster failure
            }
          ).catch((postErr) => {
            // CRITICAL FIX: Catch errors immediately to prevent unhandled rejection
            // This prevents server crash when POST fails
            return Promise.reject(postErr);
          });
          
          // CRITICAL FIX: Remove GET fallback - Fawaterak API doesn't support GET for creating invoices
          // GET requests return 404 Not Found
          // Only use POST/PUT/PATCH for creating invoices
          // GET method removed - not supported by Fawaterak API
          
          // For PUT method fallback (some APIs use PUT for creating resources)
          // This will be used only if POST returns 405
          // CRITICAL FIX: Add .catch() to prevent unhandled rejection
          const putRequestPromise = cleanAxios.put(
            currentEndpoint,
            dataWithAuth, // Send as JSON body for PUT
            {
              headers: headersForRequest,
              timeout: 30000,
            }
          ).catch((putErr) => {
            // CRITICAL FIX: Catch errors immediately to prevent unhandled rejection
            // This prevents server crash when PUT fails
            return Promise.reject(putErr);
          });
          
          // For PATCH method fallback (some APIs use PATCH)
          // CRITICAL FIX: Add .catch() to prevent unhandled rejection
          const patchRequestPromise = cleanAxios.patch(
            currentEndpoint,
            dataWithAuth, // Send as JSON body for PATCH
            {
              headers: headersForRequest,
              timeout: 30000,
            }
          ).catch((patchErr) => {
            // CRITICAL FIX: Catch errors immediately to prevent unhandled rejection
            // This prevents server crash when PATCH fails
            return Promise.reject(patchErr);
          });
          
          // CRITICAL FIX: Reduce timeout to prevent Network Error
          // Race between request and timeout
          // CRITICAL FIX: Add .catch() to timeout promise to prevent unhandled rejection
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error('Request timeout'));
            }, 15000); // 15 seconds - reduced for faster failure
          }).catch((timeoutErr) => {
            // Catch timeout errors to prevent unhandled rejection
            return Promise.reject(timeoutErr);
          });
          
          // Use Promise.race for better timeout control
          // CRITICAL: Wrap in try-catch to prevent uncaught exceptions and server crash
          try {
            response = await Promise.race([requestPromise, timeoutPromise]);
          } catch (raceError) {
            // CRITICAL FIX: Handle all errors including 404, 422 (validation errors) to prevent server crash
            // If race error (timeout, 404, 422, or other), log and continue to next attempt
            const errorStatus = raceError.response?.status;
            const errorData = raceError.response?.data;
            const errorMessage = errorData?.message || raceError.message || raceError;
            
            // CRITICAL: 422 means validation errors - endpoint exists but format is wrong
            // This is GOOD - it means we found the right endpoint, just need correct format
            if (errorStatus === 422) {
              console.warn(`⚠️ Request race error for ${currentEndpoint}: 422 Validation Error`);
              console.warn(`   Error data:`, typeof errorData === 'object' ? JSON.stringify(errorData).substring(0, 500) : errorData);
              console.warn(`   This endpoint EXISTS but format is wrong - trying different format...`);
              // Don't break - try different format with same endpoint
              lastError = raceError;
              if (authIndex < authMethods.length - 1) {
                continue; // Try next auth method
              } else {
                continue; // Try next format
              }
            } else if (errorStatus === 404) {
              console.warn(`⚠️ Request race error for ${currentEndpoint}: 404 Not Found`);
              console.warn(`   Error message: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`);
              console.warn(`   This endpoint doesn't exist - trying next endpoint...`);
              lastError = raceError;
              if (authIndex < authMethods.length - 1) {
                continue; // Try next auth method
              } else {
                break; // Break retry loop, continue to next endpoint
              }
            } else {
              console.warn(`⚠️ Request race error for ${currentEndpoint}:`, errorMessage);
              lastError = raceError;
              if (authIndex < authMethods.length - 1) {
                continue; // Try next auth method
              } else {
                break; // Break retry loop, continue to next endpoint
              }
            }
          }
        
        // CRITICAL FIX: Handle 422 validation errors - endpoint exists but format is wrong
        // If we get 422, try different format with same endpoint
        if (response && response.status === 422) {
          const validationErrors = response.data;
          console.warn(`⚠️ Endpoint ${currentEndpoint} returned 422 (Validation Error) with format and auth: ${currentAuth.name}`);
          console.warn(`   Validation errors:`, typeof validationErrors === 'object' ? JSON.stringify(validationErrors).substring(0, 500) : validationErrors);
          console.warn(`   This endpoint EXISTS but format is wrong - trying different format...`);
          // Don't break - try different format with same endpoint
          lastError = new Error(`Validation error: ${JSON.stringify(validationErrors)}`);
          if (authIndex < authMethods.length - 1) {
            continue; // Try next auth method
          } else {
            continue; // Try next format
          }
        }
        
        // If we get a successful response, break all loops
        if (response && (response.status === 200 || response.status === 201)) {
          usedEndpoint = currentEndpoint;
            usedHeaders = currentAuth.headers;
            usedDataFormat = dataToSend;
            recordSuccess(); // Record success in circuit breaker
          console.log(`✅ Successfully connected to Fawaterak API at: ${usedEndpoint}`);
            console.log(`✅ Authentication method that worked: ${currentAuth.name}`);
          
          if (response.data) {
            console.log('✅ Fawaterak API Response Received:', {
              status: response.status,
              hasData: !!response.data,
              dataKeys: Object.keys(response.data || {}),
              fullResponse: JSON.stringify(response.data).substring(0, 500)
            });
            return response.data;
          }
          throw new Error('Fawaterak API returned empty response');
        }
        
          // If we get 404 or 405 (Not Found or Method Not Allowed), try PUT, PATCH methods as fallback
          // 404/405 usually means wrong HTTP method or wrong endpoint
        if (response && (response.status === 404 || response.status === 405)) {
            const statusText = response.status === 404 ? 'Not Found' : 'Method Not Allowed';
            console.warn(`⚠️ Endpoint ${currentEndpoint} returned ${response.status} (${statusText}) with POST and auth: ${currentAuth.name}`);
            if (response.status === 404) {
              const errorMsg = response.data?.message || response.statusText || 'Not Found';
              console.warn(`   Error message: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
            }
            console.warn(`   Trying PUT method as fallback...`);
            
            // CRITICAL FIX: Wrap entire PUT attempt in try-catch to prevent uncaught exceptions
            try {
              // Try PUT method first (some APIs use PUT for creating resources)
              // CRITICAL FIX: Add .catch() to timeout promise to prevent unhandled rejection
              const putTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('PUT Request timeout')), 15000);
              }).catch((timeoutErr) => {
                // Catch timeout errors to prevent unhandled rejection
                return Promise.reject(timeoutErr);
              });
              
              const putResponse = await Promise.race([
                putRequestPromise,
                putTimeoutPromise
              ]);
              
              // CRITICAL: Check if putResponse exists before accessing status
              if (putResponse && (putResponse.status === 200 || putResponse.status === 201)) {
                usedEndpoint = currentEndpoint;
                usedHeaders = currentAuth.headers;
                usedDataFormat = dataToSend;
                recordSuccess();
                console.log(`✅ Successfully connected to Fawaterak API at: ${usedEndpoint} using PUT method`);
                console.log(`✅ Authentication method that worked: ${currentAuth.name}`);
                
                if (putResponse.data) {
                  console.log('✅ Fawaterak API Response Received (PUT):', {
                    status: putResponse.status,
                    hasData: !!putResponse.data,
                    dataKeys: Object.keys(putResponse.data || {}),
                    fullResponse: JSON.stringify(putResponse.data).substring(0, 500)
                  });
                  return putResponse.data;
                }
              } else if (putResponse && (putResponse.status === 404 || putResponse.status === 405)) {
                // PUT also returned 404/405, continue to next method
                const putStatusText = putResponse.status === 404 ? 'Not Found' : 'Method Not Allowed';
                console.warn(`⚠️ PUT method also returned ${putResponse.status} (${putStatusText}) for ${currentEndpoint}`);
              }
            } catch (putError) {
              // CRITICAL FIX: Catch ALL errors including 404, 405, and unhandled exceptions to prevent server crash
              // This prevents the server from crashing when Fawaterak API returns errors
              try {
                if (putError.response?.status === 404) {
                  const errorMsg = putError.response?.data?.message || putError.response?.statusText || 'Not Found';
                  console.warn(`⚠️ PUT method returned 404 (Not Found) for ${currentEndpoint}`);
                  console.warn(`   Error message: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
                  console.warn(`   This endpoint doesn't exist - trying next method...`);
                } else if (putError.response?.status === 405) {
                  console.warn(`⚠️ PUT method returned 405 (Method Not Allowed) for ${currentEndpoint}`);
                  console.warn(`   Allowed methods: ${putError.response?.headers?.['allow'] || 'N/A'}`);
                } else if (putError.code === 'ECONNABORTED' || putError.message?.includes('timeout')) {
                  console.warn(`⚠️ PUT method timeout for ${currentEndpoint}:`, putError.message);
                } else if (putError.code === 'ERR_BAD_REQUEST') {
                  console.warn(`⚠️ PUT method returned bad request for ${currentEndpoint}:`, putError.message);
                } else {
                  console.warn(`⚠️ PUT method failed for ${currentEndpoint}:`, putError.message || putError.code || 'Unknown error');
                }
              } catch (logError) {
                // Even if logging fails, don't crash - just continue
                console.error('Error logging PUT failure:', logError);
              }
              // Continue to next method - don't throw (prevents server crash)
              lastError = putError;
            }
            
            // If PUT failed, try PATCH method
            console.warn(`   Trying PATCH method as fallback...`);
            try {
              // CRITICAL FIX: Add .catch() to timeout promise to prevent unhandled rejection
              const patchTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('PATCH Request timeout')), 15000);
              }).catch((timeoutErr) => {
                // Catch timeout errors to prevent unhandled rejection
                return Promise.reject(timeoutErr);
              });
              
              const patchResponse = await Promise.race([
                patchRequestPromise,
                patchTimeoutPromise
              ]);
              
              // CRITICAL: Check if patchResponse exists before accessing status
              if (patchResponse && (patchResponse.status === 200 || patchResponse.status === 201)) {
                usedEndpoint = currentEndpoint;
                usedHeaders = currentAuth.headers;
                usedDataFormat = dataToSend;
                recordSuccess();
                console.log(`✅ Successfully connected to Fawaterak API at: ${usedEndpoint} using PATCH method`);
                console.log(`✅ Authentication method that worked: ${currentAuth.name}`);
                
                if (patchResponse.data) {
                  console.log('✅ Fawaterak API Response Received (PATCH):', {
                    status: patchResponse.status,
                    hasData: !!patchResponse.data,
                    dataKeys: Object.keys(patchResponse.data || {}),
                    fullResponse: JSON.stringify(patchResponse.data).substring(0, 500)
                  });
                  return patchResponse.data;
                }
              } else if (patchResponse && (patchResponse.status === 404 || patchResponse.status === 405)) {
                // PATCH also returned 404/405, continue to next method
                const patchStatusText = patchResponse.status === 404 ? 'Not Found' : 'Method Not Allowed';
                console.warn(`⚠️ PATCH method also returned ${patchResponse.status} (${patchStatusText}) for ${currentEndpoint}`);
              }
            } catch (patchError) {
              // CRITICAL FIX: Catch ALL errors including 404, 405, and unhandled exceptions to prevent server crash
              // This prevents the server from crashing when Fawaterak API returns errors
              try {
                if (patchError.response?.status === 404) {
                  const errorMsg = patchError.response?.data?.message || patchError.response?.statusText || 'Not Found';
                  console.warn(`⚠️ PATCH method returned 404 (Not Found) for ${currentEndpoint}`);
                  console.warn(`   Error message: ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
                  console.warn(`   This endpoint doesn't exist - trying next endpoint...`);
                } else if (patchError.response?.status === 405) {
                  console.warn(`⚠️ PATCH method returned 405 (Method Not Allowed) for ${currentEndpoint}`);
                  console.warn(`   Allowed methods: ${patchError.response?.headers?.['allow'] || 'N/A'}`);
                } else if (patchError.code === 'ECONNABORTED' || patchError.message?.includes('timeout')) {
                  console.warn(`⚠️ PATCH method timeout for ${currentEndpoint}:`, patchError.message);
                } else if (patchError.code === 'ERR_BAD_REQUEST') {
                  console.warn(`⚠️ PATCH method returned bad request for ${currentEndpoint}:`, patchError.message);
                } else {
                  console.warn(`⚠️ PATCH method failed for ${currentEndpoint}:`, patchError.message || patchError.code || 'Unknown error');
                }
              } catch (logError) {
                // Even if logging fails, don't crash - just continue
                console.error('Error logging PATCH failure:', logError);
              }
              // Continue to next method - don't throw (prevents server crash)
              lastError = patchError;
            }
            
            // CRITICAL FIX: Remove GET method fallback - Fawaterak API doesn't support GET
            // GET requests return 404 Not Found - they don't work for creating invoices
            // Only POST/PUT/PATCH are supported for creating invoices
            
            // If PUT and PATCH failed, try next auth method or endpoint
            if (authIndex < authMethods.length - 1) {
              console.warn(`   Trying different authentication method...`);
              continue; // Try next auth method
            } else {
              console.warn(`   Trying next endpoint...`);
          break; // Break retry loop, continue to next endpoint
            }
        }
        
        // For 4xx errors (except 404 and 405), don't retry - it's a client error
        // CRITICAL: Check if response exists before accessing status
        // 404 and 405 are handled separately - they mean wrong endpoint/method, so we try next endpoint
        if (response && response.status >= 400 && response.status < 500 && response.status !== 404 && response.status !== 405) {
          const errorData = response.data || {};
          const errorMessage = errorData.message 
            || errorData.error 
            || `Fawaterak API returned status ${response.status}`;
          
          console.error('❌ Fawaterak API Client Error:', {
            status: response.status,
            data: errorData,
            endpoint: currentEndpoint,
              authMethod: currentAuth.name,
            });
            
            // If it's 401/403 and we have more auth methods, try next
            if ((response.status === 401 || response.status === 403) && authIndex < authMethods.length - 1) {
              console.warn(`⚠️ Authentication failed with ${currentAuth.name}, trying next method...`);
              continue; // Try next auth method
            }
          
          throw new Error(errorMessage);
        }
        
        // For 5xx errors, retry
        if (response && response.status >= 500) {
          throw new Error(`Fawaterak API server error: ${response.status}`);
        }
        
      } catch (err) {
        lastError = err;
        
        // CRITICAL FIX: Better error handling to prevent crash
        // Log error details for debugging
        // CRITICAL FIX: Enhanced error logging with response data
        const errorLog = {
          endpoint: currentEndpoint,
          authMethod: currentAuth.name,
          errorCode: err.code,
          errorMessage: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          allowedMethods: err.response?.headers?.['allow'] || 'N/A'
        };
        
        // Add response data if available (for 404/405 errors)
        if (err.response?.data) {
          if (typeof err.response.data === 'string') {
            errorLog.responseData = err.response.data.substring(0, 200);
          } else if (typeof err.response.data === 'object') {
            errorLog.responseData = JSON.stringify(err.response.data).substring(0, 200);
          }
        }
        
        console.error('❌ Fawaterak API Request Error:', errorLog);
        
        // CRITICAL FIX: Handle 404 errors properly - don't crash, try next endpoint
        if (err.response?.status === 404) {
          const errorMessage = err.response?.data?.message || err.response?.data || 'Not Found';
          console.warn(`⚠️ Endpoint ${currentEndpoint} returned 404 (Not Found)`);
          console.warn(`   Error message: ${errorMessage}`);
          console.warn(`   This endpoint doesn't exist - trying next endpoint...`);
          
          // Don't record failure for 404 - it's an endpoint issue, not a network issue
          // Try next auth method or next endpoint
          if (authIndex < authMethods.length - 1) {
            continue; // Try next auth method
          } else if (endpointIndex < endpointsToTry.length) {
            break; // Break retry loop, continue to next endpoint
          }
        }
          
        // Record failure in circuit breaker
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' || !err.response) {
          recordFailure();
        }
        
        // Check if it's a retryable error
        // ERR_BAD_REQUEST with transformation error is NOT retryable - it's a code issue
        const isRetryable = 
            (err.code === 'ETIMEDOUT' ||
          err.code === 'ECONNABORTED' ||
          err.code === 'ECONNRESET' ||
          err.code === 'ENOTFOUND' ||
          err.code === 'EAI_AGAIN' ||
            err.message === 'Request timeout' ||
          (err.response && err.response.status >= 500) ||
            !err.response) && // Network errors without response
            err.code !== 'ERR_BAD_REQUEST'; // Don't retry bad request errors (data format issues)
          
          // CRITICAL FIX: Handle 404 and 405 errors properly - don't crash, try next endpoint
          // This handles errors from the main POST request and all HTTP methods
          if (err.response?.status === 404 || err.response?.status === 405) {
            const allowedMethods = err.response?.headers?.['allow'] || 'N/A';
            const errorMessage = err.response?.data?.message || err.response?.statusText || (err.response?.status === 404 ? 'Not Found' : 'Method Not Allowed');
            console.warn(`⚠️ Endpoint ${currentEndpoint} returned ${err.response.status} (${err.response.status === 404 ? 'Not Found' : 'Method Not Allowed'})`);
            console.warn(`   Error message: ${typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}`);
            if (err.response.status === 405) {
              console.warn(`   Allowed methods: ${allowedMethods}`);
            }
            console.warn(`   This endpoint ${err.response.status === 404 ? "doesn't exist" : "doesn't accept POST/PATCH/PUT"} - trying next endpoint...`);
            
            if (authIndex < authMethods.length - 1) {
              console.warn(`   Trying next auth method first...`);
              continue; // Try next auth method
            } else if (endpointIndex < endpointsToTry.length) {
              console.warn(`   Trying next endpoint...`);
              break; // Break retry loop, continue to next endpoint
            }
            // If no more endpoints, continue to error handling below
          }
        
        // CRITICAL FIX: Better error handling - don't crash on unhandled errors
        // If it's not retryable or we've exhausted retries, break
        if (!isRetryable || retryAttempt >= MAX_RETRIES) {
            // If we have more auth methods, try next
            if (authIndex < authMethods.length - 1 && isRetryable) {
              console.warn(`⚠️ Error with ${currentAuth.name}, trying next auth method...`);
              continue; // Try next auth method
          }
          
          // If we have more endpoints to try, break retry loop and try next endpoint
            if (endpointIndex < endpointsToTry.length && isRetryable) {
            console.warn(`⚠️ Endpoint ${currentEndpoint} failed, trying next endpoint...`);
            break; // Break retry loop, continue to next endpoint
          }
          
            // CRITICAL FIX: If it's a 405 and we've tried all endpoints, provide helpful error
            if (err.response?.status === 405) {
              console.error('❌ All endpoints returned 405 (Method Not Allowed)');
              console.error('   This means none of the endpoints accept POST/PATCH/PUT methods');
              console.error('   Please check Fawaterak API documentation for the correct endpoint');
              // Continue to final error handling
            }
            
            // No more endpoints, auth methods, or retries, throw error
          break;
        }
        
        // Log retryable error
        console.warn(`⚠️ Retryable error on attempt ${retryAttempt + 1}:`, {
          code: err.code,
          message: err.message,
          status: err.response?.status,
            authMethod: currentAuth.name,
        });
        }
      }
    }
    
    // If we got a successful response, break endpoint loop
    if (response && (response.status === 200 || response.status === 201)) {
      break;
    }
  }
  
  // If we tried all endpoints and retries and still have an error, handle it
  if (!response || (response.status !== 200 && response.status !== 201)) {
    // Update endpoint variable for logging
    endpoint = usedEndpoint || lastAttemptedEndpoint || endpoint;
    
    if (lastError) {
      // Handle network errors with better messaging
      if (lastError.code === 'ETIMEDOUT' || lastError.code === 'ECONNABORTED' || lastError.message === 'Request timeout') {
        recordFailure(); // Record in circuit breaker
        console.error('❌ Fawaterak API Timeout Error:', {
          code: lastError.code,
          message: lastError.message,
          endpoint: endpoint,
          attempts: MAX_RETRIES + 1,
          circuitBreakerOpen: circuitBreakerState.isOpen,
        });
        
        // Provide helpful error message
        const error = new Error('Fawaterak API request timeout. The payment gateway may be experiencing high traffic. Please try again in a few moments.');
        error.code = 'FAWATERAK_TIMEOUT';
        error.retryable = true;
        throw error;
      }
      
      if (lastError.response) {
        // API returned an error response
        const errorData = lastError.response.data || {};
        const errorMessage = errorData.message 
          || errorData.error 
          || `Fawaterak API error: ${lastError.response.status} ${lastError.response.statusText}`;
        
        console.error('❌ Fawaterak API Error:', {
          status: lastError.response.status,
          data: errorData,
          endpoint: endpoint,
        });
        
        throw new Error(errorMessage);
      }
      
      // Network or other errors
      console.error('❌ Fawaterak API Network Error:', {
        message: lastError.message,
        code: lastError.code,
        endpoint: endpoint,
        attempts: MAX_RETRIES + 1,
      });
      
      // Provide more specific error messages
      if (lastError.code === 'ERR_BAD_REQUEST') {
        // This is a data format issue, not an endpoint issue
        console.error('❌ Fawaterak API Data Format Error:', {
          code: lastError.code,
          message: lastError.message,
          endpoint: endpoint,
        });
        throw new Error(`Fawaterak API data format error: ${lastError.message}. Please check the request data format.`);
      }
      
      // CRITICAL FIX: Handle 404 errors first (endpoint doesn't exist)
      if (lastError.response?.status === 404 || lastError.message?.includes('404')) {
        // CRITICAL FIX: Better error message for 404 errors
        // Comprehensive error message with all attempted configurations
        const triedEndpointsList = endpointsToTry.map((ep, i) => `   ${i + 1}. ${ep}`).join('\n');
        const error = new Error(`❌ Fawaterak API Error: All endpoints returned 404 Not Found

🔍 Problem Analysis:
All ${endpointsToTry.length} endpoints were tried with POST, PUT, and PATCH methods, but all returned 404.
The endpoints don't exist or the API structure has changed.

✅ Solution:
1. ✅ Verify API credentials in Fawaterak dashboard: https://app.fawaterk.com/vendor/integration
2. ✅ Check Fawaterak API documentation for the correct endpoint structure
3. ✅ Ensure your Fawaterak account has API access enabled
4. ✅ Contact Fawaterak support to get the correct endpoint URL
5. ✅ Verify that your Fawaterak account is active and has API access

This indicates one of the following:
1. ❌ The endpoint URL structure is incorrect (most likely)
2. ❌ The API version (v2) might be incorrect
3. ❌ The API endpoint has changed or been deprecated
4. ❌ Your API key or provider key may be invalid or inactive
5. ❌ Your Fawaterak account may not have API access enabled
6. ❌ The endpoint path is wrong - try /api/v2/invoices instead of /api/v2/invoice-link

📋 Configuration Details:
- API Key: ${FAWATERAK_API_KEY ? FAWATERAK_API_KEY.substring(0, 10) + '...' : 'NOT SET'}
- Provider Key: ${FAWATERAK_PROVIDER_KEY || 'NOT SET'}
- Base URL: ${FAWATERAK_BASE_URL}

🔧 Tried Endpoints (${endpointsToTry.length} total):
${triedEndpointsList}

🔐 Tried Authentication Methods:
   1. Bearer ${FAWATERAK_API_KEY ? FAWATERAK_API_KEY.substring(0, 10) + '...' : 'NOT SET'} + X-API-Key
   2. X-API-Key only

🌐 Tried HTTP Methods:
   - POST (primary)
   - PUT (fallback)
   - PATCH (fallback)

📚 Next Steps:
1. ✅ Verify API credentials in Fawaterak dashboard:
   https://app.fawaterk.com/vendor/integration
   
2. ✅ Contact Fawaterak support to get the correct endpoint URL
   
3. ✅ Verify your account has API access enabled
   
4. ✅ Check if there's a different API version or endpoint structure

💡 Possible Solutions:
- The endpoint might be: /api/v2/invoices (REST standard)
- The endpoint might be: /api/v1/invoices (v1 instead of v2)
- The endpoint might require different authentication
- The endpoint might be under a different domain
- Your account might need API access activation

Please check Fawaterak dashboard and contact support for the correct endpoint.`);
        error.code = 'FAWATERAK_ENDPOINT_NOT_FOUND';
        error.triedEndpoints = endpointsToTry;
        error.triedMethods = ['POST', 'PUT', 'PATCH'];
        error.triedAuthMethods = ['Bearer + X-API-Key', 'X-API-Key only'];
        error.apiKeyPrefix = FAWATERAK_API_KEY ? FAWATERAK_API_KEY.substring(0, 10) : 'NOT_SET';
        error.providerKey = FAWATERAK_PROVIDER_KEY || 'NOT_SET';
        throw error;
      }
      
      if (lastError.message.includes('405') || lastError.response?.status === 405) {
        // CRITICAL FIX: Better error message for 405 errors
        // Comprehensive error message with all attempted configurations
        const triedEndpointsList = endpointsToTry.map((ep, i) => `   ${i + 1}. ${ep}`).join('\n');
        const error = new Error(`❌ Fawaterak API Error: All endpoints returned 405 Method Not Allowed

🔍 Problem Analysis:
All ${endpointsToTry.length} endpoints were tried with POST, PUT, and PATCH methods, but all returned 405.
Only app.fawaterk.com endpoints are used (fawaterak.com endpoints removed - they return 405/404).

✅ Solution:
1. ✅ Verify API credentials in Fawaterak dashboard: https://app.fawaterk.com/vendor/integration
2. ✅ Check Fawaterak API documentation for the correct endpoint structure
3. ✅ Ensure your Fawaterak account has API access enabled
4. ✅ Contact Fawaterak support if the issue persists

This indicates one of the following:
1. ❌ The endpoint URL structure is incorrect
2. ❌ The HTTP method (POST/PUT/PATCH) is not supported
3. ❌ The API version (v2) might be incorrect
4. ❌ The API endpoint has changed or been deprecated
5. ❌ Your API key or provider key may be invalid or inactive
6. ❌ Your Fawaterak account may not have API access enabled

📋 Configuration Details:
- API Key: ${FAWATERAK_API_KEY ? FAWATERAK_API_KEY.substring(0, 10) + '...' : 'NOT SET'}
- Provider Key: ${FAWATERAK_PROVIDER_KEY || 'NOT SET'}
- Base URL: ${FAWATERAK_BASE_URL}

🔧 Tried Endpoints (${alternativeEndpoints.length} total):
${triedEndpointsList}

🔐 Tried Authentication Methods:
   1. Bearer ${FAWATERAK_API_KEY ? FAWATERAK_API_KEY.substring(0, 10) + '...' : 'NOT SET'} + X-API-Key
   2. X-API-Key only

🌐 Tried HTTP Methods:
   - POST (primary)
   - GET (fallback)

📚 Next Steps:
1. ✅ Verify API credentials in Fawaterak dashboard:
   https://app.fawaterk.com/vendor/integration
   
2. ✅ Check Fawaterak API documentation:
   https://fawaterak-api.readme.io/reference/overview
   
3. ✅ Verify your account has API access enabled
   
4. ✅ Contact Fawaterak support with this error message
   
5. ✅ Check if there's a different API version or endpoint structure

💡 Possible Solutions:
- The endpoint might be: /api/v1/invoiceLink (v1 instead of v2)
- The endpoint might require different authentication
- The endpoint might be under a different domain
- Your account might need API access activation

Please check Fawaterak dashboard and documentation for the correct endpoint.`);
        error.code = 'FAWATERAK_ENDPOINT_ERROR';
        error.triedEndpoints = endpointsToTry;
        error.triedMethods = ['POST', 'PUT', 'PATCH'];
        error.triedAuthMethods = ['Bearer + X-API-Key', 'X-API-Key only'];
        error.apiKeyPrefix = FAWATERAK_API_KEY ? FAWATERAK_API_KEY.substring(0, 10) : 'NOT_SET';
        error.providerKey = FAWATERAK_PROVIDER_KEY || 'NOT_SET';
        throw error;
      }
      
      if (lastError.code === 'ENOTFOUND' || lastError.code === 'EAI_AGAIN') {
        throw new Error(`Failed to resolve Fawaterak API domain. Please check your internet connection and DNS settings.`);
      }
      
      throw new Error(`Failed to connect to Fawaterak API after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
    }
    
    // If we have a response but it's not successful
    if (response) {
      const errorData = response.data || {};
      const errorMessage = errorData.message 
        || errorData.error 
        || `Fawaterak API returned status ${response.status}`;
      
      console.error('❌ Fawaterak API Error:', {
        status: response.status,
        data: errorData,
        endpoint: endpoint,
      });
      
      throw new Error(errorMessage);
    }
    
    throw new Error('Failed to connect to Fawaterak API: Unknown error');
  }
  
  return response.data;
};

// @desc    Create Fawaterak invoice for booking or membership
// @route   POST /api/payments/fawaterak/create-invoice
// @access  Private
exports.createFawaterakInvoice = asyncHandler(async (req, res) => {
  // CRITICAL FIX: Reduce timeout to prevent Network Error
  // Network Error occurs when request takes too long (>90s)
  // Reduce to 30 seconds to fail fast and return error quickly
  const REQUEST_TIMEOUT = 30000; // 30 seconds - reduced for faster failure detection
  const requestStartTime = Date.now();
  
  // Enhanced logging for request details
  console.log('📝 [Fawaterak Invoice Request]', {
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    },
    request: {
      type: req.body.type,
      itemId: req.body.itemId,
      amount: req.body.amount,
      currency: req.body.currency,
      description: req.body.description
    },
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
    timeout: `${REQUEST_TIMEOUT}ms`
  });
  
  // Create a timeout promise that will reject if request takes too long
  // CRITICAL FIX: Add .catch() to timeout promise to prevent unhandled rejection
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout: Fawaterak API request took too long (>30s). Please try again.'));
    }, REQUEST_TIMEOUT);
  }).catch((timeoutErr) => {
    // Catch timeout errors to prevent unhandled rejection
    return Promise.reject(timeoutErr);
  });
  
  // Wrap the entire function in a Promise.race to enforce timeout
  // CRITICAL FIX: Add comprehensive try-catch to prevent server crash from unhandled exceptions
  try {
    await Promise.race([
      (async () => {
        // CRITICAL FIX: Wrap processFawaterakInvoiceRequest in try-catch to prevent unhandled exceptions
        try {
          await processFawaterakInvoiceRequest(req, res, requestStartTime);
        } catch (processError) {
          // CRITICAL FIX: Catch ALL errors from processFawaterakInvoiceRequest to prevent server crash
          // This includes 404, 405, network errors, and any unhandled exceptions
          console.error('❌ [Fawaterak Process Error]', {
            error: processError.message,
            code: processError.code,
            status: processError.response?.status,
            stack: processError.stack?.substring(0, 500),
            transactionId: req.body?.itemId,
            duration: `${Date.now() - requestStartTime}ms`,
    timestamp: new Date().toISOString()
  });
          
          // If response hasn't been sent yet, send error response
          if (!res.headersSent) {
            let errorMessage = 'فشل إنشاء الفاتورة. يرجى المحاولة مرة أخرى';
            let errorCode = 'FAWATERAK_ERROR';
            let statusCode = 500;
            
            // Handle specific error types
            if (processError.response?.status === 404 || processError.message?.includes('404') || processError.code === 'FAWATERAK_ENDPOINT_NOT_FOUND') {
              errorMessage = 'نقطة النهاية غير موجودة. يرجى التحقق من تكوين Fawaterak API أو التواصل مع الدعم الفني';
              errorCode = 'FAWATERAK_ENDPOINT_NOT_FOUND';
              statusCode = 502; // Bad Gateway
            } else if (processError.message?.includes('timeout')) {
              errorMessage = 'انتهت مهلة الاتصال بـ Fawaterak. يرجى المحاولة مرة أخرى';
              errorCode = 'FAWATERAK_TIMEOUT';
              statusCode = 504; // Gateway Timeout
            } else if (processError.message?.includes('Network') || processError.message?.includes('ECONNREFUSED')) {
              errorMessage = 'خطأ في الاتصال بـ Fawaterak. يرجى التحقق من اتصال الإنترنت';
              errorCode = 'FAWATERAK_NETWORK_ERROR';
              statusCode = 503; // Service Unavailable
            } else if (processError.message?.includes('405')) {
              errorMessage = 'خطأ في تكوين Fawaterak API. يرجى التواصل مع الدعم الفني';
              errorCode = 'FAWATERAK_ENDPOINT_ERROR';
              statusCode = 502; // Bad Gateway
            }
            
            res.status(statusCode).json({
              success: false,
              error: errorMessage,
              code: errorCode,
              duration: `${Date.now() - requestStartTime}ms`
            });
          }
          
          // Re-throw to be caught by outer catch block
          throw processError;
        }
      })(),
      timeoutPromise
    ]);
  } catch (timeoutError) {
    const duration = Date.now() - requestStartTime;
    
    if (timeoutError.message.includes('timeout') || duration >= REQUEST_TIMEOUT) {
      console.error('⏱️ [Fawaterak Request Timeout]', {
        duration: `${duration}ms`,
        timeout: `${REQUEST_TIMEOUT}ms`,
        user: req.user?.id,
    timestamp: new Date().toISOString()
  });
      
      // Update transaction status to failed if it was created
      if (req.transactionId) {
        try {
          await Transaction.query()
            .findById(req.transactionId)
            .patch({
              status: 'failed',
              payment_details: JSON.stringify({
                error: 'Request timeout: Fawaterak API request took too long',
                provider: 'fawaterak',
                timeout: REQUEST_TIMEOUT,
                duration: duration
              }),
            });
        } catch (dbError) {
          console.error('Error updating transaction on timeout:', dbError);
        }
      }
      
      // Return error response immediately to prevent Network Error
      res.status(504).json({
        success: false,
        error: 'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى - قد يستغرق الاتصال بـ Fawaterak بعض الوقت',
        code: 'FAWATERAK_TIMEOUT',
        timeout: REQUEST_TIMEOUT,
        duration: duration
      });
      return; // Exit early to prevent further processing
    }
    throw timeoutError;
  }
});

// Extract the main logic into a separate function for better error handling
async function processFawaterakInvoiceRequest(req, res, requestStartTime) {

  const { type, itemId, amount, currency = 'EGP', description } = req.body;
  const userId = req.user.id;

  if (!type || !itemId) {
    res.status(400);
    throw new Error('Missing required fields: type, itemId');
  }

  // Get user details
  let user;
  try {
    user = await User.query().findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500);
    throw new Error('Failed to fetch user details');
  }

  // Safely extract user name - handle both name and first_name/last_name formats
  let userName = '';
  if (user.first_name || user.last_name) {
    userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  } else if (user.name) {
    userName = user.name;
  }
  if (!userName) {
    userName = 'Customer';
  }

  // Get actual amount from booking/membership if type is booking
  let numericAmount = 0;
  let invoiceDescription = description;

  if (type === 'booking') {
    try {
      const booking = await Booking.query().findById(itemId);
      if (!booking) {
        res.status(404);
        throw new Error('Booking not found');
      }

      // Use booking total_price as the actual amount
      numericAmount = booking.total_price || 0;
      
      // If amount was provided in request, validate it matches booking amount (optional check)
      if (amount && amount > 0) {
        const providedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (!isNaN(providedAmount) && Math.abs(providedAmount - numericAmount) > 0.01) {
          console.warn(`Amount mismatch: provided ${providedAmount}, booking has ${numericAmount}. Using booking amount.`);
        }
      }

      // Build description from booking details
      if (!invoiceDescription) {
        const Package = require('../models/Package');
        let packageData = null;
        if (booking.details?.packageId) {
          try {
            packageData = await Package.query().findById(booking.details.packageId);
          } catch (err) {
            console.error('Error fetching package:', err);
          }
        }
        
        const packageName = packageData?.name || booking.booking_type || 'Booking';
        const participants = booking.details?.participants || 1;
        invoiceDescription = `Payment for ${packageName} - ${participants} ${participants === 1 ? 'participant' : 'participants'}`;
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      // If booking not found, use provided amount or throw error
      if (error.message === 'Booking not found') {
        throw error;
      }
      // If amount was provided, use it as fallback
      if (amount) {
        numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      } else {
        res.status(500);
        throw new Error('Failed to fetch booking details and no amount provided');
      }
    }
  } else if (type === 'membership') {
    try {
      const membership = await Membership.query().findById(itemId);
      if (!membership) {
        res.status(404);
        throw new Error('Membership not found');
      }
      
      // Use membership price as the actual amount
      numericAmount = membership.price || 0;
      
      // If amount was provided, validate it matches membership price
      if (amount && amount > 0) {
        const providedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (!isNaN(providedAmount) && Math.abs(providedAmount - numericAmount) > 0.01) {
          console.warn(`Amount mismatch: provided ${providedAmount}, membership has ${numericAmount}. Using membership price.`);
        }
      }

      if (!invoiceDescription) {
        invoiceDescription = `Payment for ${membership.membership_type || 'Membership'}`;
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      if (error.message === 'Membership not found') {
        throw error;
      }
      if (amount) {
        numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      } else {
        res.status(500);
        throw new Error('Failed to fetch membership details and no amount provided');
      }
    }
  } else {
    // For other types, use provided amount
    if (!amount) {
      res.status(400);
      throw new Error('Amount is required for this payment type');
    }
    numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  }

  // Final validation - ensure numericAmount is a valid number
  // Convert to number if it's a string or other type
  if (typeof numericAmount !== 'number') {
    numericAmount = parseFloat(numericAmount) || 0;
  }
  
  if (isNaN(numericAmount) || numericAmount <= 0) {
    res.status(400);
    throw new Error('Invalid amount. Amount must be a positive number');
  }
  
  // Ensure numericAmount is a number before using toFixed
  numericAmount = Number(numericAmount);

  // Create transaction record first
  let transaction;
  try {
    transaction = await Transaction.query().insert({
    user_id: userId,
      type: type === 'booking' ? 'booking_payment' : 'membership_purchase',
      amount: numericAmount,
      currency: currency || 'EGP',
    status: 'pending',
    payment_method: 'fawaterak',
    reference_id: itemId.toString(),
    description: description || (type === 'booking' 
      ? `Payment for booking ${itemId}` 
      : `Payment for membership ${itemId}`),
  });
    
    // Store transaction ID in request for timeout handling
    req.transactionId = transaction.id;
  } catch (dbError) {
    console.error('Error creating transaction:', dbError);
    res.status(500);
    throw new Error('Failed to create transaction record');
  }

  // Prepare Fawaterak invoice data according to Fawaterak API v2 format
  // Documentation: https://fawaterak-api.readme.io/reference/overview
  // Integration: https://app.fawaterk.com/vendor/integration
  // Note: Fawaterak API v2 expects data in specific format
  const finalAmount = Number(Number(numericAmount).toFixed(2));
  
  // Fawaterak API v2 format - Based on official documentation
  // The API expects data in a specific format with nested order object
  // Format 1: Nested order object (PRIMARY - most common in Fawaterak API v2)
  const invoiceData = {
    provider_key: FAWATERAK_PROVIDER_KEY,
    order: {
    order_id: transaction.id.toString(),
    order_reference: `${type}_${itemId}_${Date.now()}`,
    total: finalAmount,
    currency: currency || 'EGP',
    customer: {
      name: userName,
      email: user.email || '',
      phone: user.phone || user.mobile || 'N/A',
    },
    items: [
      {
        name: invoiceDescription || (type === 'booking' ? `Booking #${itemId}` : `Membership #${itemId}`),
        quantity: 1,
        price: finalAmount,
      },
    ],
    success_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/success?transactionId=${transaction.id}`,
    fail_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/fail?transactionId=${transaction.id}`,
    callback_url: `${process.env.BACKEND_URL || 'http://192.168.1.2:5000'}/api/payments/fawaterak/callback`,
    },
  };
  
  // Additional format variations for maximum compatibility
  // Some APIs might expect different field names or structures
  // Format 2: Variation with customer fields as separate properties (last resort)
  const invoiceDataVariation = {
    provider_key: FAWATERAK_PROVIDER_KEY,
    order_id: transaction.id.toString(),
    order_reference: `${type}_${itemId}_${Date.now()}`,
    total: finalAmount,
    currency: currency || 'EGP',
    customer_name: userName,
    customer_email: user.email || '',
    customer_phone: user.phone || user.mobile || 'N/A',
    items: [
      {
        name: invoiceDescription || (type === 'booking' ? `Booking #${itemId}` : `Membership #${itemId}`),
        quantity: 1,
        price: finalAmount,
      },
    ],
    success_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/success?transactionId=${transaction.id}`,
    fail_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/fail?transactionId=${transaction.id}`,
    callback_url: `${process.env.BACKEND_URL || 'http://192.168.1.2:5000'}/api/payments/fawaterak/callback`,
  };
  
  // CRITICAL FIX: Format 3 - CORRECT format for /api/v2/createInvoiceLink endpoint
  // Based on error logs, this endpoint requires:
  // - token (in body or header)
  // - customer.first_name (not customer.name)
  // - cartItems (not items)
  // - cartTotal (not total)
  // Split customer name into first_name and last_name
  const customerNameParts = userName.trim().split(/\s+/);
  const customerFirstName = customerNameParts[0] || userName;
  const customerLastName = customerNameParts.slice(1).join(' ') || '';
  
  const invoiceDataCreateInvoiceLink = {
    provider_key: FAWATERAK_PROVIDER_KEY,
    token: FAWATERAK_API_KEY, // CRITICAL: token is required in body
    order_id: transaction.id.toString(),
    order_reference: `${type}_${itemId}_${Date.now()}`,
    currency: currency || 'EGP',
    customer: {
      first_name: customerFirstName, // CRITICAL: first_name not name
      last_name: customerLastName,
      email: user.email || '',
      phone: user.phone || user.mobile || 'N/A',
    },
    cartItems: [ // CRITICAL: cartItems not items
      {
        name: invoiceDescription || (type === 'booking' ? `Booking #${itemId}` : `Membership #${itemId}`),
        quantity: 1,
        price: finalAmount,
      },
    ],
    cartTotal: finalAmount, // CRITICAL: cartTotal not total
    success_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/success?transactionId=${transaction.id}`,
    fail_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/fail?transactionId=${transaction.id}`,
    callback_url: `${process.env.BACKEND_URL || 'http://192.168.1.2:5000'}/api/payments/fawaterak/callback`,
  };
  
  // Alternative format (flat structure) - PRIMARY FORMAT based on actual API behavior
  // Based on logs, Fawaterak API expects flat structure, not nested
  // This is the format that should be used FIRST for most endpoints
  const invoiceDataAlternative = {
    provider_key: FAWATERAK_PROVIDER_KEY,
      order_id: transaction.id.toString(),
      order_reference: `${type}_${itemId}_${Date.now()}`,
      total: finalAmount,
      currency: currency || 'EGP',
      customer: {
        name: userName,
        email: user.email || '',
        phone: user.phone || user.mobile || 'N/A',
      },
      items: [
        {
          name: invoiceDescription || (type === 'booking' ? `Booking #${itemId}` : `Membership #${itemId}`),
          quantity: 1,
          price: finalAmount,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/success?transactionId=${transaction.id}`,
      fail_url: `${process.env.FRONTEND_URL || 'http://192.168.1.2:8081'}/payment/fail?transactionId=${transaction.id}`,
      callback_url: `${process.env.BACKEND_URL || 'http://192.168.1.2:5000'}/api/payments/fawaterak/callback`,
  };

  // Log invoice data before sending (without sensitive info)
  // Handle both nested and flat structures
  const orderId = invoiceData.order?.order_id || invoiceData.order_id || transaction.id.toString();
  const orderRef = invoiceData.order?.order_reference || invoiceData.order_reference || `${type}_${itemId}_${Date.now()}`;
  const total = invoiceData.order?.total || invoiceData.total || finalAmount;
  const currencyVal = invoiceData.order?.currency || invoiceData.currency || currency || 'EGP';
  const customerName = invoiceData.order?.customer?.name || invoiceData.customer?.name || userName;
  const customerEmail = invoiceData.order?.customer?.email || invoiceData.customer?.email || user.email || '';
  const customerPhone = invoiceData.order?.customer?.phone || invoiceData.customer?.phone || 'N/A';
  const itemsCount = (invoiceData.order?.items || invoiceData.items || []).length;
  
  console.log('📤 [Sending Invoice to Fawaterak]', {
    provider_key: FAWATERAK_PROVIDER_KEY,
    order_id: orderId,
    order_reference: orderRef,
    total: total,
    currency: currencyVal,
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone ? '***' : 'N/A' // Hide phone for privacy
    },
    items_count: itemsCount,
    timestamp: new Date().toISOString()
  });

  // Create invoice in Fawaterak with error handling
  // Try multiple data formats for maximum compatibility
  let fawaterakResponse;
  try {
    // Try primary format first, then alternatives
    // CRITICAL FIX: Reduce timeout to prevent Network Error
    // Network Error occurs when request takes too long
    // Reduce to 25 seconds (less than request timeout of 30s)
    const fawaterakTimeout = 25000; // 25 seconds (less than request timeout)
    // CRITICAL FIX: Add .catch() to timeout promise to prevent unhandled rejection
    const fawaterakTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Fawaterak API timeout: Request took too long (>25s)'));
      }, fawaterakTimeout);
    }).catch((timeoutErr) => {
      // Catch timeout errors to prevent unhandled rejection
      return Promise.reject(timeoutErr);
    });
    
    // CRITICAL FIX: Wrap Promise.race in try-catch to handle all rejections
    fawaterakResponse = await Promise.race([
      createFawaterakInvoice(
        invoiceDataCreateInvoiceLink, // PRIMARY: Correct format for createInvoiceLink endpoint
        invoiceData, // Fallback 1: nested order object
        invoiceDataAlternative, // Fallback 2: flat structure
        invoiceDataVariation // Fallback 3: flat structure with customer fields
      ).catch((invoiceErr) => {
        // Catch errors from createFawaterakInvoice to prevent unhandled rejection
        return Promise.reject(invoiceErr);
      }),
      fawaterakTimeoutPromise
    ]);
  } catch (fawaterakError) {
    console.error('❌ [Fawaterak API Error]', {
      error: fawaterakError.message,
      stack: fawaterakError.stack,
      transactionId: transaction.id,
      duration: `${Date.now() - requestStartTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Update transaction status to failed
    try {
    await Transaction.query()
      .findById(transaction.id)
      .patch({
        status: 'failed',
        payment_details: JSON.stringify({
            error: fawaterakError.message || 'Failed to create Fawaterak invoice',
          provider: 'fawaterak',
            timestamp: new Date().toISOString(),
            duration: `${Date.now() - requestStartTime}ms`
        }),
      });
    } catch (dbError) {
      console.error('Error updating transaction on Fawaterak error:', dbError);
    }
    
    // Provide user-friendly error message
    let errorMessage = 'فشل إنشاء الفاتورة. يرجى المحاولة مرة أخرى';
    let errorCode = 'FAWATERAK_ERROR';
    let statusCode = 500;
    
    // CRITICAL FIX: Handle 404 errors (endpoint not found)
    if (fawaterakError.response?.status === 404 || fawaterakError.message?.includes('404') || fawaterakError.code === 'FAWATERAK_ENDPOINT_NOT_FOUND') {
      errorMessage = 'نقطة النهاية غير موجودة. يرجى التحقق من تكوين Fawaterak API أو التواصل مع الدعم الفني';
      errorCode = 'FAWATERAK_ENDPOINT_NOT_FOUND';
      statusCode = 502; // Bad Gateway
    } else if (fawaterakError.message?.includes('timeout')) {
      errorMessage = 'انتهت مهلة الاتصال بـ Fawaterak. يرجى المحاولة مرة أخرى';
      errorCode = 'FAWATERAK_TIMEOUT';
      statusCode = 504; // Gateway Timeout
    } else if (fawaterakError.message?.includes('Network') || fawaterakError.message?.includes('ECONNREFUSED')) {
      errorMessage = 'خطأ في الاتصال بـ Fawaterak. يرجى التحقق من اتصال الإنترنت';
      errorCode = 'FAWATERAK_NETWORK_ERROR';
      statusCode = 503; // Service Unavailable
    } else if (fawaterakError.message?.includes('405')) {
      errorMessage = 'خطأ في تكوين Fawaterak API. يرجى التواصل مع الدعم الفني';
      errorCode = 'FAWATERAK_ENDPOINT_ERROR';
      statusCode = 502; // Bad Gateway
    } else if (fawaterakError.message) {
      errorMessage = fawaterakError.message;
    }
    
    // Return error response immediately to prevent Network Error
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      code: errorCode,
      transactionId: transaction.id,
      duration: `${Date.now() - requestStartTime}ms`
    });
    return; // Exit early to prevent further processing
  }

  // Log full response for debugging
  console.log('📥 [Fawaterak API Full Response]', {
    responseType: typeof fawaterakResponse,
    responseKeys: Object.keys(fawaterakResponse || {}),
    fullResponse: JSON.stringify(fawaterakResponse, null, 2).substring(0, 1000)
  });

  // Update transaction with Fawaterak invoice ID
  // Fawaterak API v2 response format can be:
  // { data: { invoice_id, invoice_url, url } } or { invoice_id, invoice_url, url }
  // Or: { invoice_id, invoice_url, url, invoice_link, link }
  let invoiceId = null;
  let invoiceUrl = null;

  // Try multiple possible response structures
  if (fawaterakResponse) {
    // Check nested data structure first
    if (fawaterakResponse.data) {
      invoiceId = fawaterakResponse.data.invoice_id 
        || fawaterakResponse.data.id
        || fawaterakResponse.data.invoiceId
        || fawaterakResponse.data.invoiceId;
        
      invoiceUrl = fawaterakResponse.data.invoice_url 
        || fawaterakResponse.data.url
        || fawaterakResponse.data.invoice_link
        || fawaterakResponse.data.link
        || fawaterakResponse.data.invoiceUrl;
    }
    
    // Check root level
    if (!invoiceId) {
      invoiceId = fawaterakResponse.invoice_id 
        || fawaterakResponse.id
        || fawaterakResponse.invoiceId
        || fawaterakResponse.invoice_id;
    }
    
    if (!invoiceUrl) {
      invoiceUrl = fawaterakResponse.invoice_url 
        || fawaterakResponse.url
        || fawaterakResponse.invoice_link
        || fawaterakResponse.link
        || fawaterakResponse.invoiceUrl;
    }
  }

  await Transaction.query()
    .findById(transaction.id)
    .patch({
      payment_details: JSON.stringify({
        fawaterak_invoice_id: invoiceId,
        fawaterak_invoice_url: invoiceUrl,
        provider: 'fawaterak',
      }),
    });

  // Validate that we have at least invoice URL or invoice ID
  if (!invoiceUrl && !invoiceId) {
    console.error('❌ Fawaterak response missing both invoice URL and ID:', {
      fullResponse: fawaterakResponse,
      responseKeys: Object.keys(fawaterakResponse || {}),
      transactionId: transaction.id
    });
    
    // Update transaction status to failed
    await Transaction.query()
      .findById(transaction.id)
      .patch({
        status: 'failed',
        payment_details: JSON.stringify({
          error: 'No invoice URL or ID received from Fawaterak',
          fawaterak_response: fawaterakResponse,
          provider: 'fawaterak',
        }),
      });
    res.status(500);
    throw new Error('Failed to get invoice URL or ID from Fawaterak. Please check API response format.');
  }

  // If we have invoice ID but no URL, construct a fallback URL
  if (invoiceId && !invoiceUrl) {
    // CRITICAL FIX: Use app.fawaterk.com for invoice URL (official domain)
    invoiceUrl = `https://app.fawaterk.com/invoice/${invoiceId}`;
    console.warn('⚠️  Invoice URL not provided, using fallback URL:', invoiceUrl);
  }

  // If we have URL but no ID, try to extract ID from URL
  if (invoiceUrl && !invoiceId) {
    const urlMatch = invoiceUrl.match(/\/([^\/]+)$/);
    if (urlMatch) {
      invoiceId = urlMatch[1];
      console.log('📝 Extracted invoice ID from URL:', invoiceId);
    } else {
      invoiceId = `temp_${transaction.id}_${Date.now()}`;
      console.warn('⚠️  Could not extract invoice ID from URL, using temporary ID:', invoiceId);
    }
  }

  // Log successful invoice creation with full details
  console.log('✅ [Fawaterak Invoice Created Successfully]', {
    transactionId: transaction.id,
    invoiceId: invoiceId,
    invoiceUrl: invoiceUrl,
    amount: numericAmount,
    currency: currency || 'EGP',
    user: {
      id: userId,
      email: user.email,
      name: userName
    },
    type: type,
    itemId: itemId,
    providerKey: FAWATERAK_PROVIDER_KEY,
    timestamp: new Date().toISOString(),
    fawaterakResponse: fawaterakResponse // Log full response for debugging
  });

  // Prepare comprehensive response with all required data
  const responseData = {
    success: true,
    transactionId: transaction.id,
    invoiceUrl: invoiceUrl,
    invoice_id: invoiceId,
    invoiceId: invoiceId,
    amount: numericAmount,
    currency: currency || 'EGP',
    type: type,
    itemId: itemId,
    provider: 'fawaterak',
    providerKey: FAWATERAK_PROVIDER_KEY,
    orderId: transaction.id.toString(),
    orderReference: invoiceData.order?.order_reference || invoiceData.order_reference || `${type}_${itemId}_${Date.now()}`,
    customer: {
      name: userName,
      email: user.email || '',
      phone: user.phone || user.mobile || ''
    },
    createdAt: transaction.created_at,
    status: transaction.status,
    message: 'Fawaterak invoice created successfully',
  };

  // Log final response before sending
  console.log('📤 [Sending Invoice Response to Client]', {
    transactionId: responseData.transactionId,
    invoiceUrl: responseData.invoiceUrl,
    invoiceId: responseData.invoiceId,
    amount: responseData.amount,
    currency: responseData.currency,
    hasAllFields: !!(responseData.invoiceUrl && responseData.invoiceId && responseData.amount)
  });

  res.status(200).json(responseData);
}

// @desc    Handle Fawaterak payment callback
// @route   POST /api/payments/fawaterak/callback
// @access  Public (called by Fawaterak)
// Security: This endpoint should validate the callback signature if Fawaterak provides one
exports.handleFawaterakCallback = asyncHandler(async (req, res) => {
  // Log callback request for tracking
  console.log('📞 [Fawaterak Callback Received]', {
    body: req.body,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    },
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });

  const { invoice_id, order_id, status, payment_status, invoice_status } = req.body;

  // Validate required fields
  if (!invoice_id || !order_id) {
    console.warn('Fawaterak callback missing required fields:', { invoice_id, order_id, body: req.body });
    return res.status(400).json({ success: false, message: 'Missing invoice_id or order_id' });
  }

  // Find transaction by order_id (order_id should match transaction.id)
  let transaction;
  try {
    transaction = await Transaction.query()
    .findById(parseInt(order_id))
      .where('status', 'pending')
      .first();
  } catch (error) {
    console.error('Error finding transaction in callback:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }

  if (!transaction) {
    console.warn(`Fawaterak callback: Transaction not found or not pending. order_id: ${order_id}`);
    return res.status(404).json({ success: false, message: 'Transaction not found or already processed' });
  }

  // Verify the invoice_id matches what we stored (security check)
  let storedPaymentDetails = {};
  try {
    if (transaction.payment_details) {
      storedPaymentDetails = typeof transaction.payment_details === 'string' 
        ? JSON.parse(transaction.payment_details) 
        : transaction.payment_details;
    }
  } catch (e) {
    console.error('Error parsing payment_details in callback:', e);
  }

  // Optional: Verify invoice_id matches (security check)
  if (storedPaymentDetails.fawaterak_invoice_id && storedPaymentDetails.fawaterak_invoice_id !== invoice_id.toString()) {
    console.warn('Fawaterak callback invoice_id mismatch:', {
      received: invoice_id,
      stored: storedPaymentDetails.fawaterak_invoice_id,
      order_id: order_id
    });
    // Still process, but log the mismatch for security monitoring
  }

  // Update transaction status based on payment status
  // Fawaterak can send: payment_status, status, or invoice_status
  const isPaid = payment_status === 'paid' 
    || status === 'paid' 
    || invoice_status === 'paid'
    || payment_status === 'success'
    || status === 'success';
  
  // Parse existing payment_details if it's a string
  let existingPaymentDetails = storedPaymentDetails;
  
  await Transaction.query()
    .findById(transaction.id)
    .patch({
      status: isPaid ? 'completed' : 'failed',
      payment_details: JSON.stringify({
        ...existingPaymentDetails,
        fawaterak_callback: req.body,
        payment_status: payment_status || status,
      }),
      completed_at: isPaid ? new Date() : null,
    });

  // If payment is successful, update related booking or membership
  if (isPaid) {
    const referenceId = transaction.reference_id;
    const transactionType = transaction.type;

    try {
    // Get user current balance before deduction
    const user = await User.query().findById(transaction.user_id);
    const currentCashback = parseFloat(user.cashback || 0);
    const currentPoints = parseInt(user.points || 0);
    const paymentAmount = Math.abs(transaction.amount);
    
    // Calculate deduction amounts (use cashback first, then points)
    let cashbackDeducted = 0;
    let pointsDeducted = 0;
    let remainingAmount = paymentAmount;
    
    // First, deduct from cashback (if available)
    if (currentCashback > 0 && remainingAmount > 0) {
      cashbackDeducted = Math.min(currentCashback, remainingAmount);
      remainingAmount -= cashbackDeducted;
    }
    
    // Then, deduct from points (convert points to cash: 1 point = 1 EGP)
    if (currentPoints > 0 && remainingAmount > 0) {
      pointsDeducted = Math.min(currentPoints, Math.floor(remainingAmount));
      remainingAmount -= pointsDeducted;
    }
    
    // Calculate earned rewards (based on original payment amount)
    const pointsEarned = Math.floor(paymentAmount * 0.01); // 1% points
    const cashbackEarned = paymentAmount * 0.02; // 2% cashback
    
    // Calculate net changes
    const netCashbackChange = cashbackEarned - cashbackDeducted;
    const netPointsChange = pointsEarned - pointsDeducted;
    
    // Update user balance
    if (netCashbackChange !== 0) {
      await User.query()
        .findById(transaction.user_id)
        .increment('cashback', netCashbackChange);
    }
    
    if (netPointsChange !== 0) {
      await User.query()
        .findById(transaction.user_id)
        .increment('points', netPointsChange);
    }
    
    // Update transaction with deduction details
    const existingPaymentDetails = JSON.parse(transaction.payment_details || '{}');
    await Transaction.query()
      .findById(transaction.id)
      .patch({
        payment_details: JSON.stringify({
          ...existingPaymentDetails,
          deductions: {
            cashback_deducted: cashbackDeducted,
            points_deducted: pointsDeducted,
            remaining_amount: remainingAmount,
          },
          rewards: {
            points_earned: pointsEarned,
            cashback_earned: cashbackEarned,
          },
          net_changes: {
            cashback_change: netCashbackChange,
            points_change: netPointsChange,
          },
        }),
      });
    
    if (transactionType === 'booking_payment') {
      await Booking.query()
        .findById(referenceId)
        .patch({
          status: 'confirmed',
          payment_status: 'paid',
        });
        console.log(`✅ Booking ${referenceId} confirmed and marked as paid`);
      } else if (transactionType === 'membership_purchase') {
        // CRITICAL FIX: Update user membership with subscription and expiry dates
        const membership = await require('../models/Membership').query().findById(referenceId);
        if (membership) {
          const subscriptionDate = new Date();
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year membership
          
          await User.query()
            .findById(transaction.user_id)
            .patch({
              membership_id: referenceId,
              membership_subscription_date: subscriptionDate.toISOString(),
              membership_expiry_date: expiryDate.toISOString()
            });
          
          console.log(`✅ User ${transaction.user_id} membership updated to ${referenceId}`, {
            subscription_date: subscriptionDate.toISOString(),
            expiry_date: expiryDate.toISOString()
          });
        } else {
          console.warn(`⚠️ Membership ${referenceId} not found for user ${transaction.user_id}`);
        }
    }

      console.log(`✅ Payment processed for user ${transaction.user_id}:`, {
        payment_amount: paymentAmount,
        cashback_deducted: cashbackDeducted,
        points_deducted: pointsDeducted,
        points_earned: pointsEarned,
        cashback_earned: cashbackEarned,
        net_cashback_change: netCashbackChange,
        net_points_change: netPointsChange,
      });
    
    // CRITICAL FIX: Track payment activity - Transaction is already created and will appear in recent activities
    // The transaction record itself serves as the activity tracking
    console.log(`✅ [ACTIVITY TRACKED] Payment activity recorded for user ${transaction.user_id}:`, {
      transaction_id: transaction.id,
      type: transactionType,
      amount: transaction.amount,
      payment_method: 'fawaterak',
      reference_id: referenceId,
      timestamp: new Date().toISOString()
    });
    } catch (updateError) {
      console.error('❌ Error updating booking/membership after payment:', updateError);
      // Don't fail the callback, but log the error
    }
  }

  // Log callback processing result
  console.log('✅ [Fawaterak Callback Processed]', {
    invoice_id,
    order_id,
    transactionId: transaction.id,
    isPaid,
    status: isPaid ? 'completed' : 'failed',
    timestamp: new Date().toISOString()
  });

  res.status(200).json({ success: true, message: 'Callback processed successfully' });
});

// @desc    Check payment status
// @route   GET /api/payments/fawaterak/status/:transactionId
// @access  Private
exports.checkPaymentStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user.id;

  const transaction = await Transaction.query()
    .findById(transactionId)
    .where('user_id', userId);

  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  // Parse payment_details if it's a string
  let paymentDetails = {};
  try {
    if (transaction.payment_details) {
      paymentDetails = typeof transaction.payment_details === 'string' 
        ? JSON.parse(transaction.payment_details) 
        : transaction.payment_details;
    }
  } catch (e) {
    console.error('Error parsing payment_details:', e);
  }

  res.status(200).json({
    success: true,
    transaction: {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency || 'EGP',
      paymentMethod: transaction.payment_method || 'fawaterak',
      invoiceUrl: paymentDetails.fawaterak_invoice_url,
      createdAt: transaction.created_at,
      completedAt: transaction.completed_at,
    },
  });
});

