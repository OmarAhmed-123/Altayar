# PowerShell script to run database migrations directly on Cloud SQL
# This script runs migrations using Cloud SQL Proxy socket connection

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Migrations Directly on Cloud SQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$CLOUD_SQL_INSTANCE = "altayar-46d6f:us-central1:altayar-db"
$DB_USER = "postgres"
$DB_NAME = "tourist_app_db"
$DB_PORT = "5432"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Cloud SQL Instance: $CLOUD_SQL_INSTANCE" -ForegroundColor White
Write-Host "   Database: $DB_NAME" -ForegroundColor White
Write-Host ""

# Set project
gcloud config set project $PROJECT_ID | Out-Null

# Get database password
Write-Host "Step 1: Getting database credentials..." -ForegroundColor Cyan
$dbPassword = Read-Host "Enter Cloud SQL database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "Step 2: Setting up environment variables..." -ForegroundColor Cyan

# Set environment variables for Cloud SQL connection using socket
$env:NODE_ENV = "production"
$env:DB_HOST = "/cloudsql/$CLOUD_SQL_INSTANCE"
$env:DB_PORT = $DB_PORT
$env:DB_USER = $DB_USER
$env:DB_PASSWORD = $dbPasswordPlain
$env:DB_NAME = $DB_NAME

Write-Host "   DB_HOST: $env:DB_HOST" -ForegroundColor White
Write-Host "   DB_PORT: $env:DB_PORT" -ForegroundColor White
Write-Host "   DB_USER: $env:DB_USER" -ForegroundColor White
Write-Host "   DB_NAME: $env:DB_NAME" -ForegroundColor White
Write-Host ""

Write-Host "Step 3: Testing database connection..." -ForegroundColor Cyan

# Test connection using Node.js
$testScript = @"
const knex = require('knex');
const knexfile = require('./knexfile');
const environment = process.env.NODE_ENV || 'production';
const config = knexfile[environment];

if (!config) {
    console.error('ERROR: Migration config not found for environment:', environment);
    process.exit(1);
}

const db = knex(config);

db.raw('SELECT 1+1 as result')
    .then((result) => {
        console.log('SUCCESS: Database connection test passed');
        console.log('Result:', result.rows[0]);
        return db.destroy();
    })
    .then(() => {
        console.log('Connection closed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('ERROR: Database connection test failed');
        console.error('Error:', error.message);
        db.destroy().finally(() => process.exit(1));
    });
"@

$testScript | Out-File -FilePath "test-connection-temp.js" -Encoding UTF8

try {
    node test-connection-temp.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Database connection test failed" -ForegroundColor Red
        Write-Host "   Please check:" -ForegroundColor Yellow
        Write-Host "   1. Cloud SQL instance is running" -ForegroundColor Yellow
        Write-Host "   2. Database password is correct" -ForegroundColor Yellow
        Write-Host "   3. Cloud SQL Proxy is installed and running (if using socket)" -ForegroundColor Yellow
        Write-Host ""
        Remove-Item "test-connection-temp.js" -ErrorAction SilentlyContinue
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to test database connection" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Remove-Item "test-connection-temp.js" -ErrorAction SilentlyContinue
    exit 1
} finally {
    Remove-Item "test-connection-temp.js" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Step 4: Running migrations..." -ForegroundColor Cyan
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
Write-Host ""

# Run migrations
try {
    npm run migrate:latest
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Migrations failed" -ForegroundColor Red
        Write-Host "   Check the error messages above" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to run migrations" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 5: Verifying migrations..." -ForegroundColor Cyan

# Verify migrations using Node.js
$verifyScript = @"
const knex = require('knex');
const knexfile = require('./knexfile');
const environment = process.env.NODE_ENV || 'production';
const config = knexfile[environment];

if (!config) {
    console.error('ERROR: Migration config not found');
    process.exit(1);
}

const db = knex(config);

async function verifyTables() {
    try {
        const tables = ['users', 'memberships', 'blogs', 'notifications'];
        const results = {};
        
        for (const table of tables) {
            const exists = await db.schema.hasTable(table);
            results[table] = exists;
        }
        
        console.log('Table verification results:');
        Object.keys(results).forEach(table => {
            const status = results[table] ? 'EXISTS' : 'MISSING';
            const color = results[table] ? 'GREEN' : 'RED';
            console.log(\`  \${table}: \${status}\`);
        });
        
        const allExist = Object.values(results).every(exists => exists);
        
        if (allExist) {
            console.log('');
            console.log('SUCCESS: All required tables exist');
            process.exit(0);
        } else {
            console.log('');
            console.log('WARNING: Some tables are missing');
            process.exit(1);
        }
    } catch (error) {
        console.error('ERROR: Verification failed');
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await db.destroy();
    }
}

verifyTables();
"@

$verifyScript | Out-File -FilePath "verify-tables-temp.js" -Encoding UTF8

try {
    node verify-tables-temp.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "WARNING: Some tables may be missing" -ForegroundColor Yellow
        Write-Host "   Check the verification results above" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "SUCCESS: All required tables exist" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "WARNING: Could not verify tables" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Yellow
} finally {
    Remove-Item "verify-tables-temp.js" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migrations completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test register/login on your app" -ForegroundColor White
Write-Host "2. Check health endpoint: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
Write-Host "3. View logs: view-cloud-run-logs.bat" -ForegroundColor White
Write-Host ""

