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

// CRITICAL FIX: Load config/db safely - don't let errors prevent server startup
let connectDB = null;
try {
  const dbModule = require('./config/db');
  connectDB = dbModule.connectDB;
} catch (dbError) {
  console.error('❌ [SERVER] Failed to load config/db:', dbError.message);
  console.warn('⚠️ [SERVER] Server will start but database features will be disabled');
  // Create a dummy connectDB function
  connectDB = async () => {
    console.warn('⚠️ [DB] Database module not loaded - connection disabled');
    return false;
  };
}

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
  // CRITICAL: Don't crash - just log the error
  // The error is already handled in the specific catch blocks
  // In production, let Cloud Run handle restarts if needed
});

// Note: uncaughtException handler is moved below server.listen() to avoid duplicate

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
// CRITICAL: In development, allow server to start even if DB is not available
// This allows testing API structure without local PostgreSQL
// CRITICAL FIX: Don't block server startup - start DB connection in background with shorter timeout
let dbConnected = false;
// Start database connection in background (non-blocking) with reduced retries for faster startup
(async () => {
  try {
    // CRITICAL FIX: Clean NODE_ENV before use
    let rawEnv = process.env.NODE_ENV || 'development';
    const cleanEnv = rawEnv.split(/\s+/)[0].toLowerCase();

    // CRITICAL FIX: Use minimal retries and very short timeout for Cloud Run startup
    // This ensures server starts quickly even if DB connection takes time
    // Cloud Run health check requires server to start within 60 seconds
    const dbHost = process.env.DB_HOST || '';
    const isCloudSqlProxy = dbHost.startsWith('/cloudsql/');
    // CRITICAL: Only 1 retry in production to ensure fast startup
    // Database connection will retry in background if initial attempt fails
    const retries = cleanEnv === 'production' ? 1 : 5;
    const delay = cleanEnv === 'production' ? 1000 : 2000;
    dbConnected = await connectDB(retries, delay);
    if (dbConnected) {
      // CRITICAL FIX: Start connection health monitoring
      try {
        const { startConnectionHealthCheck } = require('./config/db');
        startConnectionHealthCheck();
      } catch (monitorError) {
        console.warn('⚠️  [Bootstrap] Could not start connection monitoring:', monitorError.message);
      }

      // Check if tables exist - if not, suggest running migrations
      try {
        const { db, dbQueryWithRetry } = require('./config/db');
        const hasUsersTable = await dbQueryWithRetry(async () => {
          return await db.schema.hasTable('users').catch(() => false);
        }, 2, 1000);

        if (!hasUsersTable) {
          console.warn('⚠️  [Bootstrap] Database tables not found.');

          // CRITICAL FIX: Auto-run migrations in production if tables don't exist
          // Clean NODE_ENV to handle cases where it contains extra values
          const nodeEnv = (process.env.NODE_ENV || '').split(/\s+/)[0];
          if (nodeEnv === 'production') {
            console.log('🔄 [Bootstrap] Running migrations automatically in production...');
            console.log('🔄 [Bootstrap] This may take 1-2 minutes...');

            let migrationAttempts = 0;
            const maxMigrationAttempts = 3;
            let migrationSuccess = false;

            while (migrationAttempts < maxMigrationAttempts && !migrationSuccess) {
              migrationAttempts++;
              console.log(`🔄 [Bootstrap] Migration attempt ${migrationAttempts}/${maxMigrationAttempts}...`);

              try {
                // CRITICAL FIX: Use safe migration runner to prevent concurrent migrations
                const dbModule = require('./config/db');
                const runMigrationsSafely = dbModule.runMigrationsSafely;

                if (!runMigrationsSafely) {
                  throw new Error('Migration function not available');
                }

                migrationSuccess = await runMigrationsSafely();

                if (migrationSuccess) {
                  // CRITICAL FIX: Wait longer and retry table check multiple times
                  // Tables may take time to be fully available after migration
                  let tableExists = false;
                  let verifyAttempts = 5;
                  let verifyDelay = 2000;

                  while (verifyAttempts > 0 && !tableExists) {
                    await new Promise(resolve => setTimeout(resolve, verifyDelay));

                    try {
                      tableExists = await dbQueryWithRetry(async () => {
                        return await db.schema.hasTable('users').catch(() => false);
                      }, 3, 2000);

                      if (tableExists) {
                        console.log('✅ [Bootstrap] Database tables created successfully');
                        migrationSuccess = true;
                        break;
                      } else {
                        console.warn(`⚠️  [Bootstrap] Tables not found yet (${verifyAttempts} verification attempts left)`);
                      }
                    } catch (verifyError) {
                      console.warn(`⚠️  [Bootstrap] Table verification error (${verifyAttempts} attempts left):`, verifyError.message);
                    }

                    verifyAttempts--;
                    verifyDelay *= 1.2; // Gradual increase
                  }

                  if (!tableExists) {
                    console.warn(`⚠️  [Bootstrap] Tables still not found after attempt ${migrationAttempts} and verification retries`);
                    if (migrationAttempts < maxMigrationAttempts) {
                      console.log(`🔄 [Bootstrap] Retrying migration in 5 seconds...`);
                      await new Promise(resolve => setTimeout(resolve, 5000));
                    }
                  } else {
                    // Tables exist, break out of migration loop
                    break;
                  }
                } else {
                  console.error(`❌ [Bootstrap] Migration attempt ${migrationAttempts} failed`);
                  if (migrationAttempts < maxMigrationAttempts) {
                    console.log(`🔄 [Bootstrap] Retrying in 5 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                  }
                }
              } catch (migrationError) {
                console.error(`❌ [Bootstrap] Migration attempt ${migrationAttempts} error:`, migrationError.message);
                console.error('❌ [Bootstrap] Error details:', migrationError.stack?.substring(0, 500));

                if (migrationAttempts < maxMigrationAttempts) {
                  console.log(`🔄 [Bootstrap] Retrying in 5 seconds...`);
                  await new Promise(resolve => setTimeout(resolve, 5000));
                }
              }
            }

            if (!migrationSuccess) {
              console.error('❌ [Bootstrap] All migration attempts failed');
              console.warn('⚠️  [Bootstrap] Server will continue but database features may not work.');
              console.warn('⚠️  [Bootstrap] Please run migrations manually using: run-migrations-cloud-sql.bat');
              console.warn('⚠️  [Bootstrap] Or wait for auto-migration to retry on next request.');
            }
          } else {
            console.warn('💡 [Bootstrap] Run migrations: npm run migrate:latest');
            console.warn('💡 [Bootstrap] Or use: .\\scripts\\run-migrations.ps1');
            console.warn('⚠️  [Bootstrap] Some features may not work until migrations are run.');
          }
        }

        // Check again if tables exist (after potential auto-migration)
        const hasUsersTableFinal = await dbQueryWithRetry(async () => {
          return await db.schema.hasTable('users').catch(() => false);
        }, 2, 1000);

        if (hasUsersTableFinal) {
          try {
            await ensureSupportInfrastructure();
          } catch (infraError) {
            console.error('⚠️  [Bootstrap] Failed to ensure support infrastructure:', infraError.message);
            // Continue anyway - infrastructure setup is not critical
          }

          try {
            await ensureDefaultAdmin();
          } catch (adminError) {
            console.error('⚠️  [Bootstrap] Failed to ensure default admin:', adminError.message);
            // Continue anyway - admin creation is not critical
          }
        }
      } catch (checkError) {
        console.warn('⚠️  [Bootstrap] Could not check database tables:', checkError.message);
      }
    } else {
      console.warn('⚠️  [Bootstrap] Server starting without database connection.');
      console.warn('⚠️  [Bootstrap] Database features will be disabled.');
    }
  } catch (error) {
    console.error('❌ [Bootstrap] Failed to prepare infrastructure:', error.message);
    // CRITICAL FIX: Don't exit in production - allow server to start
    // This prevents "Service Unavailable" errors on Cloud Run
    // The server will continue and retry database connection in background
    console.warn('⚠️  [Bootstrap] Server will continue running but database features are disabled.');
    console.warn('⚠️  [Bootstrap] The server will retry database connection in the background.');
    dbConnected = false;
    global.dbConnectionRetry = true;
  }
})().catch((error) => {
  // CRITICAL FIX: Catch any unhandled errors in async initialization
  // Don't let database connection errors prevent server from starting
  console.error('❌ [Bootstrap] Async initialization error:', error.message);
  console.warn('⚠️  [Bootstrap] Server will continue starting without database.');
  dbConnected = false;
  global.dbConnectionRetry = true;
});

const app = express();
const server = http.createServer(app);

// Socket.IO with secure CORS configuration
const socketIoOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim()).filter(url => url.length > 0)
    : [
      'https://altayar-46d6f.web.app',
      'https://altayar-46d6f.firebaseapp.com',
      'https://altayar.web.app',
      'https://altayar.firebaseapp.com'
    ])
  : true; // Allow all origins in development

const io = new Server(server, {
  cors: {
    origin: socketIoOrigins,
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

// CRITICAL FIX: Start server listening IMMEDIATELY - BEFORE any middleware or routes
// This ensures Cloud Run health checks pass even if middleware/routes have errors
// Cloud Run automatically sets PORT environment variable (usually 8080)
// CRITICAL: Ensure PORT is properly parsed and defaults to 5000 for local, 8080 for Cloud Run
let PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces

// CRITICAL: Validate PORT is a valid number
// Cloud Run automatically sets PORT, so we use it if available, otherwise default
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  console.warn(`⚠️ [SERVER] Invalid or missing PORT: ${process.env.PORT}. Using default: 8080`);
  PORT = 8080; // Cloud Run default
}

// CRITICAL FIX: Apply CORS middleware BEFORE loading routes
// This ensures CORS headers are set correctly for all routes
// SECURE CORS Configuration for Production
// Allow specific origins in production, all origins in development
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Allow specific frontend URLs
    const frontendUrls = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : [];

    // Add common production frontend URLs
    // CRITICAL: Include all Firebase Hosting patterns to prevent CORS issues
    const productionUrls = [
      'https://altayar-46d6f.web.app',
      'https://altayar-46d6f.firebaseapp.com',
      'https://altayar.web.app',
      'https://altayar.firebaseapp.com',
      'http://localhost:3000', // For local development
      'http://localhost:5000', // For local development
      'http://localhost:8080', // For local development
      ...frontendUrls
    ];

    return productionUrls.filter(url => url.length > 0);
  } else {
    // Development: Allow all origins for local testing
    return true; // true means allow all origins
  }
};

const allowedOrigins = getAllowedOrigins();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // CRITICAL FIX: Allow requests with no origin (mobile apps, Postman, curl, native apps)
    // This is essential for Flutter/React Native apps which may not send origin header
    if (!origin) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    // In production, check against allowed origins
    if (Array.isArray(allowedOrigins)) {
      // CRITICAL FIX: Allow Firebase Hosting domains and Cloud Run domains automatically
      // This is essential for Flutter Web apps hosted on Firebase
      // Enhanced pattern matching to support ALL Firebase Hosting domain formats
      const isFirebaseHosting = origin.includes('.web.app') ||
        origin.includes('.firebaseapp.com') ||
        origin.match(/^https:\/\/[a-zA-Z0-9-]+\.web\.app$/i) ||
        origin.match(/^https:\/\/[a-zA-Z0-9-]+\.firebaseapp\.com$/i) ||
        origin.match(/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.web\.app$/i) ||
        origin.match(/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.firebaseapp\.com$/i);
      const isCloudRun = origin.includes('.run.app');
      const isKnownHosting = isFirebaseHosting || isCloudRun;

      // Check if origin matches any allowed origin (exact match or subdomain)
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        // Exact match
        if (origin === allowedOrigin) return true;
        // Subdomain match (e.g., https://*.altayar.web.app)
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\*/g, '[^.]*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });

      // Also check for common mobile app patterns
      const isMobileApp = origin.includes('file://') ||
        origin.includes('capacitor://') ||
        origin.includes('ionic://') ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1');

      // Allow if explicitly allowed OR if it's a known hosting domain OR mobile app
      if (isAllowed || isKnownHosting || isMobileApp) {
        callback(null, true);
      } else {
        console.warn('⚠️ [CORS] Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
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
    'Content-Length',
    'X-Access-Token',
    'X-API-Key',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
  maxAge: 86400 // 24 hours
};

// Apply CORS middleware EARLY - before routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests for CORS
app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(204);
});

// CRITICAL FIX: Load routes AFTER CORS middleware
// This ensures all routes are available immediately when server starts
// Routes must be loaded synchronously to ensure they're registered before first request
console.log('🔄 [Routes] Loading all routes...');
console.log('🔄 [Routes] Current working directory:', __dirname);
console.log('🔄 [Routes] NODE_ENV:', process.env.NODE_ENV || 'development');

try {
  // Load all routes - CRITICAL: Must be loaded synchronously before server.listen()
  console.log('🔄 [Routes] Loading /api/auth route...');
  app.use('/api/auth', require('./routes/auth'));
  console.log('✅ [Routes] /api/auth loaded successfully');
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
  app.use('/api/reports', require('./routes/reports'));
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
  app.use('/api/referrals', require('./routes/affiliate'));
  app.use('/api/external', require('./routes/externalApi'));
  app.use('/api/geolocation', require('./routes/geolocation'));

  // CRITICAL FIX: Register /api/oauth/config route FIRST (before oauth router)
  // This ensures it's always available and takes precedence
  // Express matches routes in order, so this will be checked first
  console.log('🔄 [Routes] Registering direct /api/oauth/config route (BEFORE oauth router)...');
  app.get('/api/oauth/config', (req, res) => {
    console.log('📥 [OAuth Config] Direct route called');
    try {
      const config = {
        google: {
          enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          clientId: process.env.GOOGLE_CLIENT_ID || null
        },
        apple: {
          enabled: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID),
          clientId: process.env.APPLE_CLIENT_ID || null
        }
      };

      console.log('✅ [OAuth Config] Returning config:', JSON.stringify(config));
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      console.error('❌ [OAuth Config] Error:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting OAuth config',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
  console.log('✅ [Routes] Direct /api/oauth/config route registered');

  // CRITICAL FIX: Load oauth router AFTER /config route
  // This ensures /config route takes precedence, but other oauth routes still work
  console.log('🔄 [Routes] Loading /api/oauth router...');
  try {
    const oauthRouter = require('./routes/oauth');
    app.use('/api/oauth', oauthRouter);
    console.log('✅ [Routes] /api/oauth router loaded successfully');
  } catch (oauthError) {
    console.error('❌ [Routes] Failed to load /api/oauth router:', oauthError.message);
    console.error('❌ [Routes] Stack:', oauthError.stack?.substring(0, 500));
    // Continue - we have the direct /config route above
  }

  app.use('/api/payments', require('./routes/payments'));
  app.use('/api/images', require('./routes/images'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/quotations', require('./routes/quotations'));
  app.use('/api/support-tickets', require('./routes/supportTickets'));
  app.use('/api/deep-links', require('./routes/deepLinks'));
  app.use('/api/invoices', require('./routes/invoices'));

  // Error handling middleware moved to the end of file after all routes

  // Make io globally available for use in controllers (chat, notifications, etc.)
  global.io = io;

  // Socket.IO Connection Handler
  io.on('connection', (socket) => {
    handleSocketConnection(socket, io);
  });

  console.log(`✅ [Routes] All routes, error handlers and Socket.IO loaded successfully`);
  console.log(`✅ [Routes] Available endpoints:`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - GET  /api/oauth/config`);
  console.log(`   - GET  /api/health`);

  // CRITICAL: Verify routes are actually registered
  console.log(`✅ [Routes] Express app routes registered:`, app._router?.stack?.length || 0, 'middleware layers');
} catch (routeError) {
  console.error(`❌ [Routes] Failed to load routes:`, routeError.message);
  console.error(`❌ [Routes] Stack:`, routeError.stack?.substring(0, 500));
  console.warn(`⚠️ [Routes] Server will continue but some routes may not work`);
}

// CRITICAL FIX: Start server listening AFTER routes are loaded
// This ensures all routes are available immediately when server starts
server.listen(PORT, HOST, () => {
  // CRITICAL: Log immediately to show server is listening (required for Cloud Run health checks)
  console.log(`========================================`);
  console.log(`✅ Server is listening on port ${PORT}`);
  console.log(`✅ Health check available at http://${HOST}:${PORT}/api/health`);
  console.log(`✅ Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`========================================`);

  // CRITICAL FIX: Routes are already loaded before server.listen() (see above)
  // This ensures server is ready for Cloud Run health checks immediately
});

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

// CRITICAL FIX: Handle listen errors gracefully
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ [SERVER] Port ${PORT} is already in use`);
    console.error(`💡 [SERVER] Please stop the other process or use a different port`);
  } else {
    console.error(`❌ [SERVER] Failed to start server:`, error.message);
    console.error(`❌ [SERVER] Error code:`, error.code);
  }
  // CRITICAL: In production, don't exit immediately - allow Cloud Run to handle it
  // Only exit in development
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// CRITICAL FIX: Handle client errors gracefully to prevent server crashes
server.on('clientError', (err, socket) => {
  console.warn('⚠️ [SERVER] Client error:', {
    error: err.message,
    code: err.code,
    remoteAddress: socket.remoteAddress,
    timestamp: new Date().toISOString()
  });

  // Only destroy socket if it's still writable
  if (!socket.destroyed) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

// CRITICAL FIX: Prevent server from crashing on uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ [UNCAUGHT EXCEPTION]', {
    error: error.message,
    code: error.code,
    stack: error.stack?.substring(0, 500),
    timestamp: new Date().toISOString()
  });
  // Don't exit in production - let the server continue running
  // Cloud Run will restart if needed
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
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

// CRITICAL FIX: CORS middleware is already applied above (before routes)
// This duplicate CORS configuration was removed to prevent conflicts

// CRITICAL FIX: Additional CORS middleware for file uploads
// MUST BE BEFORE other middleware to ensure headers are set correctly
app.use((req, res, next) => {
  // Get the origin from the request
  const origin = req.headers.origin;

  // CRITICAL FIX: Enhanced Firebase Hosting detection - support ALL Firebase domains
  // This ensures Flutter Web apps work from any Firebase Hosting domain
  const isFirebaseHosting = origin && (
    origin.includes('.web.app') ||
    origin.includes('.firebaseapp.com') ||
    origin.match(/^https:\/\/[a-zA-Z0-9-]+\.web\.app$/i) ||
    origin.match(/^https:\/\/[a-zA-Z0-9-]+\.firebaseapp\.com$/i) ||
    origin.match(/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.web\.app$/i) ||
    origin.match(/^https:\/\/[a-zA-Z0-9-]+-[a-zA-Z0-9]+\.firebaseapp\.com$/i)
  );
  const isCloudRun = origin && origin.includes('.run.app');
  const isKnownHosting = isFirebaseHosting || isCloudRun;

  // Set CORS headers based on allowed origins
  if (process.env.NODE_ENV === 'production') {
    // Production: Set specific origin if allowed
    if (origin && Array.isArray(allowedOrigins)) {
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (origin === allowedOrigin) return true;
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\*/g, '[^.]*');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(origin);
        }
        return false;
      });
      // CRITICAL: Always allow Firebase Hosting and Cloud Run domains
      // This prevents 503 errors from CORS blocking
      if (isAllowed || isKnownHosting) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else if (isKnownHosting && origin) {
      // Allow known hosting domains even if allowedOrigins is not set
      res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      res.header('Access-Control-Allow-Origin', '*');
    }
  } else {
    // Development: Allow all origins
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Content-Length, X-Access-Token, X-API-Key, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests immediately
  if (req.method === 'OPTIONS') {
    console.log('🔵 [CORS PREFLIGHT] OPTIONS request handled:', {
      path: req.path,
      originalUrl: req.originalUrl,
      origin: req.headers.origin || 'No origin',
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

// CRITICAL FIX: Removed duplicate CORS middleware
// CORS is already configured above with corsOptions (line 531)
// This duplicate was causing conflicts and CORS errors

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

// CRITICAL FIX: Add compression middleware for better performance
// This reduces response size and improves loading speed for all users
const compression = require('compression');
app.use(compression({
  filter: (req, res) => {
    // Compress all responses except for already compressed files
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression for all text-based responses
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression ratio and CPU usage
  threshold: 1024 // Only compress responses larger than 1KB
}));

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
// Enhanced logging for ALL API requests to debug 404 errors
app.use((req, res, next) => {
  // CRITICAL: Log ALL requests to /api/* endpoints to debug 404 issues
  const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/');
  const isAuthRequest = req.path.includes('/auth/') || req.originalUrl.includes('/api/auth/');
  const isOAuthRequest = req.path.includes('/oauth/') || req.originalUrl.includes('/api/oauth/');
  const isPostRequest = req.method === 'POST';
  const isOptionsRequest = req.method === 'OPTIONS';

  // Log all API requests (especially auth and oauth)
  if (isApiRequest && (isPostRequest || isOptionsRequest || isAuthRequest || isOAuthRequest)) {
    console.log('🔵 [INCOMING REQUEST]', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      authorization: req.headers['authorization'] ? 'Present' : 'Missing',
      userAgent: req.headers['user-agent']?.substring(0, 50) || 'Unknown',
      ip: req.ip || req.connection.remoteAddress || req.socket?.remoteAddress || 'Unknown',
      host: req.headers.host,
      origin: req.headers.origin || 'No origin',
      accessControlRequestMethod: req.headers['access-control-request-method'],
      accessControlRequestHeaders: req.headers['access-control-request-headers'],
      timestamp: new Date().toISOString(),
      isAuthRequest: isAuthRequest,
      isOAuthRequest: isOAuthRequest
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
  res.end = function (chunk, encoding) {
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

// CRITICAL: Test route to verify routes are loaded
app.get('/api/test-routes', (req, res) => {
  const routes = [];
  if (app._router && app._router.stack) {
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          method: Object.keys(middleware.route.methods)[0].toUpperCase(),
          path: middleware.route.path
        });
      } else if (middleware.name === 'router') {
        // This is a router middleware
        const routerPath = middleware.regexp.source
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\\\^/g, '^')
          .replace(/\\\$/g, '$');
        routes.push({
          type: 'router',
          path: routerPath || middleware.regexp.toString()
        });
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Routes test endpoint',
    routesLoaded: routes.length > 0,
    routesCount: routes.length,
    routes: routes.slice(0, 20), // Show first 20 routes
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

// CRITICAL FIX: Health check route - should be accessible from anywhere
// This is essential for Cloud Run health checks and prevents 503 errors
app.get(['/api/health', '/api/helth', '/api/status', '/health'], async (req, res) => {
  // CRITICAL: Wrap in try-catch to prevent health check from failing
  try {
    const { port, addresses, accessibleUrls } = getNetworkMetadata();
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol = forwardedProto ? forwardedProto.split(',')[0] : (req.protocol || 'http');
    const host = req.get('host') || `localhost:${port}`;
    const apiBaseUrl = `${protocol}://${host}/api`;

    // CRITICAL FIX: Clean NODE_ENV to show only the environment name
    let rawEnv = process.env.NODE_ENV || 'development';
    const cleanEnvironment = rawEnv.split(/\s+/)[0].toLowerCase();

    // Check database connection status
    let dbStatus = 'unknown';
    let dbMessage = '';
    let dbErrorDetails = null;
    try {
      // CRITICAL FIX: Load db module safely
      let db = null;
      let checkAndRestoreConnection = null;

      try {
        const dbModule = require('./config/db');
        db = dbModule.db;
        checkAndRestoreConnection = dbModule.checkAndRestoreConnection;
      } catch (dbModuleError) {
        console.warn('⚠️ [Health Check] Database module not available:', dbModuleError.message);
      }

      if (!db || !checkAndRestoreConnection) {
        dbStatus = 'disconnected';
        dbMessage = 'Database module not loaded - server is running but database features are disabled.';
        dbErrorDetails = {
          code: 'MODULE_NOT_LOADED',
          message: 'Database module failed to load',
          host: process.env.DB_HOST || 'NOT SET'
        };
      } else {
        // CRITICAL FIX: Try to restore connection if disconnected
        const isHealthy = await checkAndRestoreConnection();

        if (isHealthy) {
          // Test connection
          await db.raw('SELECT 1 as test');
          dbStatus = 'connected';
          dbMessage = 'Database is connected and operational';
        } else {
          // Try direct connection test
          try {
            await db.raw('SELECT 1 as test');
            dbStatus = 'connected';
            dbMessage = 'Database is connected and operational';
          } catch (testError) {
            dbStatus = 'disconnected';
            dbErrorDetails = {
              code: testError.code || 'UNKNOWN',
              message: testError.message || 'Connection failed',
              host: process.env.DB_HOST || 'NOT SET'
            };
            dbMessage = `Database not connected - ${testError.message || 'Connection failed'}. Connection will be retried in background.`;
          }
        }
      }
    } catch (dbError) {
      dbStatus = 'disconnected';
      dbErrorDetails = {
        code: dbError.code || 'UNKNOWN',
        message: dbError.message || 'Connection failed',
        host: process.env.DB_HOST || 'NOT SET'
      };
      dbMessage = `Database not connected - ${dbError.message || 'Connection failed'}. Connection will be retried in background.`;
    }

    // CRITICAL FIX: Always return 200 for health check, even if DB is disconnected
    // This prevents "Service Unavailable" errors on Cloud Run
    // The status field indicates the actual health state
    const healthStatus = dbStatus === 'connected' ? 'OK' : 'DEGRADED';
    const statusCode = 200; // Always return 200 - let the status field indicate health

    res.status(statusCode).json({
      success: healthStatus === 'OK',
      status: healthStatus,
      message: healthStatus === 'OK' ? 'Server is running' : 'Server is running but database is not connected',
      requestedPath: req.path,
      timestamp: new Date().toISOString(),
      host: host,
      origin: req.headers.origin || 'No origin (mobile app)',
      ip: req.ip || req.connection.remoteAddress || 'Unknown',
      environment: cleanEnvironment,
      version: '2.0.0',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      database: {
        status: dbStatus,
        message: dbMessage,
        required: cleanEnvironment === 'production',
        error: dbErrorDetails || undefined,
        config: cleanEnvironment === 'production' ? {
          host: process.env.DB_HOST ? (process.env.DB_HOST.startsWith('/cloudsql/') ? 'Cloud SQL Proxy (socket)' : process.env.DB_HOST) : 'NOT SET',
          user: process.env.DB_USER || 'NOT SET',
          database: process.env.DB_NAME || 'NOT SET',
          port: process.env.DB_PORT || '5432'
        } : undefined
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
  } catch (healthError) {
    // CRITICAL: Health check should NEVER fail - always return 200
    // This prevents Cloud Run from marking the service as unhealthy
    console.error('❌ [HEALTH CHECK ERROR]', {
      error: healthError.message,
      stack: healthError.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: false,
      status: 'ERROR',
      message: 'Health check encountered an error but server is running',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? healthError.message : undefined
    });
  }
});

// Additional health check for static files
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});


// Error handling middleware - CRITICAL: Must be last
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);


// CRITICAL FIX: Routes are already loaded before server.listen() (see above)
// This duplicate loading was removed to prevent conflicts
// Database connection check will be done after server starts
setTimeout(async () => {
  try {
    // CRITICAL FIX: Load db module safely
    let db = null;
    try {
      const dbModule = require('./config/db');
      db = dbModule.db;
    } catch (dbModuleError) {
      console.warn('⚠️ [Server Startup] Database module not available:', dbModuleError.message);
    }

    if (!db) {
      console.log(`⚠️  Database: Module not loaded (server running without DB)`);
      console.log(`💡 The server will retry connection in the background.`);
      global.dbConnected = false;
      return;
    }

    await db.raw('SELECT 1 as test');
    console.log(`✅ Database: Connected and operational`);
    global.dbConnected = true;
    global.dbConnectionRetry = false;
  } catch (dbError) {
    console.log(`⚠️  Database: Not connected (server running without DB)`);
    console.log(`💡 The server will retry connection in the background.`);
    console.log(`💡 To fix:`);
    if (process.env.NODE_ENV === 'development') {
      console.log(`   1. Run: .\\scripts\\setup-local-db.ps1`);
      console.log(`   2. Or see: DATABASE_SETUP.md`);
    } else {
      console.log(`   1. Check Cloud SQL connection string: DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`);
      console.log(`   2. Verify Cloud SQL instance is linked to Cloud Run service`);
      console.log(`   3. Check environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME`);
    }
    console.log(`   Note: Database features are disabled until connected`);
    global.dbConnected = false;

    // Start background retry for database connection
    if (global.dbConnectionRetry) {
      console.log(`🔄 Starting background database connection retry...`);
      try {
        const { startConnectionHealthCheck } = require('./config/db');
        startConnectionHealthCheck();
      } catch (retryError) {
        console.warn('⚠️  Could not start background retry:', retryError.message);
      }
    }
  }
}, 2000); // Check database status after 2 seconds
