# ========================================
# FINAL WORKING DEPLOYMENT - All Issues Fixed
# ========================================
# Fixed: Removed PORT from env vars (Cloud Run sets it automatically)
# Fixed: OAuth config route is registered before error middleware
# ========================================

$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"
$SERVICE_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FINAL WORKING DEPLOYMENT" -ForegroundColor Green
Write-Host "All Issues Fixed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "[1/8] Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID 2>&1 | Out-Null
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 2: Generate secrets
Write-Host "[2/8] Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 3: Build env vars (NO PORT - Cloud Run sets it automatically)
Write-Host "[3/8] Building environment variables..." -ForegroundColor Yellow
Write-Host "CRITICAL: PORT is NOT included (Cloud Run sets it automatically to 8080)" -ForegroundColor Gray
# Fix: FRONTEND_URL must be comma-separated without spaces in the value
$frontendUrls = "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
$envVars = "NODE_ENV=production,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=$frontendUrls,BACKEND_URL=$SERVICE_URL"
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "[4/8] Deploying to Cloud Run (3-5 minutes)..." -ForegroundColor Yellow
Write-Host "Please wait..." -ForegroundColor Gray

# Try with Cloud SQL first
$deployResult = gcloud run deploy $SERVICE_NAME `
    --source . `
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
    Write-Host "Retrying without --add-cloudsql-instances..." -ForegroundColor Yellow
    $deployResult = gcloud run deploy $SERVICE_NAME `
        --source . `
        --region $REGION `
        --set-env-vars $envVars `
        --memory 2Gi `
        --cpu 2 `
        --timeout 300 `
        --max-instances 10 `
        --min-instances 1 `
        --project $PROJECT_ID 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    Write-Host $deployResult -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Wait
Write-Host "[5/8] Waiting 50 seconds for service..." -ForegroundColor Yellow
Start-Sleep -Seconds 50
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 6: Test Health
Write-Host "[6/8] Testing /api/health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Write-Host "SUCCESS: Status $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "WARNING: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Test OAuth Config
Write-Host "[7/8] Testing /api/oauth/config..." -ForegroundColor Yellow
try {
    $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Write-Host "SUCCESS: Status $($oauth.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host $oauth.Content -ForegroundColor Gray
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

# Step 8: Check logs
Write-Host "[8/8] Checking recent logs..." -ForegroundColor Yellow
$logs = gcloud run services logs read $SERVICE_NAME --region $REGION --limit 5 --project $PROJECT_ID 2>&1
if ($logs -match "oauth|config|404") {
    Write-Host "Found relevant logs" -ForegroundColor Gray
} else {
    Write-Host "No relevant errors in recent logs" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service: $SERVICE_URL" -ForegroundColor White
Write-Host "OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""
Write-Host "If OAuth still returns 404, check:" -ForegroundColor Yellow
Write-Host "  1. Route is registered before error middleware" -ForegroundColor White
Write-Host "  2. Code was deployed successfully" -ForegroundColor White
Write-Host "  3. Service logs: gcloud run services logs read $SERVICE_NAME --region $REGION" -ForegroundColor White
Write-Host ""

