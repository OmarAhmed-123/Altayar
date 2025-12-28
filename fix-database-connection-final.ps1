# PowerShell script to fix Cloud Run Service database connection - FINAL SOLUTION
# This script automatically sets all required environment variables

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Cloud Run Service Database Connection" -ForegroundColor Cyan
Write-Host "   FINAL SOLUTION - AUTOMATIC" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

# Database password (from previous fixes)
$DB_PASSWORD = "AAIOH2040%%"

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

Write-Host "Step 2: Setting environment variables..." -ForegroundColor Cyan

# CRITICAL: Set all required database environment variables
$envVarsMap["NODE_ENV"] = "production"
$envVarsMap["DB_HOST"] = "/cloudsql/$CONNECTION_NAME"
$envVarsMap["DB_PORT"] = "5432"
$envVarsMap["DB_USER"] = "postgres"
$envVarsMap["DB_PASSWORD"] = $DB_PASSWORD
$envVarsMap["DB_NAME"] = "tourist_app_db"

Write-Host "   DB_HOST: $($envVarsMap['DB_HOST'])" -ForegroundColor Green
Write-Host "   DB_USER: $($envVarsMap['DB_USER'])" -ForegroundColor Green
Write-Host "   DB_NAME: $($envVarsMap['DB_NAME'])" -ForegroundColor Green
Write-Host "   DB_PASSWORD: [SET]" -ForegroundColor Green

# Generate secrets if not set
if (-not $envVarsMap["JWT_SECRET"]) {
    $envVarsMap["JWT_SECRET"] = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "   Generated JWT_SECRET" -ForegroundColor Yellow
}

if (-not $envVarsMap["SESSION_SECRET"]) {
    $envVarsMap["SESSION_SECRET"] = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "   Generated SESSION_SECRET" -ForegroundColor Yellow
}

# Set URLs
$envVarsMap["FRONTEND_URL"] = "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
$envVarsMap["BACKEND_URL"] = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

Write-Host ""
Write-Host "Step 3: Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# CRITICAL FIX: Use individual --update-env-vars flags to handle special characters correctly
# This is the most reliable method for values with commas, quotes, or special characters
$envVarArgs = @()
foreach ($key in $envVarsMap.Keys) {
    $value = $envVarsMap[$key]
    # CRITICAL: Use individual flags - this handles commas, quotes, and special chars correctly
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
