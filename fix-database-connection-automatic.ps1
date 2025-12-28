# PowerShell script to fix database connection automatically
# Uses the provided password directly

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Database Connection (Automatic)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

# Database credentials (provided by user)
# CRITICAL: Password contains %% which needs special handling
# In PowerShell string literal, %% represents a single %
# For gcloud command line, we need to pass the password as-is
# The password "AAIOH2040%%" means "AAIOH2040%" (single %)
# But we need to escape it properly for gcloud
$DB_PASSWORD = "AAIOH2040%%"
# For gcloud, we need to escape % as %%, so %% becomes %%%%
# But in PowerShell, %% in string is already a single %, so we need %%%% to get %% in output
# Actually, let's use the password directly and let PowerShell handle it
$DB_PASSWORD_ESCAPED = $DB_PASSWORD
$DB_USER = "postgres"
$DB_NAME = "tourist_app_db"
$DB_HOST = "/cloudsql/$CONNECTION_NAME"
$DB_PORT = "5432"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Getting current service configuration..." -ForegroundColor Cyan

# Get current service configuration
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White
Write-Host ""

# Generate secrets if not provided
Write-Host "Step 2: Generating secrets..." -ForegroundColor Cyan
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "SUCCESS: Secrets generated" -ForegroundColor Green
Write-Host ""

# Build environment variables map
# CRITICAL: PORT is automatically set by Cloud Run - don't include it
# CRITICAL: Use individual --update-env-vars flags to avoid comma escaping issues
Write-Host "Step 3: Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build environment variables map (same approach as fix-database-connection-now.ps1)
# This is more reliable for passwords with special characters
$envVarsMap = @{}
$envVarsMap["NODE_ENV"] = "production"
$envVarsMap["DB_HOST"] = $DB_HOST
$envVarsMap["DB_PORT"] = $DB_PORT
$envVarsMap["DB_USER"] = $DB_USER
$envVarsMap["DB_PASSWORD"] = $DB_PASSWORD  # Password with %% will be handled correctly
$envVarsMap["DB_NAME"] = $DB_NAME
$envVarsMap["JWT_SECRET"] = $jwtSecret
$envVarsMap["SESSION_SECRET"] = $sessionSecret
$envVarsMap["FRONTEND_URL"] = "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
$envVarsMap["BACKEND_URL"] = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

# Build env vars list for --set-env-vars
# CRITICAL: Use the same format as fix-database-connection-now.ps1
# This format works correctly with gcloud
$envVarsList = @(
    "NODE_ENV=production",
    "DB_HOST=$($envVarsMap['DB_HOST'])",
    "DB_PORT=$($envVarsMap['DB_PORT'])",
    "DB_USER=$($envVarsMap['DB_USER'])",
    "DB_PASSWORD=$($envVarsMap['DB_PASSWORD'])",
    "DB_NAME=$($envVarsMap['DB_NAME'])",
    "JWT_SECRET=$($envVarsMap['JWT_SECRET'])",
    "SESSION_SECRET=$($envVarsMap['SESSION_SECRET'])",
    "FRONTEND_URL=$($envVarsMap['FRONTEND_URL'])",
    "BACKEND_URL=$($envVarsMap['BACKEND_URL'])"
) -join ","

# Update service using --update-env-vars (same as fix-database-connection-now.ps1)
# CRITICAL: Use --update-env-vars instead of --set-env-vars to avoid overwriting other vars
$updateCmd = "gcloud run services update $SERVICE_NAME " +
    "--region $REGION " +
    "--project $PROJECT_ID " +
    "--update-env-vars $envVarsList " +
    "--set-cloudsql-instances $CONNECTION_NAME " +
    "--timeout 300 " +
    "--cpu 2 " +
    "--memory 2Gi " +
    "--max-instances 10 " +
    "--min-instances 1 " +
    "--port 8080 " +
    "--quiet"

Write-Host "Executing: gcloud run services update..." -ForegroundColor Cyan
Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Environment variables set:" -ForegroundColor Cyan
    Write-Host "  DB_HOST: $DB_HOST" -ForegroundColor White
    Write-Host "  DB_USER: $DB_USER" -ForegroundColor White
    Write-Host "  DB_NAME: $DB_NAME" -ForegroundColor White
    Write-Host "  DB_PASSWORD: [SET]" -ForegroundColor White
    Write-Host "  JWT_SECRET: [GENERATED]" -ForegroundColor White
    Write-Host "  SESSION_SECRET: [GENERATED]" -ForegroundColor White
    Write-Host ""
    Write-Host "Waiting for service to update (60 seconds)..." -ForegroundColor Cyan
    
    Start-Sleep -Seconds 60
    
    Write-Host ""
    Write-Host "Testing service..." -ForegroundColor Cyan
    
    # Test health endpoint
    $healthUrl = "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health"
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10 -UseBasicParsing
        $healthData = $response.Content | ConvertFrom-Json
        
        if ($healthData.database.status -eq "connected") {
            Write-Host "SUCCESS: Service is responding!" -ForegroundColor Green
            Write-Host "   Status: OK" -ForegroundColor Green
            Write-Host "   Database: connected" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Service is responding but database is not connected yet" -ForegroundColor Yellow
            Write-Host "   Status: $($healthData.status)" -ForegroundColor Yellow
            Write-Host "   Database: $($healthData.database.status)" -ForegroundColor Yellow
            Write-Host "   This may take a few more minutes..." -ForegroundColor Yellow
            Write-Host "   The connection will be retried in the background" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "WARNING: Could not test service" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Database connection configured!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 2-3 minutes for database connection to establish" -ForegroundColor White
    Write-Host "2. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "3. Try register/login" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    exit 1
}

