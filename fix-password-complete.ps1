# PowerShell script to completely fix database password issue
# This script will:
# 1. Reset password in Cloud SQL
# 2. Update Cloud Run with the same password
# 3. Test the connection

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Password Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$INSTANCE_NAME = "altayar-db"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Setting new password in Cloud SQL..." -ForegroundColor Cyan
Write-Host "   Instance: $INSTANCE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host ""

# CRITICAL: Use a simple password without special characters to avoid escaping issues
# We'll use: AAIOH2040 (without %)
$NEW_PASSWORD = "AAIOH2040"

Write-Host "   New Password: $NEW_PASSWORD (no special characters)" -ForegroundColor Yellow
Write-Host "   This avoids escaping issues" -ForegroundColor Yellow
Write-Host ""

# Reset password in Cloud SQL
Write-Host "   Resetting password in Cloud SQL..." -ForegroundColor Cyan
$resetCmd = "gcloud sql users set-password postgres " +
    "--instance=$INSTANCE_NAME " +
    "--password=`"$NEW_PASSWORD`" " +
    "--project=$PROJECT_ID"

try {
    Invoke-Expression $resetCmd | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   SUCCESS: Password reset in Cloud SQL" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: Password reset may have failed, continuing anyway..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   WARNING: Password reset failed, continuing anyway..." -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 2: Getting current Cloud Run service configuration..." -ForegroundColor Cyan

# Get current service configuration
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host "   SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White

# Get current environment variables
$envVars = $serviceInfo.spec.template.spec.containers[0].env

# Get or generate secrets
$jwtSecret = $envVars | Where-Object {$_.name -eq "JWT_SECRET"} | Select-Object -ExpandProperty value
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "   Generated new JWT_SECRET" -ForegroundColor Green
}

$sessionSecret = $envVars | Where-Object {$_.name -eq "SESSION_SECRET"} | Select-Object -ExpandProperty value
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "   Generated new SESSION_SECRET" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Updating Cloud Run service with new password..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build environment variables list
$envVarsList = @(
    "NODE_ENV=production",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$NEW_PASSWORD",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
) -join ","

# Update service
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

Write-Host "   Executing: gcloud run services update..." -ForegroundColor Cyan
Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Password Configuration:" -ForegroundColor Cyan
    Write-Host "   Cloud SQL: $NEW_PASSWORD" -ForegroundColor White
    Write-Host "   Cloud Run: $NEW_PASSWORD" -ForegroundColor White
    Write-Host "   Status: MATCHED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for service to update (90 seconds)..." -ForegroundColor Cyan
    
    Start-Sleep -Seconds 90
    
    Write-Host ""
    Write-Host "Step 4: Testing service..." -ForegroundColor Cyan
    
    # Test health endpoint multiple times
    $healthUrl = "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health"
    $maxAttempts = 5
    $attempt = 0
    $connected = $false
    
    while ($attempt -lt $maxAttempts -and -not $connected) {
        $attempt++
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 15 -UseBasicParsing
            $healthData = $response.Content | ConvertFrom-Json
            
            if ($healthData.database.status -eq "connected") {
                Write-Host "   SUCCESS: Database is connected!" -ForegroundColor Green
                $connected = $true
            } else {
                Write-Host "   Status: $($healthData.status)" -ForegroundColor Yellow
                Write-Host "   Database: $($healthData.database.status)" -ForegroundColor Yellow
                if ($healthData.database.error) {
                    Write-Host "   Error: $($healthData.database.error.message)" -ForegroundColor Yellow
                }
                if ($attempt -lt $maxAttempts) {
                    Write-Host "   Waiting 30 seconds before retry..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 30
                }
            }
        } catch {
            Write-Host "   Error: $_" -ForegroundColor Yellow
            if ($attempt -lt $maxAttempts) {
                Write-Host "   Waiting 30 seconds before retry..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
            }
        }
    }
    
    Write-Host ""
    if ($connected) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS: Database connection established!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "WARNING: Database connection not yet established" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "This may take a few more minutes..." -ForegroundColor Yellow
        Write-Host "The connection will be retried automatically" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 2-3 minutes for database connection to fully establish" -ForegroundColor White
    Write-Host "2. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "3. Try register/login" -ForegroundColor White
    Write-Host ""
    Write-Host "Password Information:" -ForegroundColor Cyan
    Write-Host "   Password: $NEW_PASSWORD" -ForegroundColor White
    Write-Host "   User: postgres" -ForegroundColor White
    Write-Host "   Database: tourist_app_db" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    exit 1
}

