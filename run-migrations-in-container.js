#!/usr/bin/env node
// Script to run migrations in Cloud Run container
// This script is designed to work reliably in containerized environments

// Add error handling for missing modules
let knex, knexfile;
try {
    knex = require('knex');
    knexfile = require('./knexfile');
} catch (error) {
    console.error('[MIGRATIONS] ERROR: Failed to load required modules');
    console.error('[MIGRATIONS] Error:', error.message);
    console.error('[MIGRATIONS] Stack:', error.stack);
    process.exit(1);
}

async function runMigrations() {
    let db = null;
    try {
        // CRITICAL FIX: Clean NODE_ENV to handle cases where it contains extra values
        let rawEnv = process.env.NODE_ENV || 'production';
        // Extract just the environment name (first word before space)
        const environment = rawEnv.split(/\s+/)[0].toLowerCase() === 'production' ? 'production' : 'development';
        
        console.log(`[MIGRATIONS] Raw NODE_ENV: ${rawEnv}`);
        console.log(`[MIGRATIONS] Cleaned Environment: ${environment}`);
        console.log(`[MIGRATIONS] Working directory: ${process.cwd()}`);
        console.log(`[MIGRATIONS] DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
        console.log(`[MIGRATIONS] DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
        console.log(`[MIGRATIONS] DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
        console.log(`[MIGRATIONS] DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET' : 'NOT SET'}`);
        console.log(`[MIGRATIONS] DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
        
        // CRITICAL FIX: If DB_HOST is not set or is localhost, try to use Cloud SQL Proxy
        // Cloud SQL Proxy socket is available at /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
        if (!process.env.DB_HOST || process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST.includes('localhost')) {
            console.log('[MIGRATIONS] WARNING: DB_HOST is not set or is localhost');
            console.log('[MIGRATIONS] Attempting to use Cloud SQL Proxy socket...');
            
            // Try to get Cloud SQL instance from environment or use default
            const cloudSqlInstance = process.env.CLOUD_SQL_INSTANCE || 
                                     process.env.CLOUD_SQL_CONNECTION_NAME ||
                                     'altayar-46d6f:us-central1:altayar-db';
            
            // Cloud SQL Proxy socket path format: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
            const socketPath = `/cloudsql/${cloudSqlInstance}`;
            console.log(`[MIGRATIONS] Setting DB_HOST to Cloud SQL Proxy socket: ${socketPath}`);
            process.env.DB_HOST = socketPath;
        }
        
        // Check if knexfile exists
        if (!knexfile) {
            console.error('[MIGRATIONS] ERROR: knexfile.js not found');
            process.exit(1);
        }
        
        const config = knexfile[environment];
        
        if (!config) {
            console.error(`[MIGRATIONS] ERROR: Migration config not found for environment: ${environment}`);
            console.error(`[MIGRATIONS] Available environments: ${Object.keys(knexfile).join(', ')}`);
            process.exit(1);
        }
        
        console.log('[MIGRATIONS] Creating database connection...');
        console.log(`[MIGRATIONS] Connection config:`, JSON.stringify({
            host: config.connection?.host || 'N/A',
            port: config.connection?.port || 'N/A',
            database: config.connection?.database || 'N/A',
            user: config.connection?.user || 'N/A'
        }, null, 2));
        
        db = knex(config);
        
        // Test connection first with timeout
        console.log('[MIGRATIONS] Testing database connection...');
        await Promise.race([
            db.raw('SELECT 1 as test'),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
            )
        ]);
        console.log('[MIGRATIONS] Database connection successful');
        
        // Run migrations
        console.log('[MIGRATIONS] Running migrations...');
        const migrationResults = await Promise.race([
            db.migrate.latest(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Migration timeout after 5 minutes')), 300000)
            )
        ]);
        
        if (migrationResults && migrationResults.length > 0) {
            console.log(`[MIGRATIONS] SUCCESS: ${migrationResults.length} migration(s) executed`);
            migrationResults.forEach((result, index) => {
                if (typeof result === 'string') {
                    console.log(`[MIGRATIONS]   ${index + 1}. ${result}`);
                }
            });
        } else {
            console.log('[MIGRATIONS] SUCCESS: All migrations are up to date');
        }
        
        // Verify tables exist
        console.log('[MIGRATIONS] Verifying tables...');
        const tables = ['users', 'memberships', 'blogs', 'notifications'];
        const results = {};
        
        for (const table of tables) {
            const exists = await db.schema.hasTable(table);
            results[table] = exists;
            console.log(`[MIGRATIONS]   ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
        }
        
        const allExist = Object.values(results).every(exists => exists);
        
        if (allExist) {
            console.log('[MIGRATIONS] SUCCESS: All required tables exist');
        } else {
            console.log('[MIGRATIONS] WARNING: Some tables are missing');
        }
        
        // Close connection
        if (db) {
            await db.destroy();
            console.log('[MIGRATIONS] Database connection closed');
        }
        
        process.exit(allExist ? 0 : 1);
    } catch (error) {
        console.error('[MIGRATIONS] ERROR:', error.message);
        console.error('[MIGRATIONS] Error code:', error.code);
        console.error('[MIGRATIONS] Error details:', error);
        if (error.stack) {
            console.error('[MIGRATIONS] Stack:', error.stack);
        }
        
        // Close connection if exists
        if (db) {
            try {
                await db.destroy();
            } catch (destroyError) {
                console.error('[MIGRATIONS] Error closing connection:', destroyError.message);
            }
        }
        
        process.exit(1);
    }
}

// Run migrations
runMigrations();

