# PowerShell script to completely fix all database connection issues
# This script checks and fixes everything needed for database connection

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Database Connection Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"
$CLOUD_SQL_PUBLIC_IP = "34.58.123.127"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Checking Cloud SQL instance..." -ForegroundColor Cyan
$instanceInfo = gcloud sql instances describe altayar-db --format="json" 2>&1 | ConvertFrom-Json

if (-not $instanceInfo) {
    Write-Host "ERROR: Could not get Cloud SQL instance info" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Cloud SQL instance found" -ForegroundColor Green
Write-Host "   State: $($instanceInfo.state)" -ForegroundColor White

if ($instanceInfo.state -ne "RUNNABLE") {
    Write-Host "ERROR: Cloud SQL instance is not running" -ForegroundColor Red
    Write-Host "   Current state: $($instanceInfo.state)" -ForegroundColor Yellow
    Write-Host "   Please start the instance first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

Write-Host "Step 2: Checking Cloud Run service..." -ForegroundColor Cyan
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

$serviceAccount = $serviceInfo.spec.template.spec.serviceAccountName
if (-not $serviceAccount) {
    $serviceAccount = "$PROJECT_ID@appspot.gserviceaccount.com"
}

Write-Host "SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   Service Account: $serviceAccount" -ForegroundColor White

# Check Cloud SQL connection
$cloudSqlAnnotations = $serviceInfo.spec.template.metadata.annotations
$hasCloudSqlConnection = $cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances' -ne $null

if ($hasCloudSqlConnection) {
    Write-Host "   Cloud SQL Connection: $($cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances')" -ForegroundColor Green
} else {
    Write-Host "   Cloud SQL Connection: NOT LINKED" -ForegroundColor Yellow
}

Write-Host ""

Write-Host "Step 3: Checking IAM permissions..." -ForegroundColor Cyan
$iamCheck = gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="json" --filter="bindings.members:$serviceAccount AND bindings.role:roles/cloudsql.client" 2>&1 | ConvertFrom-Json

if (-not $iamCheck -or $iamCheck.bindings.Count -eq 0) {
    Write-Host "WARNING: Cloud SQL Client role not granted" -ForegroundColor Yellow
    Write-Host "Granting Cloud SQL Client role..." -ForegroundColor Cyan
    
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$serviceAccount" `
        --role="roles/cloudsql.client" `
        --condition=None | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: Cloud SQL Client role granted" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to grant role" -ForegroundColor Red
    }
} else {
    Write-Host "SUCCESS: Cloud SQL Client role is granted" -ForegroundColor Green
}

Write-Host ""

Write-Host "Step 4: Checking environment variables..." -ForegroundColor Cyan
$envVars = $serviceInfo.spec.template.spec.containers[0].env
$currentDbHost = ($envVars | Where-Object { $_.name -eq "DB_HOST" }).value
$currentDbPassword = ($envVars | Where-Object { $_.name -eq "DB_PASSWORD" }).value

if ($currentDbHost) {
    Write-Host "   Current DB_HOST: $currentDbHost" -ForegroundColor White
} else {
    Write-Host "   DB_HOST: NOT SET" -ForegroundColor Yellow
}

if ($currentDbPassword) {
    Write-Host "   DB_PASSWORD: SET" -ForegroundColor Green
} else {
    Write-Host "   DB_PASSWORD: NOT SET" -ForegroundColor Yellow
}

Write-Host ""

# Ask user if they want to update
Write-Host "Step 5: Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host ""

# Get database password
if (-not $currentDbPassword) {
    $dbPassword = Read-Host "Enter Cloud SQL database password" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
} else {
    Write-Host "Using existing DB_PASSWORD from service" -ForegroundColor Gray
    $dbPasswordPlain = $currentDbPassword
}

# Get or generate JWT secret
$currentJwtSecret = ($envVars | Where-Object { $_.name -eq "JWT_SECRET" }).value
if (-not $currentJwtSecret) {
    $jwtSecret = Read-Host "Enter JWT_SECRET (or press Enter to generate new one)"
    if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
        $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        Write-Host "Generated new JWT_SECRET" -ForegroundColor Green
    }
} else {
    $jwtSecret = $currentJwtSecret
    Write-Host "Using existing JWT_SECRET" -ForegroundColor Gray
}

# Get or generate Session secret
$currentSessionSecret = ($envVars | Where-Object { $_.name -eq "SESSION_SECRET" }).value
if (-not $currentSessionSecret) {
    $sessionSecret = Read-Host "Enter SESSION_SECRET (or press Enter to generate new one)"
    if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
        $sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        Write-Host "Generated new SESSION_SECRET" -ForegroundColor Green
    }
} else {
    $sessionSecret = $currentSessionSecret
    Write-Host "Using existing SESSION_SECRET" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Choose connection method:" -ForegroundColor Cyan
Write-Host "   1. Cloud SQL Proxy (Socket) - Recommended" -ForegroundColor White
Write-Host "   2. Public IP with SSL - Alternative" -ForegroundColor White
Write-Host ""

# If Cloud SQL is already linked, suggest socket method
if ($hasCloudSqlConnection) {
    Write-Host "   Note: Cloud SQL instance is already linked, socket method is recommended" -ForegroundColor Gray
    $connectionMethod = Read-Host "Choose (1 or 2, default: 1)"
} else {
    $connectionMethod = Read-Host "Choose (1 or 2, default: 1)"
}

if ([string]::IsNullOrWhiteSpace($connectionMethod)) {
    $connectionMethod = "1"
}

if ($connectionMethod -eq "2") {
    $dbHost = $CLOUD_SQL_PUBLIC_IP
    Write-Host "Using Public IP connection: $dbHost" -ForegroundColor Yellow
} else {
    $dbHost = "/cloudsql/$CONNECTION_NAME"
    Write-Host "Using Cloud SQL Proxy (socket) connection: $dbHost" -ForegroundColor Yellow
}

# Update Cloud Run service
# CRITICAL: PORT is automatically set by Cloud Run - don't include it
$envVarsList = @(
    "NODE_ENV=production",
    "DB_HOST=$dbHost",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$dbPasswordPlain",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
) -join ","

$gcloudCmd = "gcloud run services update $SERVICE_NAME " +
    "--region $REGION " +
    "--project $PROJECT_ID " +
    "--update-env-vars $envVarsList " +
    "--timeout 300 " +
    "--cpu 2 " +
    "--memory 2Gi " +
    "--max-instances 10 " +
    "--min-instances 1 " +
    "--port 8080"

# Add Cloud SQL instance connection if using socket method
if ($connectionMethod -eq "1" -and -not $hasCloudSqlConnection) {
    $gcloudCmd += " --add-cloudsql-instances $CONNECTION_NAME"
}

$gcloudCmd += " --quiet"

Write-Host ""
Write-Host "Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

Invoke-Expression $gcloudCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for service to update (60 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 60
    
    Write-Host ""
    Write-Host "Testing service..." -ForegroundColor Cyan
    $healthUrl = "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health"
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 30 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "SUCCESS: Service is responding!" -ForegroundColor Green
            Write-Host "   Status: $($healthData.status)" -ForegroundColor White
            Write-Host "   Database: $($healthData.database.status)" -ForegroundColor White
            
            if ($healthData.database.status -eq "connected") {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "SUCCESS: Database is connected!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host ""
                Write-Host "WARNING: Database is still not connected" -ForegroundColor Yellow
                Write-Host "   This may take a few more minutes" -ForegroundColor Yellow
                Write-Host "   Check logs: view-cloud-run-logs.bat" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "WARNING: Could not verify service health" -ForegroundColor Yellow
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "2. Check logs: view-cloud-run-logs.bat" -ForegroundColor White
    Write-Host "3. Verify config: check-cloud-run-config.bat" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update Cloud Run service" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Cloud SQL instance is running" -ForegroundColor White
    Write-Host "2. Service account has Cloud SQL Client role" -ForegroundColor White
    Write-Host "3. Try running this script again" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

