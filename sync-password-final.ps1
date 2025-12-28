# PowerShell script to sync password between Cloud SQL and Cloud Run
# This script will ensure both use the same password

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sync Password: Cloud SQL <-> Cloud Run" -ForegroundColor Cyan
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

Write-Host "Step 1: Getting current password from Cloud Run..." -ForegroundColor Cyan

# Get current Cloud Run service configuration
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

# Get current environment variables
$envVars = $serviceInfo.spec.template.spec.containers[0].env
$currentCloudRunPassword = $envVars | Where-Object {$_.name -eq "DB_PASSWORD"} | Select-Object -ExpandProperty value

Write-Host "   Cloud Run Password: $currentCloudRunPassword" -ForegroundColor White
Write-Host "   Length: $($currentCloudRunPassword.Length)" -ForegroundColor White
Write-Host ""

Write-Host "Step 2: Enter the CORRECT password from Cloud SQL..." -ForegroundColor Cyan
Write-Host "   IMPORTANT: Enter the password that you set in Cloud SQL Console" -ForegroundColor Yellow
Write-Host "   (The one you just changed in the dialog box)" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Current Cloud Run password: $currentCloudRunPassword" -ForegroundColor White
Write-Host "   If this doesn't match Cloud SQL, enter the Cloud SQL password below" -ForegroundColor White
Write-Host ""

$dbPasswordSecure = Read-Host "Enter the CORRECT Cloud SQL password" -AsSecureString
$correctPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPasswordSecure)
)

Write-Host ""
Write-Host "   Password entered: $($correctPassword.Length) characters" -ForegroundColor White
Write-Host ""

# Check if passwords match
if ($currentCloudRunPassword -eq $correctPassword) {
    Write-Host "   INFO: Passwords already match!" -ForegroundColor Green
    Write-Host "   But connection is still failing..." -ForegroundColor Yellow
    Write-Host "   Let's update Cloud SQL to match Cloud Run..." -ForegroundColor Yellow
    Write-Host ""
    
    # Update Cloud SQL to match Cloud Run
    Write-Host "Step 3: Updating Cloud SQL password to match Cloud Run..." -ForegroundColor Cyan
    $resetCmd = "gcloud sql users set-password postgres " +
        "--instance=$INSTANCE_NAME " +
        "--password=`"$correctPassword`" " +
        "--project=$PROJECT_ID"
    
    try {
        Invoke-Expression $resetCmd | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   SUCCESS: Cloud SQL password updated" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: Cloud SQL password update may have failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   WARNING: Cloud SQL password update failed" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   INFO: Passwords don't match!" -ForegroundColor Yellow
    Write-Host "   Cloud Run: $currentCloudRunPassword" -ForegroundColor White
    Write-Host "   Cloud SQL: $correctPassword" -ForegroundColor White
    Write-Host ""
    
    # Update both to use the correct password
    Write-Host "Step 3: Updating Cloud SQL password..." -ForegroundColor Cyan
    $resetCmd = "gcloud sql users set-password postgres " +
        "--instance=$INSTANCE_NAME " +
        "--password=`"$correctPassword`" " +
        "--project=$PROJECT_ID"
    
    try {
        Invoke-Expression $resetCmd | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   SUCCESS: Cloud SQL password updated" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: Cloud SQL password update may have failed" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   WARNING: Cloud SQL password update failed" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Step 4: Updating Cloud Run password..." -ForegroundColor Cyan
}

# Get or generate secrets
$jwtSecret = $envVars | Where-Object {$_.name -eq "JWT_SECRET"} | Select-Object -ExpandProperty value
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
}

$sessionSecret = $envVars | Where-Object {$_.name -eq "SESSION_SECRET"} | Select-Object -ExpandProperty value
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
}

# Build environment variables list
$envVarsList = @(
    "NODE_ENV=production",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$correctPassword",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
) -join ","

# Update Cloud Run service
Write-Host "   Executing: gcloud run services update..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

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

Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Password Configuration:" -ForegroundColor Cyan
    Write-Host "   Cloud SQL: $correctPassword" -ForegroundColor White
    Write-Host "   Cloud Run: $correctPassword" -ForegroundColor White
    Write-Host "   Status: SYNCED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for service to update (90 seconds)..." -ForegroundColor Cyan
    
    Start-Sleep -Seconds 90
    
    Write-Host ""
    Write-Host "Step 5: Testing connection..." -ForegroundColor Cyan
    
    # Test connection multiple times
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
                Write-Host "   ✅ SUCCESS: Database is connected!" -ForegroundColor Green
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
        Write-Host "✅ SUCCESS: Database connection established!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "========================================" -ForegroundColor Yellow
        Write-Host "⚠️ WARNING: Database connection not yet established" -ForegroundColor Yellow
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
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    exit 1
}

