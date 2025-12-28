// File: config/db.js
const knex = require('knex');
const knexfile = require('../knexfile');
const { Model } = require('objection');

// CRITICAL FIX: Ensure environment is valid and connectionConfig exists
// Clean NODE_ENV to handle cases where it contains extra values (e.g., "production PORT=8080")
let rawEnv = process.env.NODE_ENV || 'development';
// Extract just the environment name (first word before space)
const environment = rawEnv.split(/\s+/)[0].toLowerCase() === 'production' ? 'production' : 'development';

// CRITICAL FIX: Log environment for debugging
console.log(`[DB Config] Raw NODE_ENV: ${rawEnv}`);
console.log(`[DB Config] Cleaned Environment: ${environment}`);

const connectionConfig = knexfile[environment];

// CRITICAL FIX: Validate connectionConfig before using it
// CRITICAL: Don't throw errors at module load time - allow server to start
// Errors will be caught during connectDB() call
let db = null;
try {
    if (!connectionConfig) {
        console.error(`❌ [DB] Invalid environment: ${environment}`);
        console.error(`❌ [DB] Available environments: ${Object.keys(knexfile).join(', ')}`);
        console.error(`❌ [DB] NODE_ENV=${process.env.NODE_ENV}`);
        // Fallback to development if production config is missing
        const fallbackEnv = environment === 'production' ? 'development' : 'development';
        console.warn(`⚠️ [DB] Falling back to: ${fallbackEnv}`);
        const fallbackConfig = knexfile[fallbackEnv];
        if (!fallbackConfig) {
            console.error(`❌ [DB] Database configuration not found for environment: ${environment} or fallback: ${fallbackEnv}`);
            console.warn(`⚠️ [DB] Server will start but database features will be disabled`);
            // Create a dummy db object that will fail gracefully
            db = null;
        } else {
            // CRITICAL FIX: Validate connectionConfig has required properties
            if (!fallbackConfig.client) {
                console.error(`❌ [DB] Invalid fallback config: missing 'client' property`);
                db = null;
            } else {
                db = knex(fallbackConfig);
            }
        }
    } else {
        // CRITICAL FIX: Validate connectionConfig has required properties
        if (!connectionConfig.client) {
            console.error(`❌ [DB] Invalid connectionConfig: missing 'client' property`);
            console.error(`❌ [DB] Environment: ${environment}`);
            console.error(`❌ [DB] Config keys: ${Object.keys(connectionConfig).join(', ')}`);
            console.warn(`⚠️ [DB] Server will start but database features will be disabled`);
            db = null;
        } else {
            db = knex(connectionConfig);
        }
    }
} catch (initError) {
    console.error(`❌ [DB] Failed to initialize database connection:`, initError.message);
    console.warn(`⚠️ [DB] Server will start but database features will be disabled`);
    db = null;
}

// CRITICAL FIX: Add connection health check and automatic reconnection
let isConnectionHealthy = false;
let connectionCheckInterval = null;

// CRITICAL FIX: Global migration lock to prevent multiple migrations running simultaneously
let isMigrationRunning = false;
let migrationPromise = null;

// CRITICAL FIX: Export functions before they are used
// Enhanced connection check with automatic reconnection
// CRITICAL: This function is now more lenient - it only fails on actual connection errors
// It won't fail on timeouts if the connection is actually working (just slow)
const checkAndRestoreConnection = async () => {
    // CRITICAL FIX: If we already know connection is healthy, skip check
    // This prevents unnecessary checks that can cause false negatives
    if (isConnectionHealthy) {
        return true;
    }

    const dbHost = process.env.DB_HOST || 'NOT SET';
    const isCloudSqlProxy = dbHost.startsWith('/cloudsql/');

    // CRITICAL FIX: Use longer timeout for Cloud SQL Proxy
    // Cloud SQL Proxy can be slow but still functional
    const timeout = isCloudSqlProxy ? 15000 : 8000;

    // CRITICAL FIX: Only log if we're actually checking (not already healthy)
    if (!isConnectionHealthy) {
        console.log(`🔄 [DB] Checking connection... (Host: ${dbHost})`);
    }

    try {
        // CRITICAL FIX: Test connection with reasonable timeout
        // Don't fail on timeout if it's just slow - let actual operations handle that
        const testResult = await Promise.race([
            db.raw('SELECT 1 as test'),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Connection check timeout after ${timeout}ms`)), timeout)
            )
        ]);

        // CRITICAL FIX: Only log if we're restoring (was unhealthy before)
        if (!isConnectionHealthy) {
            console.log('✅ [DB] Connection restored successfully');
        }
        isConnectionHealthy = true;
        return true;
    } catch (error) {
        // CRITICAL FIX: Only mark as unhealthy for actual connection errors
        // Timeouts might just mean slow connection, not broken connection
        const isActualConnectionError = error.code === 'ECONNREFUSED' ||
            error.code === 'ENOTFOUND' ||
            (error.code === 'ETIMEDOUT' && !isCloudSqlProxy); // Cloud SQL timeouts are often false negatives

        if (isActualConnectionError) {
            isConnectionHealthy = false;
            console.error(`❌ [DB] Connection check failed:`, {
                code: error.code || 'UNKNOWN',
                message: error.message,
                host: dbHost,
                isCloudSqlProxy: isCloudSqlProxy,
                timestamp: new Date().toISOString()
            });
            return false;
        } else {
            // CRITICAL FIX: For timeouts on Cloud SQL, assume connection is OK
            // Cloud SQL Proxy can be slow but still functional
            // Let actual operations determine if connection is really broken
            if (isCloudSqlProxy && error.message.includes('timeout')) {
                console.warn(`⚠️ [DB] Connection check timeout (Cloud SQL may be slow), assuming connection is OK`);
                isConnectionHealthy = true; // Assume OK, let actual operations verify
                return true;
            }

            // For other errors, mark as unhealthy but don't fail completely
            isConnectionHealthy = false;
            console.warn(`⚠️ [DB] Connection check warning:`, error.message);
            // Still return true - let actual operations determine if it's really broken
            return true;
        }
    }
};

// CRITICAL FIX: Wrapper function for all database operations with automatic retry and reconnection
// NOTE: Do NOT use this wrapper for transaction operations - transactions need stable connections
const dbQueryWithRetry = async (queryFn, retries = 5, delay = 1000, skipConnectionCheck = false) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // CRITICAL FIX: Check connection only if not skipped (for transaction operations)
            if (!skipConnectionCheck) {
                const connectionOk = await checkAndRestoreConnection();
                if (!connectionOk) {
                    if (attempt < retries) {
                        console.warn(`⚠️ [DB] Connection unhealthy, restoring (${attempt}/${retries})...`);
                        await new Promise(resolve => setTimeout(resolve, delay * attempt * 2));
                        continue;
                    } else {
                        throw new Error('Database connection unavailable after multiple restoration attempts');
                    }
                }
            }

            // CRITICAL FIX: Execute query with timeout to prevent hanging
            const result = await Promise.race([
                queryFn(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Query timeout')), 30000)
                )
            ]);

            isConnectionHealthy = true;
            return result;
        } catch (error) {
            const isLastAttempt = attempt === retries;

            // Check if it's a connection error
            const isConnectionError = error.code === 'ECONNREFUSED' ||
                error.code === 'ETIMEDOUT' ||
                error.code === 'ENOTFOUND' ||
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('ETIMEDOUT') ||
                error.message.includes('connect') ||
                error.message.includes('Connection ended') ||
                error.message.includes('Connection timeout') ||
                error.message.includes('Query timeout');

            if (isConnectionError) {
                isConnectionHealthy = false;

                // CRITICAL FIX: Try to restore connection before retrying (only if not skipped)
                if (!isLastAttempt && !skipConnectionCheck) {
                    console.warn(`⚠️ [DB] Connection error (${error.code || error.message}), restoring and retrying (${attempt}/${retries})...`);

                    try {
                        await checkAndRestoreConnection();
                    } catch (restoreError) {
                        // Ignore restore errors, will retry
                    }

                    const waitTime = delay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                } else {
                    throw new Error(`Database connection failed after ${retries} attempts: ${error.message}`);
                }
            } else {
                // For other errors, throw immediately
                throw error;
            }
        }
    }
};

// CRITICAL FIX: Start periodic connection health check
const startConnectionHealthCheck = () => {
    if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
    }

    connectionCheckInterval = setInterval(async () => {
        await checkAndRestoreConnection();
    }, 30000); // Check every 30 seconds
};

// Functions will be exported at the end of the file

const ensureColumn = async (tableName, columnName, definitionCallback) => {
    try {
        // First check if table exists
        const hasTable = await db.schema.hasTable(tableName);
        if (!hasTable) {
            console.warn(`⚠️  [DB] Table ${tableName} does not exist. Skipping column ${columnName}.`);
            console.warn(`⚠️  [DB] Please run migrations: npm run migrate:latest`);
            return;
        }

        const hasColumn = await db.schema.hasColumn(tableName, columnName);
        if (!hasColumn) {
            await db.schema.alterTable(tableName, (table) => {
                definitionCallback(table);
            });
            console.log(`✅ [DB] Added ${tableName}.${columnName} column automatically.`);
        }
    } catch (error) {
        // Don't throw - just log the error
        console.error(`⚠️  [DB] Failed to ensure column ${tableName}.${columnName}:`, error.message);
    }
};

const backfillSuperAdmins = async () => {
    try {
        await db('users')
            .where('role', 'super_admin')
            .update({ is_super_admin: true });
    } catch (error) {
        console.error('[DB] Failed to backfill super admin flags:', error.message);
    }
};

const backfillAdsActivation = async () => {
    try {
        const updated = await db('ads')
            .whereNull('is_active')
            .update({ is_active: true });
        if (updated) {
            console.log(`[DB] Normalized ${updated} ads to is_active=true`);
        }
    } catch (error) {
        console.error('[DB] Failed to normalize ads.is_active:', error.message);
    }
};

// ربط كل نماذج Objection بقاعدة البيانات
Model.knex(db);

const ensureCriticalStructures = async () => {
    try {
        // CRITICAL: Check if users table exists first
        const hasUsersTable = await db.schema.hasTable('users');
        if (!hasUsersTable) {
            console.warn('⚠️  [DB] Users table not found.');
            console.warn('💡 [DB] Database tables need to be created.');
            console.warn('💡 [DB] Run migrations: npm run migrate:latest');
            console.warn('💡 [DB] Or use: .\\scripts\\run-migrations.ps1');
            console.warn('⚠️  [DB] Some features may not work until migrations are run.');
            // Don't throw - allow server to continue, but skip structure updates
            return;
        }

        const hasNotificationsTable = await db.schema.hasTable('notifications');
        if (hasNotificationsTable) {
            const hasDataColumn = await db.schema.hasColumn('notifications', 'data');
            if (!hasDataColumn) {
                await db.schema.alterTable('notifications', (table) => {
                    table.jsonb('data').nullable();
                });
                console.log('[DB] Added missing notifications.data column automatically.');
            }
        }

        // Only try to add columns if users table exists
        if (hasUsersTable) {
            await ensureColumn('users', 'is_super_admin', (table) => {
                table.boolean('is_super_admin').notNullable().defaultTo(false);
            });

            await ensureColumn('users', 'created_by', (table) => {
                table
                    .integer('created_by')
                    .unsigned()
                    .references('id')
                    .inTable('users')
                    .onDelete('SET NULL');
            });

            await backfillSuperAdmins();
        }

        const hasAdsTable = await db.schema.hasTable('ads');
        if (hasAdsTable) {
            await ensureColumn('ads', 'is_active', (table) => {
                table.boolean('is_active').notNullable().defaultTo(true);
            });
            await backfillAdsActivation();
        }

        // Only create support_tickets if users and chats tables exist
        // Reuse hasUsersTable from above (already checked)
        const hasChatsTable = await db.schema.hasTable('chats').catch(() => false);
        const hasSupportTickets = await db.schema.hasTable('support_tickets').catch(() => false);

        if (!hasSupportTickets && hasUsersTable && hasChatsTable) {
            try {
                await db.schema.createTable('support_tickets', (table) => {
                    table.increments('id').primary();
                    table.integer('user_id').unsigned().notNullable()
                        .references('id').inTable('users').onDelete('CASCADE');
                    table.integer('chat_id').unsigned().nullable()
                        .references('id').inTable('chats').onDelete('SET NULL');
                    table.string('ticket_number').notNullable().unique();
                    table.string('subject').notNullable();
                    table.text('description').nullable();
                    table.enum('status', ['open', 'in_progress', 'resolved', 'closed']).defaultTo('open');
                    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
                    table.integer('assigned_to').unsigned().nullable()
                        .references('id').inTable('users').onDelete('SET NULL');
                    table.timestamp('resolved_at').nullable();
                    table.timestamps(true, true);

                    table.index('user_id');
                    table.index('chat_id');
                    table.index('status');
                    table.index('ticket_number');
                    table.index('created_at');
                });
                console.log('✅ [DB] Created support_tickets table automatically.');
            } catch (supportError) {
                console.warn('⚠️  [DB] Could not create support_tickets table:', supportError.message);
            }
        } else if (!hasSupportTickets) {
            console.warn('⚠️  [DB] support_tickets table not created - required tables (users, chats) may not exist.');
            console.warn('💡 [DB] Run migrations: npm run migrate:latest');
        }
    } catch (structureError) {
        console.error('[DB] ensureCriticalStructures error:', structureError);
    }
};

const connectDB = async (retries = 5, delay = 2000) => {
    // CRITICAL FIX: Check if db is initialized
    if (!db) {
        console.error('❌ [DB Connection] Database not initialized');
        console.warn('⚠️ [DB Connection] Server will continue but database features are disabled');
        return false;
    }

    const maxRetries = retries;
    let attempt = 0;

    // CRITICAL FIX: Clean NODE_ENV before use
    let rawEnv = process.env.NODE_ENV || 'development';
    const cleanEnv = rawEnv.split(/\s+/)[0].toLowerCase();

    // CRITICAL FIX: Reduce timeout for Cloud Run to ensure fast startup
    // For Cloud SQL Proxy socket, use longer timeout as socket may take time to establish
    const dbHost = process.env.DB_HOST || '';
    const isCloudSqlProxy = dbHost.startsWith('/cloudsql/');
    const connectionTimeout = cleanEnv === 'production'
        ? (isCloudSqlProxy ? 10000 : 5000)  // CRITICAL: Longer timeout for Cloud SQL Proxy
        : 5000;

    while (attempt < maxRetries) {
        try {
            // CRITICAL FIX: Test connection with appropriate timeout
            // For Cloud SQL Proxy, the socket may take a moment to be available
            const connectionTest = await Promise.race([
                db.raw('SELECT 1+1 as result'),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Connection timeout')), connectionTimeout)
                )
            ]);

            console.log('✅ PostgreSQL connected successfully.');

            // Check if migrations are needed
            const hasUsersTable = await db.schema.hasTable('users').catch(() => false);
            if (!hasUsersTable) {
                console.log('⚠️  [DB] Database tables not found. Running migrations automatically...');
                try {
                    await runMigrationsSafely();
                    console.log('✅ [DB] Migrations completed successfully');
                } catch (migrationError) {
                    console.error('❌ [DB] Migration failed:', migrationError.message);
                    console.log('💡 [DB] Manual migration required: npm run migrate:latest');
                }
            }

            // Ensure critical structures (this will add missing columns etc.)
            await ensureCriticalStructures();

            // CRITICAL FIX: Set up connection pool monitoring
            db.on('query-error', (error, obj) => {
                console.error('❌ [DB Query Error]', {
                    error: error.message,
                    code: error.code,
                    sql: obj.sql?.substring(0, 100),
                    timestamp: new Date().toISOString()
                });

                // Mark connection as unhealthy on query error
                if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
                    isConnectionHealthy = false;
                }
            });

            // CRITICAL FIX: Start connection health monitoring
            isConnectionHealthy = true;
            startConnectionHealthCheck();

            return true;
        } catch (error) {
            attempt++;
            const isLastAttempt = attempt >= maxRetries;

            // Log error with attempt number and detailed information
            console.error(`❌ [DB Connection] Attempt ${attempt}/${maxRetries} failed:`, {
                code: error.code || 'UNKNOWN',
                message: error.message,
                host: process.env.DB_HOST || 'NOT SET',
                user: process.env.DB_USER || 'NOT SET',
                database: process.env.DB_NAME || 'NOT SET',
                isCloudSqlProxy: isCloudSqlProxy,
                timestamp: new Date().toISOString()
            });

            // Check if it's a connection refused error
            if (error.code === 'ECONNREFUSED' || error.message.includes('refused')) {
                const dbHost = process.env.DB_HOST || 'localhost';
                const dbPort = process.env.DB_PORT || 5432;
                const isCloudSqlProxy = dbHost && dbHost.startsWith('/cloudsql/');
                const isPublicIP = dbHost && /^\d+\.\d+\.\d+\.\d+$/.test(dbHost);

                console.error(`⚠️  [DB Connection] Cannot connect to PostgreSQL`);
                if (isCloudSqlProxy) {
                    console.error(`   Cloud SQL Proxy path: ${dbHost}`);
                    console.error(`   Troubleshooting steps:`);
                    console.error(`   1. Verify Cloud SQL instance is linked to Cloud Run service`);
                    console.error(`   2. Check IAM permissions: Cloud Run service account needs Cloud SQL Client role`);
                    console.error(`   3. Verify Cloud SQL instance is running`);
                    console.error(`   4. Run: fix-database-connection-now.bat to update Cloud Run service`);
                } else if (isPublicIP) {
                    console.error(`   Public IP: ${dbHost}:${dbPort}`);
                    console.error(`   Make sure Public IP is enabled on Cloud SQL instance`);
                    console.error(`   Make sure SSL is enabled (it should be automatic)`);
                    console.error(`   Run: fix-database-connection-now.bat to update Cloud Run service`);
                } else {
                    console.error(`   Host: ${dbHost}:${dbPort}`);
                    console.error(`   Make sure database is running and accessible`);
                }
            } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
                console.error(`⚠️  [DB Connection] Connection timeout`);
                if (isCloudSqlProxy) {
                    console.error(`   Cloud SQL Proxy socket may take time to establish`);
                    console.error(`   This is normal on first connection`);
                }
            } else if (error.code === 'ENOTFOUND') {
                console.error(`⚠️  [DB Connection] Host not found`);
                console.error(`   Verify DB_HOST environment variable is correct`);
            }

            // Handle connection errors based on error type
            if (error.code === 'ECONNREFUSED' || error.message.includes('refused')) {
                // Connection refused errors - handled above
                if (isLastAttempt) {
                    // CRITICAL FIX: Allow server to start even in production if DB connection fails
                    // This prevents "Service Unavailable" errors on Cloud Run
                    // The server will continue running and retry connection in background
                    console.warn('⚠️  [DB Connection] Failed to connect after all retries.');
                    console.warn('⚠️  [DB Connection] Server will continue running but database features are disabled.');
                    console.warn('⚠️  [DB Connection] The server will retry connection in the background.');
                    console.warn('⚠️  [DB Connection] Please check:');
                    console.warn('   1. Database is running and accessible');
                    console.warn('   2. Environment variables are set correctly:');
                    console.warn('      DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME');
                    if (isCloudSqlProxy) {
                        console.warn('   3. Cloud SQL Proxy connection:');
                        console.warn(`      DB_HOST=${dbHost}`);
                        console.warn('   4. Cloud SQL instance is linked to Cloud Run service');
                        console.warn('   5. Run: fix-database-connection-now.bat to update Cloud Run service');
                    } else {
                        console.warn('   3. Cloud SQL connection string (if using Cloud Run):');
                        console.warn('      DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME');
                        console.warn('   4. Cloud SQL instance is linked to Cloud Run service');
                    }
                    console.warn('');
                    // Don't exit - allow server to start and retry in background
                    // Set a flag to retry connection later
                    global.dbConnectionRetry = true;
                    return false; // Don't exit, just return false
                } else {
                    // Wait before retrying with exponential backoff
                    const waitTime = delay * Math.pow(2, attempt - 1);
                    console.log(`⏳ [DB Connection] Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            } else {
                // For other errors, log but don't exit - allow server to start
                if (isLastAttempt) {
                    console.error(`❌ [DB Connection] Failed after ${maxRetries} attempts: ${error.message}`);
                    console.warn('⚠️  [DB Connection] Server will continue running but database features are disabled.');
                    console.warn('⚠️  [DB Connection] The server will retry connection in the background.');
                    // Don't exit - allow server to start and retry in background
                    global.dbConnectionRetry = true;
                    return false;
                } else {
                    const waitTime = delay * Math.pow(2, attempt - 1);
                    console.log(`⏳ [DB Connection] Retrying in ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
    }

    return false;
};

// Export all functions
// CRITICAL FIX: Safe migration runner with lock to prevent concurrent migrations
const runMigrationsSafely = async () => {
    // If migration is already running, wait for it to complete
    if (isMigrationRunning && migrationPromise) {
        console.log('🔄 [MIGRATIONS] Migration already running, waiting for completion...');
        try {
            await migrationPromise;
            return true;
        } catch (error) {
            console.error('❌ [MIGRATIONS] Previous migration failed:', error.message);
            return false;
        }
    }

    // Set lock
    isMigrationRunning = true;

    // Create migration promise
    migrationPromise = (async () => {
        try {
            const knexfile = require('../knexfile');
            const knex = require('knex');
            // CRITICAL FIX: Clean NODE_ENV to handle cases where it contains extra values
            let rawEnv = process.env.NODE_ENV || 'production';
            const environment = rawEnv.split(/\s+/)[0].toLowerCase() === 'production' ? 'production' : 'development';
            const migrationConfig = knexfile[environment];

            if (!migrationConfig) {
                throw new Error(`Migration config not found for environment: ${environment}`);
            }

            // Create a new knex instance for migrations
            const migrationKnex = knex(migrationConfig);

            // Run migrations with timeout
            console.log('🔄 [MIGRATIONS] Executing migrations...');
            const migrationResults = await Promise.race([
                migrationKnex.migrate.latest(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Migration timeout after 2 minutes')), 120000)
                )
            ]);

            // Close migration connection
            await migrationKnex.destroy();

            if (migrationResults && migrationResults.length > 0) {
                console.log(`✅ [MIGRATIONS] Migrations completed: ${migrationResults.length} migration(s) executed`);
                migrationResults.forEach((result, index) => {
                    if (typeof result === 'string') {
                        console.log(`   ${index + 1}. ${result}`);
                    }
                });
            } else {
                console.log('✅ [MIGRATIONS] All migrations are up to date');
            }

            return true;
        } catch (error) {
            console.error('❌ [MIGRATIONS] Migration failed:', error.message);
            console.error('❌ [MIGRATIONS] Error details:', error.stack?.substring(0, 500));
            throw error;
        } finally {
            // Release lock
            isMigrationRunning = false;
            migrationPromise = null;
        }
    })();

    try {
        await migrationPromise;
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = {
    connectDB,
    db,
    knex,
    dbQueryWithRetry,
    checkAndRestoreConnection,
    startConnectionHealthCheck,
    runMigrationsSafely
}; // We export db and knex for seeders