# PowerShell script to fix Cloud Run Service database connection immediately
# This ensures all environment variables are set correctly for Cloud SQL Proxy

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Cloud Run Service Database Connection" -ForegroundColor Cyan
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

Write-Host "   SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White
Write-Host ""

# Get current environment variables
$envVars = $serviceInfo.spec.template.spec.containers[0].env
$envVarsMap = @{}

# Build map of existing environment variables
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        $envVarsMap[$envVar.name] = $envVar.value
    }
}

Write-Host "Step 2: Checking environment variables..." -ForegroundColor Cyan

# Check and set DB_HOST
if (-not $envVarsMap["DB_HOST"] -or $envVarsMap["DB_HOST"] -eq "127.0.0.1" -or $envVarsMap["DB_HOST"] -like "*localhost*") {
    $envVarsMap["DB_HOST"] = "/cloudsql/$CONNECTION_NAME"
    Write-Host "   Setting DB_HOST to: /cloudsql/$CONNECTION_NAME" -ForegroundColor Yellow
} else {
    Write-Host "   Found DB_HOST: $($envVarsMap['DB_HOST'])" -ForegroundColor Green
}

# Check and set DB_USER
if (-not $envVarsMap["DB_USER"]) {
    $envVarsMap["DB_USER"] = "postgres"
    Write-Host "   Setting DB_USER to: postgres" -ForegroundColor Yellow
} else {
    Write-Host "   Found DB_USER: $($envVarsMap['DB_USER'])" -ForegroundColor Green
}

# Check and set DB_NAME
if (-not $envVarsMap["DB_NAME"]) {
    $envVarsMap["DB_NAME"] = "tourist_app_db"
    Write-Host "   Setting DB_NAME to: tourist_app_db" -ForegroundColor Yellow
} else {
    Write-Host "   Found DB_NAME: $($envVarsMap['DB_NAME'])" -ForegroundColor Green
}

# Check and set DB_PORT
if (-not $envVarsMap["DB_PORT"]) {
    $envVarsMap["DB_PORT"] = "5432"
}

# Check DB_PASSWORD
if (-not $envVarsMap["DB_PASSWORD"]) {
    Write-Host "   WARNING: DB_PASSWORD is not set!" -ForegroundColor Red
    Write-Host "   Enter database password:" -ForegroundColor Yellow
    $dbPassword = Read-Host "DB_PASSWORD" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    $envVarsMap["DB_PASSWORD"] = $dbPasswordPlain
    Write-Host "   DB_PASSWORD set" -ForegroundColor Green
} else {
    Write-Host "   Found DB_PASSWORD: [SET]" -ForegroundColor Green
}

# Ensure NODE_ENV is set
if (-not $envVarsMap["NODE_ENV"]) {
    $envVarsMap["NODE_ENV"] = "production"
}

# Ensure JWT_SECRET is set
if (-not $envVarsMap["JWT_SECRET"]) {
    Write-Host "   WARNING: JWT_SECRET is not set!" -ForegroundColor Yellow
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    $envVarsMap["JWT_SECRET"] = $jwtSecret
    Write-Host "   Generated new JWT_SECRET" -ForegroundColor Green
}

# Ensure SESSION_SECRET is set
if (-not $envVarsMap["SESSION_SECRET"]) {
    Write-Host "   WARNING: SESSION_SECRET is not set!" -ForegroundColor Yellow
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    $envVarsMap["SESSION_SECRET"] = $sessionSecret
    Write-Host "   Generated new SESSION_SECRET" -ForegroundColor Green
}

# Ensure FRONTEND_URL is set
if (-not $envVarsMap["FRONTEND_URL"]) {
    $envVarsMap["FRONTEND_URL"] = "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
}

# Ensure BACKEND_URL is set
if (-not $envVarsMap["BACKEND_URL"]) {
    $envVarsMap["BACKEND_URL"] = "https://altayar-backend-kuwjte4rda-uc.a.run.app"
}

Write-Host ""
Write-Host "Step 3: Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# CRITICAL: Build command with individual --update-env-vars for each variable
# This avoids escaping issues with special characters (like % in passwords)
$envVarArgs = @()
foreach ($key in $envVarsMap.Keys) {
    $value = $envVarsMap[$key]
    $envVarArgs += "--update-env-vars"
    $envVarArgs += "$key=$value"
}

# Build update command
$updateCmdParts = @(
    "gcloud run services update $SERVICE_NAME",
    "--region $REGION",
    "--project $PROJECT_ID"
)
$updateCmdParts += $envVarArgs

# Ensure Cloud SQL instance is linked
$hasCloudSqlConnection = $false
$cloudSqlInstances = $serviceInfo.spec.template.spec.containers[0].cloudSqlInstances
if ($cloudSqlInstances -and $cloudSqlInstances.Count -gt 0) {
    foreach ($instance in $cloudSqlInstances) {
        if ($instance -eq $CONNECTION_NAME) {
            $hasCloudSqlConnection = $true
            break
        }
    }
}

if (-not $hasCloudSqlConnection) {
    Write-Host "   Adding Cloud SQL instance connection..." -ForegroundColor Yellow
    $updateCmdParts += "--add-cloudsql-instances $CONNECTION_NAME"
}

$updateCmdParts += "--quiet"

$updateCmd = $updateCmdParts -join " "

Write-Host "   Executing update command..." -ForegroundColor Cyan
Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 30 seconds for service to restart" -ForegroundColor White
    Write-Host "2. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "3. Database should now be connected" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update Cloud Run service" -ForegroundColor Red
    exit 1
}

