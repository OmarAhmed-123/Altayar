$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"

Write-Host "Starting fix process..." -ForegroundColor Green

# Step 1: Set project
Write-Host "[1] Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID

# Step 2: Get service URL
Write-Host "[2] Getting service URL..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1
if ($SERVICE_URL -match "ERROR" -or -not $SERVICE_URL) {
    Write-Host "ERROR: Could not get service URL" -ForegroundColor Red
    exit 1
}
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Green

# Step 3: Enable APIs
Write-Host "[3] Enabling APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com --project $PROJECT_ID 2>&1 | Out-Null
gcloud services enable sqladmin.googleapis.com --project $PROJECT_ID 2>&1 | Out-Null
gcloud services enable cloudbuild.googleapis.com --project $PROJECT_ID 2>&1 | Out-Null
gcloud services enable containerregistry.googleapis.com --project $PROJECT_ID 2>&1 | Out-Null

# Step 4: Generate secrets
Write-Host "[4] Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Step 5: Build env vars
Write-Host "[5] Building environment variables..." -ForegroundColor Yellow
$envVars = "NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=https://altayar-46d6f.web.app` https://altayar-46d6f.firebaseapp.com,BACKEND_URL=$SERVICE_URL"

# Step 6: Update service
Write-Host "[6] Updating Cloud Run service (this may take 2-3 minutes)..." -ForegroundColor Yellow
$result = gcloud run services update $SERVICE_NAME --region $REGION --set-env-vars $envVars --add-cloudsql-instances $CONNECTION_NAME --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project $PROJECT_ID 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Retrying without --add-cloudsql-instances..." -ForegroundColor Yellow
    $result = gcloud run services update $SERVICE_NAME --region $REGION --set-env-vars $envVars --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project $PROJECT_ID 2>&1
}

Write-Host "[7] Waiting 30 seconds for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 8: Test endpoints
Write-Host "[8] Testing endpoints..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 10
    Write-Host "Health Check: OK (Status: $($health.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Health Check: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 10
    Write-Host "OAuth Config: OK (Status: $($oauth.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "OAuth Config: FAILED - $($_.Exception.Message)" -ForegroundColor Red
}

# Step 9: Update frontend
Write-Host "[9] Updating frontend..." -ForegroundColor Yellow
if (Test-Path "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart") {
    node update-frontend-config.js $SERVICE_URL 2>&1 | Out-Null
    Write-Host "Frontend updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor White
Write-Host "API URL: $SERVICE_URL/api" -ForegroundColor White
Write-Host "Health: $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "OAuth: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""

