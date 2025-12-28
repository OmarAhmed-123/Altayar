$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"
$SERVICE_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYING NOW - All Fixes Applied" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "[1/6] Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID 2>&1 | Out-Null
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 2: Generate secrets
Write-Host "[2/6] Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 3: Build env vars (FIXED: No PORT, proper FRONTEND_URL format)
Write-Host "[3/6] Building environment variables..." -ForegroundColor Yellow
$frontendUrls = "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
$envVars = "NODE_ENV=production,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=$frontendUrls,BACKEND_URL=$SERVICE_URL"
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "[4/6] Deploying to Cloud Run (3-5 minutes)..." -ForegroundColor Yellow
Write-Host "Please wait..." -ForegroundColor Gray

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

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    Write-Host $deployResult -ForegroundColor Red
    exit 1
}

Write-Host "OK: Deployment successful!" -ForegroundColor Green
Write-Host ""

# Step 5: Wait
Write-Host "[5/6] Waiting 50 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 50
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 6: Test
Write-Host "[6/6] Testing endpoints..." -ForegroundColor Yellow
try {
    $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Write-Host "SUCCESS: OAuth config - Status $($oauth.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($oauth.Content)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: OAuth config failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service: $SERVICE_URL" -ForegroundColor White
Write-Host ""

