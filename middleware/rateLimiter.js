// Rate Limiting Middleware
// Prevents duplicate requests from the same user/IP within a short time window

const requestCache = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > 300000) { // 5 minutes
      requestCache.delete(key);
    }
  }
}, 300000);

/**
 * Rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1000 = 1 second)
 * @param {number} options.maxRequests - Maximum requests per window (default: 5)
 * @param {boolean} options.skipSuccessfulRequests - Skip rate limiting for successful requests (default: false)
 */
const rateLimiter = (options = {}) => {
  const {
    windowMs = 1000, // 1 second default
    maxRequests = 5, // 5 requests per second default
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    // Skip rate limiting for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    // Create a unique key based on user ID (if authenticated) or IP address
    const userId = req.user?.id;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const path = req.path;
    const key = userId ? `user_${userId}_${path}` : `ip_${ip}_${path}`;

    const now = Date.now();
    const cached = requestCache.get(key);

    // Check if request is within the time window
    if (cached && (now - cached.timestamp) < windowMs) {
      cached.count += 1;

      // If exceeded max requests, return 429 Too Many Requests
      if (cached.count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please wait a moment before trying again.',
          retryAfter: Math.ceil((windowMs - (now - cached.timestamp)) / 1000)
        });
      }
    } else {
      // Create new entry or reset count
      requestCache.set(key, {
        count: 1,
        timestamp: now
      });
    }

    // If skipSuccessfulRequests is true, remove entry on successful response
    if (skipSuccessfulRequests) {
      const originalEnd = res.end;
      res.end = function(chunk, encoding) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          requestCache.delete(key);
        }
        originalEnd.call(this, chunk, encoding);
      };
    }

    next();
  };
};

// Specific rate limiters for different endpoints
const membershipCardLimiter = rateLimiter({
  windowMs: 2000, // 2 seconds
  maxRequests: 2, // Max 2 requests per 2 seconds
  skipSuccessfulRequests: true
});

const generalLimiter = rateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 20, // Max 20 requests per second (increased for better UX)
  skipSuccessfulRequests: true // Skip rate limiting for successful requests
});

const strictLimiter = rateLimiter({
  windowMs: 5000, // 5 seconds
  maxRequests: 3, // Max 3 requests per 5 seconds
  skipSuccessfulRequests: false
});

module.exports = {
  rateLimiter,
  membershipCardLimiter,
  generalLimiter,
  strictLimiter
};
