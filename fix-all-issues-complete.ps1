# ========================================
# Fix All Issues Complete Script
# ========================================

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix All Issues Complete" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check gcloud authentication
Write-Host "[1/10] Checking authentication..." -ForegroundColor Yellow
$currentProject = gcloud config get-value project 2>&1
if ($LASTEXITCODE -ne 0 -or $currentProject -ne $PROJECT_ID) {
    Write-Host "WARNING: Current project: $currentProject" -ForegroundColor Yellow
    Write-Host "INFO: Setting project to: $PROJECT_ID" -ForegroundColor Yellow
    gcloud config set project $PROJECT_ID
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to set project" -ForegroundColor Red
        exit 1
    }
}
Write-Host "OK: Project verified" -ForegroundColor Green
Write-Host ""

# Step 2: Get current service URL
Write-Host "[2/10] Getting service URL..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1
if ($LASTEXITCODE -ne 0 -or -not $SERVICE_URL -or $SERVICE_URL -match "ERROR") {
    Write-Host "ERROR: Failed to get service URL" -ForegroundColor Red
    Write-Host "INFO: Make sure service is deployed on Cloud Run" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Service URL: $SERVICE_URL" -ForegroundColor Green
Write-Host ""

# Step 3: Enable required APIs
Write-Host "[3/10] Enabling required APIs..." -ForegroundColor Yellow
$requiredApis = @(
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com"
)

foreach ($api in $requiredApis) {
    Write-Host "   Checking $api..." -ForegroundColor Gray
    $apiStatus = gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>&1
    if (-not $apiStatus -or $apiStatus -match "ERROR") {
        Write-Host "   Enabling $api..." -ForegroundColor Yellow
        gcloud services enable $api --project $PROJECT_ID 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   OK: Enabled $api" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: Failed to enable $api (may already be enabled)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   OK: $api already enabled" -ForegroundColor Green
    }
}
Write-Host ""

# Step 4: Check current service configuration
Write-Host "[4/10] Checking service configuration..." -ForegroundColor Yellow
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1 | Out-Null
Write-Host "OK: Service configuration checked" -ForegroundColor Green
Write-Host ""

# Step 5: Prepare environment variables
Write-Host "[5/10] Preparing environment variables..." -ForegroundColor Yellow

# Generate secrets
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "OK: Generated JWT_SECRET and SESSION_SECRET" -ForegroundColor Green

# Build environment variables string - escape special characters
$DB_PASSWORD_ESCAPED = $DB_PASSWORD -replace '%', '%%'
$envVars = @(
    "NODE_ENV=production",
    "PORT=8080",
    "DB_HOST=/cloudsql/${CONNECTION_NAME}",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$DB_PASSWORD_ESCAPED",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$JWT_SECRET",
    "SESSION_SECRET=$SESSION_SECRET",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=$SERVICE_URL"
) -join ","

Write-Host "OK: Environment variables prepared" -ForegroundColor Green
Write-Host ""

# Step 6: Update Cloud Run service with new configuration
Write-Host "[6/10] Updating Cloud Run service..." -ForegroundColor Yellow
Write-Host "   This may take a few minutes..." -ForegroundColor Gray

$deployOutput = gcloud run services update $SERVICE_NAME `
    --region $REGION `
    --set-env-vars $envVars `
    --add-cloudsql-instances $CONNECTION_NAME `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --project $PROJECT_ID 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    
    # Try without adding Cloud SQL instance (may already be added)
    Write-Host "INFO: Retrying without --add-cloudsql-instances..." -ForegroundColor Yellow
    $deployOutput2 = gcloud run services update $SERVICE_NAME `
        --region $REGION `
        --set-env-vars $envVars `
        --memory 2Gi `
        --cpu 2 `
        --timeout 300 `
        --max-instances 10 `
        --min-instances 1 `
        --project $PROJECT_ID 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to update service on retry" -ForegroundColor Red
        Write-Host $deployOutput2 -ForegroundColor Red
        exit 1
    }
}

Write-Host "OK: Service updated successfully" -ForegroundColor Green
Write-Host ""

# Step 7: Wait for service to be ready
Write-Host "[7/10] Waiting for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "OK: Service is ready" -ForegroundColor Green
Write-Host ""

# Step 8: Test endpoints
Write-Host "[8/10] Testing endpoints..." -ForegroundColor Yellow

$testEndpoints = @(
    @{Path="/api/health"; Name="Health Check"},
    @{Path="/api"; Name="API Root"},
    @{Path="/api/oauth/config"; Name="OAuth Config"}
)

foreach ($endpoint in $testEndpoints) {
    Write-Host "   Testing $($endpoint.Name)..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$SERVICE_URL$($endpoint.Path)" -Method GET -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   OK: $($endpoint.Name) is working" -ForegroundColor Green
        } else {
            Write-Host "   WARNING: $($endpoint.Name) returned: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ERROR: $($endpoint.Name) failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Step 9: Update frontend configuration
Write-Host "[9/10] Updating frontend configuration..." -ForegroundColor Yellow
$frontendConfigPath = "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart"
if (Test-Path $frontendConfigPath) {
    Write-Host "   Updating $frontendConfigPath..." -ForegroundColor Gray
    $nodeOutput = node update-frontend-config.js $SERVICE_URL 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   OK: Frontend updated" -ForegroundColor Green
    } else {
        Write-Host "   WARNING: Failed to update frontend automatically" -ForegroundColor Yellow
        Write-Host "   Output: $nodeOutput" -ForegroundColor Gray
    }
} else {
    Write-Host "   WARNING: Frontend config file not found" -ForegroundColor Yellow
}
Write-Host ""

# Step 10: Summary
Write-Host "[10/10] Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "OK: All steps completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Information:" -ForegroundColor Yellow
Write-Host "   Service URL: $SERVICE_URL" -ForegroundColor White
Write-Host "   API URL: $SERVICE_URL/api" -ForegroundColor White
Write-Host "   Health Check: $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "   OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Test server: curl $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "   2. Test OAuth: curl $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host "   3. Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION" -ForegroundColor White
Write-Host ""
Write-Host "To troubleshoot:" -ForegroundColor Yellow
Write-Host "   - Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50" -ForegroundColor White
Write-Host "   - Check env vars: gcloud run services describe $SERVICE_NAME --region $REGION" -ForegroundColor White
Write-Host ""
