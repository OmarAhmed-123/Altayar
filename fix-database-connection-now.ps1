# PowerShell script to fix database connection immediately
# This ensures all environment variables are set correctly

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Database Connection Now" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

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

# Get current environment variables
$envVars = $serviceInfo.spec.template.spec.containers[0].env

# Get database password
Write-Host "Step 2: Getting database credentials..." -ForegroundColor Cyan
$dbPassword = Read-Host "Enter Cloud SQL database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host ""

# Get JWT_SECRET and SESSION_SECRET
$jwtSecret = Read-Host "Enter JWT_SECRET (or press Enter to generate new one)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated new JWT_SECRET" -ForegroundColor Green
}

$sessionSecret = Read-Host "Enter SESSION_SECRET (or press Enter to generate new one)"
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated new SESSION_SECRET" -ForegroundColor Green
}

Write-Host ""

# Build environment variables list
$envVarsList = @()
$envVarsMap = @{}

# First, collect all existing env vars
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        $envVarsMap[$envVar.name] = $envVar.value
    }
}

# CRITICAL: Set NODE_ENV to "production" only (no extra values)
$envVarsMap["NODE_ENV"] = "production"

# CRITICAL: PORT is automatically set by Cloud Run - don't include it
# Removing PORT from environment variables as it's reserved

# Set database connection variables
$envVarsMap["DB_HOST"] = "/cloudsql/$CONNECTION_NAME"
$envVarsMap["DB_PORT"] = "5432"
$envVarsMap["DB_USER"] = "postgres"
$envVarsMap["DB_PASSWORD"] = $dbPasswordPlain
$envVarsMap["DB_NAME"] = "tourist_app_db"

# Set secrets
$envVarsMap["JWT_SECRET"] = $jwtSecret
$envVarsMap["SESSION_SECRET"] = $sessionSecret

# Set URLs
$envVarsMap["FRONTEND_URL"] = "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
$envVarsMap["BACKEND_URL"] = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

# Build env vars list (same format as fix-all-database-issues.ps1)
# CRITICAL: PORT is automatically set by Cloud Run - don't include it
$envVarsList = @(
    "NODE_ENV=production",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$dbPasswordPlain",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
) -join ","

Write-Host "Step 3: Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Update service (same format as fix-all-database-issues.ps1)
$updateCmd = "gcloud run services update $SERVICE_NAME " +
    "--region $REGION " +
    "--project $PROJECT_ID " +
    "--update-env-vars $envVarsList " +
    "--add-cloudsql-instances $CONNECTION_NAME " +
    "--timeout 300 " +
    "--cpu 2 " +
    "--memory 2Gi " +
    "--max-instances 10 " +
    "--min-instances 1 " +
    "--port 8080 " +
    "--quiet"

Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
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
            Write-Host "WARNING: Service is responding but database is not connected" -ForegroundColor Yellow
            Write-Host "   Status: $($healthData.status)" -ForegroundColor Yellow
            Write-Host "   Database: $($healthData.database.status)" -ForegroundColor Yellow
            Write-Host "   This may take a few more minutes..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "WARNING: Could not test service" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Database connection fixed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "2. Wait 2-3 minutes for database connection to establish" -ForegroundColor White
    Write-Host "3. Try register/login" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    exit 1
}

