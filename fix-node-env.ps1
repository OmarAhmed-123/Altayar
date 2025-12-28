# PowerShell script to fix NODE_ENV in Cloud Run service
# This ensures NODE_ENV is set to "production" only, without extra values

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing NODE_ENV in Cloud Run Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Getting current environment variables..." -ForegroundColor Cyan

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

# Check current NODE_ENV
$currentNodeEnv = ($envVars | Where-Object { $_.name -eq "NODE_ENV" }).value

if ($currentNodeEnv) {
    Write-Host "Current NODE_ENV: $currentNodeEnv" -ForegroundColor Yellow
    
    # Check if NODE_ENV contains extra values
    if ($currentNodeEnv -match '\s') {
        Write-Host "WARNING: NODE_ENV contains extra values (spaces detected)" -ForegroundColor Yellow
        Write-Host "   This will cause migration failures" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "NODE_ENV is already correct: $currentNodeEnv" -ForegroundColor Green
        Write-Host "   No changes needed" -ForegroundColor White
        exit 0
    }
} else {
    Write-Host "NODE_ENV is not set" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Step 2: Building environment variables list..." -ForegroundColor Cyan

# Build environment variables list with corrected NODE_ENV
$envVarsList = @()
foreach ($envVar in $envVars) {
    if ($envVar.name -eq "NODE_ENV") {
        # Set NODE_ENV to "production" only (no extra values)
        $envVarsList += "NODE_ENV=production"
        Write-Host "   Fixed NODE_ENV: production" -ForegroundColor Green
    } elseif ($envVar.name -eq "PORT") {
        # Skip PORT - it's set automatically by Cloud Run
        continue
    } elseif ($envVar.value) {
        # Escape special characters
        $value = $envVar.value -replace '%', '%%' -replace '&', '^&' -replace '|', '^|'
        $envVarsList += "$($envVar.name)=$value"
    }
}

# Ensure NODE_ENV is set if it wasn't in the list
$hasNodeEnv = $envVarsList | Where-Object { $_ -like "NODE_ENV=*" }
if (-not $hasNodeEnv) {
    $envVarsList += "NODE_ENV=production"
    Write-Host "   Added NODE_ENV: production" -ForegroundColor Green
}

$envVarsString = $envVarsList -join ","

Write-Host ""
Write-Host "Step 3: Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Update service
$updateCmd = "gcloud run services update $SERVICE_NAME " +
    "--region $REGION " +
    "--update-env-vars `"$envVarsString`" " +
    "--quiet"

Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: NODE_ENV fixed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "NODE_ENV is now set to: production" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 1-2 minutes for service to update" -ForegroundColor White
    Write-Host "2. Try register/login again" -ForegroundColor White
    Write-Host "3. Auto-migration should work now" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    exit 1
}

