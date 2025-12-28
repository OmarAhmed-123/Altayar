$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete Deployment - All Fixes Applied" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "[1/7] Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID | Out-Null
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 2: Generate secrets
Write-Host "[2/7] Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 3: Build env vars
Write-Host "[3/7] Building environment variables..." -ForegroundColor Yellow
$envVars = "NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=https://altayar-46d6f.web.app` https://altayar-46d6f.firebaseapp.com,BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "[4/7] Deploying to Cloud Run (3-5 minutes)..." -ForegroundColor Yellow
$deployCmd = "gcloud run deploy $SERVICE_NAME --source . --region $REGION --set-env-vars `"$envVars`" --add-cloudsql-instances $CONNECTION_NAME --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project $PROJECT_ID"
$result = Invoke-Expression $deployCmd 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Retrying without --add-cloudsql-instances..." -ForegroundColor Yellow
    $deployCmd = "gcloud run deploy $SERVICE_NAME --source . --region $REGION --set-env-vars `"$envVars`" --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project $PROJECT_ID"
    $result = Invoke-Expression $deployCmd 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Deployment successful" -ForegroundColor Green
} else {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
}
Write-Host ""

# Step 5: Wait
Write-Host "[5/7] Waiting 40 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 40
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 6: Test health
Write-Host "[6/7] Testing /api/health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -UseBasicParsing -TimeoutSec 15
    Write-Host "OK: Status $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "WARNING: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Test OAuth
Write-Host "[7/7] Testing /api/oauth/config..." -ForegroundColor Yellow
try {
    $oauth = Invoke-WebRequest -Uri "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/oauth/config" -UseBasicParsing -TimeoutSec 15
    Write-Host "SUCCESS: Status $($oauth.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($oauth.Content)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service: https://altayar-backend-kuwjte4rda-uc.a.run.app" -ForegroundColor White
Write-Host ""

