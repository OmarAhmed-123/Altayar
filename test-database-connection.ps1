# PowerShell script to test database connection
# This script tests both Cloud SQL Proxy and Public IP connections

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 Testing Database Connection" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"
$CLOUD_SQL_PUBLIC_IP = "34.58.123.127"
$DB_PORT = 5432
$DB_USER = "postgres"
$DB_NAME = "tourist_app_db"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Cloud SQL: $CONNECTION_NAME" -ForegroundColor White
Write-Host "   Public IP: $CLOUD_SQL_PUBLIC_IP" -ForegroundColor White
Write-Host ""

# Get database password
$dbPassword = Read-Host "Enter Cloud SQL database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""
Write-Host "Testing connection methods..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Cloud SQL Proxy connection works (if on Cloud Run)
Write-Host "1️⃣ Testing Cloud SQL Proxy (Socket) connection..." -ForegroundColor Yellow
$socketHost = "/cloudsql/$CONNECTION_NAME"

try {
    # Try to connect using Cloud SQL Proxy
    $env:DB_HOST = $socketHost
    $env:DB_PORT = $DB_PORT
    $env:DB_USER = $DB_USER
    $env:DB_PASSWORD = $dbPasswordPlain
    $env:DB_NAME = $DB_NAME
    $env:NODE_ENV = "production"
    
    # Run a simple Node.js script to test connection
    $testScript = @"
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
});

knex.raw('SELECT 1 as test')
    .then(() => {
        console.log('✅ Cloud SQL Proxy connection: SUCCESS');
        process.exit(0);
    })
    .catch((err) => {
        console.log('❌ Cloud SQL Proxy connection: FAILED');
        console.log('   Error:', err.message);
        process.exit(1);
    });
"@
    
    $testScript | Out-File -FilePath "test-socket-connection.js" -Encoding UTF8
    node test-socket-connection.js 2>&1 | ForEach-Object {
        Write-Host $_ -ForegroundColor $(if ($_ -match "SUCCESS") { "Green" } else { "Red" })
    }
    Remove-Item test-socket-connection.js -ErrorAction SilentlyContinue
} catch {
    Write-Host "❌ Cloud SQL Proxy connection: FAILED (not available locally)" -ForegroundColor Red
    Write-Host "   This is normal - Cloud SQL Proxy only works on Cloud Run" -ForegroundColor Gray
}

Write-Host ""

# Test 2: Check if Public IP connection works
Write-Host "2️⃣ Testing Public IP connection..." -ForegroundColor Yellow

try {
    # Check if Cloud SQL Proxy is installed locally
    $cloudSqlProxyPath = Get-Command cloud_sql_proxy -ErrorAction SilentlyContinue
    if ($cloudSqlProxyPath) {
        Write-Host "   Cloud SQL Proxy is installed locally" -ForegroundColor Green
        Write-Host "   Starting Cloud SQL Proxy in background..." -ForegroundColor Yellow
        
        # Start Cloud SQL Proxy in background
        $proxyProcess = Start-Process -FilePath "cloud_sql_proxy" -ArgumentList "-instances=$CONNECTION_NAME=tcp:5432" -PassThru -WindowStyle Hidden
        
        # Wait for proxy to start
        Start-Sleep -Seconds 3
        
        # Test connection through proxy
        $env:DB_HOST = "127.0.0.1"
        $env:DB_PORT = "5432"
        $env:DB_USER = $DB_USER
        $env:DB_PASSWORD = $dbPasswordPlain
        $env:DB_NAME = $DB_NAME
        $env:NODE_ENV = "development"
        
        $testScript2 = @"
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    }
});

knex.raw('SELECT 1 as test')
    .then(() => {
        console.log('✅ Public IP (via proxy) connection: SUCCESS');
        process.exit(0);
    })
    .catch((err) => {
        console.log('❌ Public IP (via proxy) connection: FAILED');
        console.log('   Error:', err.message);
        process.exit(1);
    });
"@
        
        $testScript2 | Out-File -FilePath "test-proxy-connection.js" -Encoding UTF8
        node test-proxy-connection.js 2>&1 | ForEach-Object {
            Write-Host $_ -ForegroundColor $(if ($_ -match "SUCCESS") { "Green" } else { "Red" })
        }
        Remove-Item test-proxy-connection.js -ErrorAction SilentlyContinue
        
        # Stop proxy
        Stop-Process -Id $proxyProcess.Id -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "   Cloud SQL Proxy is not installed locally" -ForegroundColor Yellow
        Write-Host "   Skipping Public IP test (requires Cloud SQL Proxy)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Public IP connection test failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📋 Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Recommendations:" -ForegroundColor Yellow
Write-Host "   1. For Cloud Run: Use Cloud SQL Proxy (socket) connection" -ForegroundColor White
Write-Host "   2. Run: fix-database-connection-final.ps1 to update Cloud Run service" -ForegroundColor White
Write-Host "   3. If Cloud SQL Proxy doesn't work, try Public IP connection" -ForegroundColor White
Write-Host ""
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host ""

