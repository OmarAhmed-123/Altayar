const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
// CRITICAL: Supports token in both Authorization header AND query string
// This allows PDF downloads and direct URL access with token parameter
const protect = async (req, res, next) => {
  let token;
  let tokenSource = 'none';

  // Priority 1: Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    tokenSource = 'header';
  }
  // Priority 2: Check query string for token (for PDF downloads and direct URL access)
  else if (req.query && req.query.token) {
    token = req.query.token;
    tokenSource = 'query_token';
  }
  // Priority 3: Check query string for 'access_token' (alternative parameter name)
  else if (req.query && req.query.access_token) {
    token = req.query.access_token;
    tokenSource = 'query_access_token';
  }
  // Priority 4: Fallback - manually parse URL if query parsing failed
  // CRITICAL: This handles cases where Express hasn't parsed query string yet
  else if (req.url && (req.url.includes('token=') || req.url.includes('access_token='))) {
    try {
      // Try URL constructor first (works for absolute URLs)
      if (req.headers.host) {
        const fullUrl = `${req.protocol || 'http'}://${req.headers.host}${req.url}`;
        const url = new URL(fullUrl);
        token = url.searchParams.get('token') || url.searchParams.get('access_token');
        if (token) {
          tokenSource = 'url_parse';
        }
      }
    } catch (urlError) {
      // URL constructor failed, try regex parsing
    }
    
    // If still no token, try regex parsing (works for relative URLs)
    if (!token) {
      const tokenMatch = req.url.match(/[?&]token=([^&?#]+)/) || req.url.match(/[?&]access_token=([^&?#]+)/);
      if (tokenMatch && tokenMatch[1]) {
        token = decodeURIComponent(tokenMatch[1]);
        tokenSource = 'url_regex';
      }
    }
  }
  
  // Priority 5: Check originalUrl as well (Express sometimes uses this)
  if (!token && req.originalUrl && req.originalUrl !== req.url) {
    if (req.originalUrl.includes('token=') || req.originalUrl.includes('access_token=')) {
      const tokenMatch = req.originalUrl.match(/[?&]token=([^&?#]+)/) || req.originalUrl.match(/[?&]access_token=([^&?#]+)/);
      if (tokenMatch && tokenMatch[1]) {
        token = decodeURIComponent(tokenMatch[1]);
        tokenSource = 'originalUrl_regex';
      }
    }
  }

  if (token) {
    try {
      // Clean token (remove any whitespace or encoding issues)
      token = token.trim();

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');

      // CRITICAL FIX: Support both 'id' and 'userId' in token payload for backward compatibility
      // Normal login/register uses 'id', OAuth might have used 'userId' in the past
      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        console.log('⚠️ [AUTH] Invalid token format - no userId found:', {
          decoded,
          tokenSource,
          path: req.path,
          url: req.url
        });
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
        });
      }

      // Get user from the token
      req.user = await User.query().findById(userId);

      if (!req.user) {
        console.log('⚠️ [AUTH] User not found:', {
          userId,
          tokenSource,
          path: req.path
        });
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update last_seen timestamp (only for chat-related routes to reduce DB writes)
      if (req.path.includes('/chat') || req.path.includes('/users')) {
        try {
          await User.query().findById(userId).patch({ 
            last_seen: new Date().toISOString() 
          });
        } catch (updateError) {
          // Silently fail - don't block the request if last_seen update fails
          console.log('⚠️ [AUTH] Failed to update last_seen:', updateError.message);
        }
      }

      // Log successful authentication (only in development or for debugging)
      if (process.env.NODE_ENV === 'development' && tokenSource !== 'header') {
        console.log('✅ [AUTH] Token authenticated from query string:', {
          userId,
          tokenSource,
          path: req.path
        });
      }

      next();
    } catch (error) {
      console.log('❌ [AUTH ERROR]', {
        error: error.message,
        tokenSource,
        path: req.path,
        url: req.url,
        hasQuery: !!req.query,
        queryKeys: req.query ? Object.keys(req.query) : []
      });
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  } else {
    // Enhanced logging for debugging - ALWAYS log for PDF requests to help diagnose
    const isPdfRequest = req.path.includes('user-pdf') || req.url.includes('user-pdf');
    if (isPdfRequest || process.env.NODE_ENV === 'development') {
      console.log('⚠️ [AUTH] No token found:', {
        path: req.path,
        url: req.url,
        originalUrl: req.originalUrl,
        hasAuthHeader: !!req.headers.authorization,
        hasQuery: !!req.query,
        queryKeys: req.query ? Object.keys(req.query) : [],
        queryValues: req.query ? req.query : null,
        fullUrl: req.originalUrl || req.url,
        urlIncludesToken: req.url.includes('token=') || (req.originalUrl && req.originalUrl.includes('token='))
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      debug: process.env.NODE_ENV === 'development' ? {
        path: req.path,
        url: req.url,
        hasQuery: !!req.query,
        queryKeys: req.query ? Object.keys(req.query) : []
      } : undefined
    });
  }
};

// Authorization middleware - check if user has required role
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authorized, no user found' 
            });
        }

        if (req.user.is_super_admin) {
            return next();
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `User role ${req.user.role} is not authorized to access this resource` 
            });
        }

        next();
    };
};

module.exports = { protect, authorize };
