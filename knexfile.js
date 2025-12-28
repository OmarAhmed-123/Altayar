require('dotenv').config({ path: './.env' });

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'StrongPass123',
      database: process.env.DB_NAME || 'tourist_app_db',
      // CRITICAL FIX: Add connection timeout and retry settings
      connectionTimeoutMillis: 10000, // Increased to 10 seconds
      requestTimeout: 30000,
      // Enable keep-alive to maintain connection
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      // CRITICAL FIX: Add retry settings for connection
      retry: {
        min: 1000,
        max: 5000,
        factor: 2,
        match: [
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ENOTFOUND/,
        ],
      },
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 1000, // Increased retry interval
      // CRITICAL FIX: Add pool error handling and automatic reconnection
      afterCreate: (conn, done) => {
        // CRITICAL FIX: Set up connection event handlers
        conn.on('error', (err) => {
          console.error('❌ [DB Pool] Connection error:', err.message);
          // Mark connection as unhealthy and try to restore
          if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
            // Use setTimeout to avoid circular require
            setTimeout(() => {
              try {
                const { checkAndRestoreConnection } = require('./config/db');
                checkAndRestoreConnection().catch(() => {});
              } catch (e) {
                // Ignore errors during restoration attempt
              }
            }, 100);
          }
        });
        
        conn.on('end', () => {
          console.warn('⚠️ [DB Pool] Connection ended - will be recreated on next use');
          // Connection ended is normal when pool cleans up idle connections
          // Don't mark as unhealthy, pool will create new connection when needed
        });
        
        // CRITICAL FIX: Handle connection close
        conn.on('close', () => {
          console.warn('⚠️ [DB Pool] Connection closed');
        });
        
        // CRITICAL FIX: Set keep-alive to prevent connection timeout
        if (conn.stream && typeof conn.stream.setKeepAlive === 'function') {
          conn.stream.setKeepAlive(true, 60000); // Keep-alive every 60 seconds
        }
        
        done(null, conn);
      },
      // CRITICAL FIX: Validate connections before use and refresh if needed
      validate: async (connection) => {
        if (!connection || connection._ending) {
          return false;
        }
        
        // CRITICAL FIX: Test connection before using it
        try {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Validation timeout')), 2000);
            connection.query('SELECT 1', (err) => {
              clearTimeout(timeout);
              if (err) reject(err);
              else resolve();
            });
          });
          return true;
        } catch (error) {
          console.warn('⚠️ [DB Pool] Connection validation failed:', error.message);
          return false;
        }
      },
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL || (() => {
      // CRITICAL FIX: Support Cloud SQL Proxy connection
      // Cloud SQL Proxy uses Unix socket path: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
      const dbHost = process.env.DB_HOST;
      const dbPassword = process.env.DB_PASSWORD;
      const dbUser = process.env.DB_USER || 'postgres';
      const dbName = process.env.DB_NAME || 'tourist_app_db';
      
      // CRITICAL FIX: Log connection details for debugging
      console.log(`[DB Config] DB_HOST: ${dbHost || 'NOT SET'}`);
      console.log(`[DB Config] DB_USER: ${dbUser}`);
      console.log(`[DB Config] DB_NAME: ${dbName}`);
      console.log(`[DB Config] DB_PASSWORD: ${dbPassword ? 'SET' : 'NOT SET'}`);
      
      // CRITICAL FIX: Validate required environment variables
      if (!dbPassword) {
        console.error('❌ [DB] DB_PASSWORD is required but not set');
        console.error('❌ [DB] Please set DB_PASSWORD environment variable');
        // Don't throw - return a config that will fail gracefully
      }
      
      const isCloudSqlProxy = dbHost && dbHost.startsWith('/cloudsql/');
      
      // If using Cloud SQL Proxy, use socket connection
      if (isCloudSqlProxy) {
        console.log('🔌 [DB] Using Cloud SQL Proxy socket connection:', dbHost);
        console.log('🔌 [DB] Socket path format: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME');
        // CRITICAL FIX: For Cloud SQL Proxy on Cloud Run, we need to use the socket path correctly
        // The socket is available at /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
        // pg library automatically detects Unix socket when host starts with /
        const socketConfig = {
          host: dbHost, // This is the socket path for Cloud SQL Proxy: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
          user: dbUser,
          password: dbPassword || '', // Allow empty password for testing (will fail gracefully)
          database: dbName,
          // CRITICAL: Don't specify port for Unix socket connections
          // CRITICAL: Don't specify ssl for Unix socket connections
          // CRITICAL FIX: Increase timeout for Cloud SQL Proxy as socket may take time to establish
          connectionTimeoutMillis: 10000, // Increased from 2000 to 10000 for Cloud SQL Proxy
          requestTimeout: 30000, // Increased from 10000 to 30000
          // CRITICAL: Enable keep-alive for socket connections
          keepAlive: true,
          keepAliveInitialDelayMillis: 10000, // Increased from 5000 to 10000
        };
        
        // CRITICAL FIX: Validate config before returning
        // CRITICAL: Don't throw - return a config that will fail gracefully
        if (!socketConfig.host || !socketConfig.user || !socketConfig.database) {
          console.error('❌ [DB] Invalid socket configuration');
          console.error('❌ [DB] Missing fields:', {
            host: !!socketConfig.host,
            user: !!socketConfig.user,
            database: !!socketConfig.database
          });
          console.warn('⚠️ [DB] Returning config that will fail gracefully - server will start');
          // Return config anyway - connection will fail gracefully during connectDB()
        } else {
          console.log('✅ [DB] Socket configuration validated');
        }
        return socketConfig;
      }
      
      // CRITICAL FIX: Detect if this is a Cloud SQL Public IP (starts with numbers and contains dots)
      const isPublicIP = dbHost && /^\d+\.\d+\.\d+\.\d+$/.test(dbHost);
      const isLocalhost = !dbHost || dbHost.includes('localhost') || dbHost.includes('127.0.0.1');
      
      // Use standard TCP connection (Public IP or localhost)
      const connectionConfig = {
        host: dbHost || '127.0.0.1',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: dbUser,
        password: dbPassword || '', // Allow empty password for testing (will fail gracefully)
        database: dbName,
        connectionTimeoutMillis: 10000,
        requestTimeout: 30000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
        // CRITICAL FIX: Enable SSL for Cloud SQL Public IP connections
        ssl: isPublicIP ? { rejectUnauthorized: false } : false
      };
      
      // CRITICAL FIX: Validate config before returning
      // CRITICAL: Don't throw - return a config that will fail gracefully
      if (!connectionConfig.host || !connectionConfig.user || !connectionConfig.database) {
        console.error('❌ [DB] Invalid connection configuration');
        console.warn('⚠️ [DB] Returning config that will fail gracefully - server will start');
        // Return config anyway - connection will fail gracefully during connectDB()
      }
      
      if (isPublicIP) {
        console.log('🌐 [DB] Using Cloud SQL Public IP connection with SSL:', dbHost);
      } else if (isLocalhost) {
        console.log('🏠 [DB] Using localhost connection:', dbHost || '127.0.0.1');
      } else {
        console.log('🔌 [DB] Using custom host connection:', dbHost);
      }
      
      return connectionConfig;
    })(),
    pool: {
      min: 5,
      max: 20, // Increased for concurrent registrations
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: { directory: './db/migrations' },
    seeds: { directory: './db/seeds' }
  }
};