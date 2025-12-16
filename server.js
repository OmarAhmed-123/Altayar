// File: server.js
const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const session = require('express-session');
const os = require('os');
const { connectDB } = require('./config/db');
const { handleSocketConnection } = require('./controllers/chatController');
const { ensureSupportInfrastructure } = require('./utils/ensureSupportInfrastructure');
const { ensureDefaultAdmin } = require('./utils/ensureDefaultAdmin');

// Load environment variables
dotenv.config();

// CRITICAL FIX: Add global error handlers to prevent server crash from unhandled rejections
// This prevents the server from crashing when Fawaterak API or other async operations fail
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [UNHANDLED REJECTION]', {
    reason: reason?.message || reason,
    code: reason?.code,
    status: reason?.response?.status,
    stack: reason?.stack?.substring(0, 500),
    timestamp: new Date().toISOString()
  });
  // Don't crash - just log the error
  // The error is already handled in the specific catch blocks
});

process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]', {
    error: error.message,
    code: error.code,
    stack: error.stack?.substring(0, 500),
    timestamp: new Date().toISOString()
  });
  // Don't crash - just log the error
  // The error is already handled in the specific catch blocks
});

const getNetworkAddresses = () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];

  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    });
  });

  return addresses;
};

const getNetworkMetadata = () => {
  const port = process.env.PORT || 5000;
  const addresses = getNetworkAddresses();
  const accessibleUrls = addresses.length
    ? addresses.map(addr => `http://${addr}:${port}/api`)
    : [`http://localhost:${port}/api`];

  return { port, addresses, accessibleUrls };
};

// Connect to database & ensure required tables/columns exist
(async () => {
    try {
        await connectDB();
        await ensureSupportInfrastructure();
        await ensureDefaultAdmin();
    } catch (error) {
        console.error('[Bootstrap] Failed to prepare infrastructure:', error.message);
    }
})();

const app = express();
const server = http.createServer(app);

// CRITICAL FIX: Set server timeout to prevent Network Error
// Network Error occurs when request takes too long
// Set timeout to 180 seconds (3 minutes) for large file uploads
server.timeout = 180000; // 180 seconds (3 minutes) for large file uploads
server.keepAliveTimeout = 175000; // 175 seconds
server.headersTimeout = 180000; // 180 seconds

// CRITICAL: Handle server timeout errors gracefully
server.on('timeout', (socket) => {
    console.error('⚠️ [SERVER TIMEOUT] Request timed out:', {
        remoteAddress: socket.remoteAddress,
        timestamp: new Date().toISOString()
    });
    socket.destroy();
});

// Socket.IO with authentication middleware
const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? process.env.FRONTEND_URL 
            : true,  // Allow all origins in development
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true
    }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return next(new Error('Authentication token required'));
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
        const userId = decoded.id || decoded.userId;

        if (!userId) {
            return next(new Error('Invalid token format'));
        }

        // Attach user info to socket
        socket.userId = userId;
        socket.userData = decoded;
        
        next();
    } catch (error) {
        console.error('[Socket.IO] Authentication error:', error.message);
        next(new Error('Authentication failed'));
    }
});

// Middleware
// CRITICAL: Parse query string BEFORE any other middleware to ensure token in query string works
// This must be done early to support token authentication from query parameters
// Express usually parses query string automatically, but we ensure it's done correctly
app.use((req, res, next) => {
    // Ensure query string is parsed (Express does this automatically, but we ensure it's done)
    if (req.url && req.url.includes('?')) {
        const url = require('url');
        try {
            // Parse the URL with query string
            const parsedUrl = url.parse(req.url, true);
            // Merge parsed query into req.query if not already set or if it's empty
            if (parsedUrl.query && Object.keys(parsedUrl.query).length > 0) {
                // If req.query doesn't exist or is empty, use parsed query
                if (!req.query || Object.keys(req.query).length === 0) {
                    req.query = parsedUrl.query;
                } else {
                    // Merge both (parsed query takes priority)
                    req.query = { ...req.query, ...parsedUrl.query };
                }
            }
        } catch (parseError) {
            // If URL parsing fails, try manual regex parsing
            console.log('⚠️ [QUERY PARSE] URL parsing failed, trying regex:', {
                error: parseError.message,
                url: req.url
            });
            const tokenMatch = req.url.match(/[?&]token=([^&?#]+)/);
            if (tokenMatch && tokenMatch[1]) {
                if (!req.query) req.query = {};
                req.query.token = decodeURIComponent(tokenMatch[1]);
            }
        }
    }
    next();
});

// CRITICAL: Increase body size limit for file uploads (100MB max file size)
// Note: express.json and express.urlencoded don't handle multipart/form-data
// That's handled by multer middleware
// CRITICAL FIX: Skip body parsing for multipart/form-data to let multer handle it
app.use((req, res, next) => {
    // Skip body parsing for multipart/form-data (file uploads)
    // Multer will handle the parsing
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Skip body parsing for file uploads - multer will handle it
        return next();
    }
    // For other content types, use JSON body parser
    express.json({ 
        limit: '100mb',
        verify: (req, res, buf) => {
            // Log large requests for debugging
            if (buf.length > 1024 * 1024) { // > 1MB
                console.log('📦 [LARGE REQUEST]', {
                    size: `${(buf.length / 1024 / 1024).toFixed(2)}MB`,
                    path: req.path,
                    method: req.method
                });
            }
        }
    })(req, res, next);
});

app.use((req, res, next) => {
    // Skip body parsing for multipart/form-data (file uploads)
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('multipart/form-data')) {
        // Skip body parsing for file uploads - multer will handle it
        return next();
    }
    // For other content types, use urlencoded parser
    express.urlencoded({ 
        extended: true, 
        limit: '100mb',
        parameterLimit: 50000 // Increase parameter limit for large forms
    })(req, res, next);
});

// Handle preflight OPTIONS requests for CORS
// CRITICAL FIX: Enhanced CORS for file uploads
app.options('*', (req, res) => {
  console.log('🔵 [CORS PREFLIGHT] OPTIONS request:', {
    path: req.path,
    originalUrl: req.originalUrl,
    origin: req.headers.origin,
    accessControlRequestMethod: req.headers['access-control-request-method'],
    accessControlRequestHeaders: req.headers['access-control-request-headers'],
    timestamp: new Date().toISOString()
  });
  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Content-Length, X-Access-Token');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// CRITICAL FIX: Additional CORS middleware for file uploads
// MUST BE BEFORE CORS middleware to ensure headers are set correctly
app.use((req, res, next) => {
  // Set CORS headers for all requests FIRST
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Content-Length, X-Access-Token');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🔵 [CORS PREFLIGHT] OPTIONS request handled:', {
      path: req.path,
      originalUrl: req.originalUrl,
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
    return res.status(200).end();
  }
  
  // For file uploads, allow longer timeout
  // CRITICAL FIX: Only detect actual file uploads (POST /api/blogs with multipart/form-data)
  // NOT like/save/share endpoints
  const contentType = req.headers['content-type'] || '';
  const isFileUpload = req.method === 'POST' && 
      // Only POST /api/blogs (not /api/blogs/like, /api/blogs/save, /api/blogs/share)
      (req.path === '/blogs' || req.originalUrl === '/api/blogs' || 
       (req.originalUrl.includes('/api/blogs') && !req.originalUrl.includes('/api/blogs/') && !req.originalUrl.match(/\/api\/blogs\/(like|save|share|saved)/))) &&
      // Must have multipart/form-data content type
      (contentType.includes('multipart/form-data') || contentType.includes('form-data'));
  
  if (isFileUpload) {
    // Increase timeout for file uploads
    req.setTimeout(180000); // 180 seconds (3 minutes) for large file uploads
    res.setTimeout(180000); // 180 seconds
    
    // Set connection keep-alive
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Keep-Alive', 'timeout=180');
    
    console.log('📤 [CORS] File upload detected, timeout set to 180s:', {
      path: req.path,
      originalUrl: req.originalUrl,
      contentType: contentType,
      contentLength: req.headers['content-length'],
      ip: req.ip || req.connection.remoteAddress,
      method: req.method
    });
  }
  
  next();
});

// CORS Configuration - Enhanced for React Native and network access
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) {
            return callback(null, true);
        }
        
        // In production, check against allowed origins
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigins = process.env.FRONTEND_URL 
                ? process.env.FRONTEND_URL.split(',')
                : [];
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        } else {
            // In development, allow all origins (React Native needs this)
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept', 
        'X-Requested-With',
        'X-Access-Token',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
    ],
    exposedHeaders: [
        'Content-Range', 
        'X-Content-Range',
        'Content-Length',
        'Content-Type',
        'ETag',
        'Last-Modified'
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400 // 24 hours
}));

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Serve static files (for uploads) - CRITICAL: Must be accessible to all users
// Set proper headers to allow access from any origin (for React Native)
app.use('/uploads', express.static(path.join(__dirname, '/uploads'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // CRITICAL FIX: Allow CORS for all static files - CRITICAL for React Native video playback
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Ranges, Authorization, If-Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, Content-Type');
    // CRITICAL: Enable range requests for video streaming (required for video playback)
    res.setHeader('Accept-Ranges', 'bytes');
    // CRITICAL: Allow credentials for video requests
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // CRITICAL FIX: Set proper content types for videos with correct MIME types
    // This is essential for video playback in React Native
    if (filePath.endsWith('.mp4') || filePath.endsWith('.m4v')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (filePath.endsWith('.mov') || filePath.endsWith('.qt')) {
      res.setHeader('Content-Type', 'video/quicktime');
    } else if (filePath.endsWith('.avi')) {
      res.setHeader('Content-Type', 'video/x-msvideo');
    } else if (filePath.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    } else if (filePath.endsWith('.3gp')) {
      res.setHeader('Content-Type', 'video/3gpp');
    } else if (filePath.endsWith('.mkv')) {
      res.setHeader('Content-Type', 'video/x-matroska');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/gif');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
    
    // Cache control for better performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year cache, immutable
    
    // Security headers (but allow access)
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// CRITICAL: Handle OPTIONS requests for static files (CORS preflight)
app.options('/uploads/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Ranges, Authorization, If-Range');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

// Serve membership PDF files from memberships directory
// CRITICAL: Allow access to membership PDFs for reading/downloading
app.use('/memberships', express.static(path.join(__dirname, '/memberships'), {
  maxAge: '1y', // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Allow CORS for PDF files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Ranges, Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Set PDF content type
    if (filePath.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    }
    
    // Cache control
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// Handle OPTIONS requests for membership PDFs (CORS preflight)
app.options('/memberships/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Range, Accept-Ranges, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, ETag, Last-Modified, Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(204);
});

// CRITICAL FIX: Handle Range requests for video streaming
// This is essential for video playback in React Native
// Note: express.static already handles Range requests, but we need to ensure headers are correct
app.use('/uploads', (req, res, next) => {
  // Check if this is a video file request
  const isVideo = req.path.match(/\.(mp4|mov|avi|webm|m4v|3gp|mkv)$/i);
  
  if (isVideo) {
    // CRITICAL: Set headers for video files BEFORE express.static processes the request
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    res.setHeader('Access-Control-Allow-Headers', 'Range, If-Range, Content-Type');
    
    // CRITICAL: Log video request for debugging
    if (process.env.NODE_ENV !== 'production' && req.method === 'GET') {
      console.log('🎥 [VIDEO REQUEST]', {
        path: req.path,
        range: req.headers.range,
        userAgent: req.headers['user-agent']?.substring(0, 50),
        ip: req.ip || req.connection.remoteAddress,
      });
    }
  }
  
  next();
});

// Ensure uploads directories exist
const fs = require('fs');
const uploadsDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads/profiles'),
  path.join(__dirname, 'uploads/images'),
  path.join(__dirname, 'uploads/documents'),
  path.join(__dirname, 'uploads/vouchers'),
  path.join(__dirname, 'uploads/memberships'),
  path.join(__dirname, 'uploads/reels'),
];
uploadsDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created upload directory: ${dir}`);
  }
});

// Security Headers Middleware
app.use((req, res, next) => {
  // Security headers (but allow CORS for static files)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Only set X-Frame-Options for non-static files
  if (!req.path.startsWith('/uploads/')) {
    res.setHeader('X-Frame-Options', 'DENY');
  }
  
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
});

// Rate Limiting Middleware - Prevent duplicate requests
// Applied to all API routes to prevent request flooding
// CRITICAL: Exclude file upload routes from strict rate limiting
const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api', (req, res, next) => {
    // CRITICAL FIX: Skip rate limiting for file uploads
    // Check for POST /api/blogs with multipart/form-data
    // Note: req.path is relative to the mount point, so '/blogs' is correct
    const contentType = req.headers['content-type'] || '';
    const isFileUpload = req.method === 'POST' && 
        (req.path === '/blogs' || req.path.startsWith('/blogs')) &&
        (contentType.includes('multipart/form-data') || 
         contentType.includes('application/x-www-form-urlencoded') ||
         contentType.includes('form-data')); // More flexible check
    
    if (isFileUpload) {
        console.log('📤 [RATE LIMITER] Skipping rate limit for file upload:', {
            method: req.method,
            path: req.path,
            originalUrl: req.originalUrl,
            contentType: contentType,
            contentLength: req.headers['content-length'],
            timestamp: new Date().toISOString()
        });
        return next(); // Skip rate limiter for file uploads
    }
    
    // Log if rate limiter is being applied
    if (req.method === 'POST' && req.path === '/blogs') {
        console.log('⚠️ [RATE LIMITER] Applying rate limit (not a file upload):', {
            method: req.method,
            path: req.path,
            contentType: contentType,
            timestamp: new Date().toISOString()
        });
    }
    
    generalLimiter(req, res, next);
});

// CRITICAL FIX: Early request logging - BEFORE any middleware
// This will help us see if POST requests are reaching the server
app.use((req, res, next) => {
  // Log ALL incoming requests, especially POST requests to /api/blogs
  if (req.method === 'POST' || req.method === 'OPTIONS' || req.path.includes('blogs') || req.originalUrl.includes('/api/blogs')) {
    console.log('🔵 [INCOMING REQUEST]', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      authorization: req.headers['authorization'] ? 'Present' : 'Missing',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || req.socket?.remoteAddress || 'Unknown',
      host: req.headers.host,
      origin: req.headers.origin || 'No origin',
      accessControlRequestMethod: req.headers['access-control-request-method'],
      accessControlRequestHeaders: req.headers['access-control-request-headers'],
      timestamp: new Date().toISOString()
    });
  }
  
  // CRITICAL: Handle connection errors gracefully
  req.on('error', (err) => {
    console.error('❌ [REQUEST ERROR]', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
  
  req.on('close', () => {
    // Only log if request was closed before response was sent (actual error)
    // If response was sent, it's normal for client to close connection
    if (req.method === 'POST' && req.originalUrl.includes('/api/blogs')) {
      if (!res.headersSent) {
        console.warn('⚠️ [REQUEST CLOSED] Client closed connection before response:', {
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });
      } else {
        // Response was sent - this is normal, client received response and closed connection
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ [REQUEST COMPLETE] Request completed, client closed connection (normal):', {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
  
  res.on('error', (err) => {
    console.error('❌ [RESPONSE ERROR]', {
      error: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
  
  res.on('close', () => {
    // Only log if response was closed before headers were sent (actual error)
    // If headers were sent, it's normal for client to close connection after receiving response
    if (req.method === 'POST' && req.originalUrl.includes('/api/blogs')) {
      if (!res.headersSent) {
        console.warn('⚠️ [RESPONSE CLOSED] Response closed before headers sent:', {
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });
      } else {
        // Headers were sent - this is normal, client received response and closed connection
        // CRITICAL FIX: __DEV__ is React Native only, use NODE_ENV instead
        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ [RESPONSE SENT] Response sent successfully, client closed connection (normal):', {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
  
  next();
});

// Enhanced Request logging middleware with user details
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const path = req.path.toLowerCase();
  
  // List of suspicious user agents and paths to ignore
  const suspiciousAgents = ['avast', 'scanner', 'bot', 'crawler', 'spider', 'security'];
  const suspiciousPaths = ['/loginmsg.js', '/cgi/', '/rootdesc.xml', '/.well-known/', '/wp-admin', '/phpmyadmin', '/admin.php'];
  
  const isSuspiciousAgent = suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent));
  const isSuspiciousPath = suspiciousPaths.some(suspPath => path.includes(suspPath));
  
  // Store original end function
  const originalEnd = res.end;
  const startTime = Date.now();
  
  // Override end function to log response details
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Only log legitimate requests
    if (!isSuspiciousAgent && !isSuspiciousPath) {
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        status: statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress || 'Unknown',
        origin: req.headers.origin || 'No origin',
        userAgent: userAgent.substring(0, 50) || 'Unknown',
      };
      
      // Add user info if available (from JWT middleware)
      if (req.user) {
        logData.user = {
          id: req.user.id,
          email: req.user.email || 'N/A',
          role: req.user.role || 'N/A'
        };
      }
      
      // Add request body for POST/PUT/PATCH (limited size)
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const bodyStr = JSON.stringify(req.body);
        if (bodyStr.length < 500) {
          logData.body = req.body;
        } else {
          logData.body = 'Body too large to log';
        }
      }
      
      // Log with appropriate level based on status
      if (statusCode >= 500) {
        console.error('❌ [ERROR]', logData);
      } else if (statusCode >= 400) {
        console.warn('⚠️  [WARN]', logData);
      } else {
        console.log('✅ [SUCCESS]', logData);
      }
    }
    
    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Rate Limiting Middleware - DISABLED for smooth app operation
// Uncomment and configure if needed for production
// const { apiRateLimiter, authRateLimiter, strictRateLimiter, userRateLimiter, imageRateLimiter } = require('./middleware/rateLimiter');

// Rate limiting is disabled to allow smooth app operation
// If you need to enable it in production, uncomment the lines below:
// app.use('/api/images', imageRateLimiter);
// app.use('/api/auth/login', authRateLimiter);
// app.use('/api/auth/register', authRateLimiter);
// app.use('/api/auth/forgot-password', strictRateLimiter);
// app.use('/api/auth/reset-password', strictRateLimiter);
// app.use('/api/auth/verify-email', strictRateLimiter);
// app.use('/api', userRateLimiter);
// app.use('/api', apiRateLimiter);

// Root route - API information
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Altayar Tourism Backend API',
    version: '2.0.0',
    documentation: {
      health: '/api/health',
      api: '/api',
      status: 'running'
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  const { port, addresses, accessibleUrls } = getNetworkMetadata();
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0] : (req.protocol || 'http');
  const host = req.get('host') || `localhost:${port}`;
  const apiBaseUrl = `${protocol}://${host}/api`;

  res.status(200).json({
    success: true,
    message: 'Altayar Tourism Backend API root',
    status: 'online',
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    baseUrl: apiBaseUrl,
    network: {
      bindHost: process.env.HOST || '0.0.0.0',
      port,
      addresses,
      accessibleUrls
    },
    diagnostics: {
      requestIp: req.ip || req.connection.remoteAddress || 'Unknown',
      userAgent: req.headers['user-agent']?.substring(0, 80) || 'Unknown',
      origin: req.headers.origin || 'No origin',
    },
    endpoints: {
      health: `${apiBaseUrl}/health`,
      authLogin: `${apiBaseUrl}/auth/login`,
      authRegister: `${apiBaseUrl}/auth/register`,
      oauthConfig: `${apiBaseUrl}/oauth/config`,
      blogs: `${apiBaseUrl}/blogs`
    },
    clientHints: {
      flutterDefine: `flutter run --dart-define=API_BASE_URL=${apiBaseUrl}`,
      reactNativeBaseUrl: apiBaseUrl,
      healthCheck: `${apiBaseUrl}/health`
    }
  });
});

// Health check route - should be accessible from anywhere
app.get(['/api/health', '/api/helth', '/api/status'], (req, res) => {
  const { port, addresses, accessibleUrls } = getNetworkMetadata();
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = forwardedProto ? forwardedProto.split(',')[0] : (req.protocol || 'http');
  const host = req.get('host') || `localhost:${port}`;
  const apiBaseUrl = `${protocol}://${host}/api`;

  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    requestedPath: req.path,
    timestamp: new Date().toISOString(),
    host: host,
    origin: req.headers.origin || 'No origin (mobile app)',
    ip: req.ip || req.connection.remoteAddress || 'Unknown',
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    server: {
      port,
      host: process.env.HOST || '0.0.0.0',
      networkAddresses: addresses,
      accessibleUrls
    },
    recommendedBaseUrl: apiBaseUrl,
    endpoints: {
      base: '/api',
      health: '/api/health',
      healthAlias: '/api/helth',
      blogs: '/api/blogs',
      authLogin: '/api/auth/login',
      uploads: '/uploads'
    },
    clientHints: {
      flutterDefine: `flutter run --dart-define=API_BASE_URL=${apiBaseUrl}`,
      postman: `${apiBaseUrl}/health`,
      curl: `curl ${apiBaseUrl}/health`
    }
  });
});

// Additional health check for static files
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/memberships', require('./routes/memberships'));
app.use('/api/packages', require('./routes/packages'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/vouchers', require('./routes/vouchers'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/ads', require('./routes/ads'));
app.use('/api/additionals', require('./routes/additionals'));
// CRITICAL FIX: Use only one reports route file to avoid conflicts
// reports.js contains all routes including user-pdf, so we use that
// reportRoutes.js is kept for backward compatibility but not loaded to avoid duplicate routes
app.use('/api/reports', require('./routes/reports')); // All reports routes (user-pdf, user-data, download-url, sales, payment-history, invoice)
// app.use('/api/reports', require('./routes/reportRoutes')); // DISABLED - duplicate routes cause conflicts
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/affiliates', require('./routes/affiliates'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/travel-companion', require('./routes/travelCompanion'));
const fileManagementRoutes = require('./routes/fileManagement');
app.use('/api/files', fileManagementRoutes);
app.use('/files', fileManagementRoutes);
app.use('/api/marketing', require('./routes/marketingAutomation'));
app.use('/api/partners', require('./routes/partnerPortal'));
app.use('/api/localization', require('./routes/localization'));
app.use('/api/affiliate', require('./routes/affiliate'));
// Add referrals route as alias for backward compatibility
app.use('/api/referrals', require('./routes/affiliate'));
app.use('/api/external', require('./routes/externalApi'));
app.use('/api/geolocation', require('./routes/geolocation'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/images', require('./routes/images'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/support-tickets', require('./routes/supportTickets'));

// Error handling middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

// Make io globally available for use in controllers (chat, notifications, etc.)
global.io = io;

// Socket.IO Connection Handler
io.on('connection', (socket) => {
    handleSocketConnection(socket, io);
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

server.listen(PORT, HOST, () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];
    
    // Get all IP addresses
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      });
    });
    
    console.log(`========================================`);
    console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 Listening on http://${HOST}:${PORT}`);
    console.log(`🌐 API available at http://${HOST}:${PORT}/api`);
    console.log(`❤️  Health check: http://${HOST}:${PORT}/api/health`);
    console.log(`========================================`);
    console.log(`🔓 CORS enabled for: ${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'All origins (development)'}`);
    console.log(`========================================`);
    if (addresses.length > 0) {
      console.log(`📱 Accessible from these IPs:`);
      addresses.forEach(addr => {
        console.log(`   - http://${addr}:${PORT}/api`);
      });
    }
    console.log(`========================================`);
    console.log(`⚠️  Make sure your React Native app uses one of these IPs`);
    console.log(`========================================`);
});


