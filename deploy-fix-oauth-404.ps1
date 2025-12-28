$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"

Write-Host "Deploying fix for OAuth 404 error..." -ForegroundColor Green

# Step 1: Set project
gcloud config set project $PROJECT_ID

# Step 2: Get service URL
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan

# Step 3: Generate secrets
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Step 4: Build env vars
$envVars = "NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=https://altayar-46d6f.web.app` https://altayar-46d6f.firebaseapp.com,BACKEND_URL=$SERVICE_URL"

# Step 5: Deploy from source (this will rebuild with the fix)
Write-Host "Deploying from source (this will take 3-5 minutes)..." -ForegroundColor Yellow
gcloud run deploy $SERVICE_NAME --source . --region $REGION --set-env-vars $envVars --add-cloudsql-instances $CONNECTION_NAME --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "Retrying without --add-cloudsql-instances..." -ForegroundColor Yellow
    gcloud run deploy $SERVICE_NAME --source . --region $REGION --set-env-vars $envVars --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project $PROJECT_ID
}

Write-Host "Waiting 30 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Step 6: Test
Write-Host "Testing OAuth config endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 15
    Write-Host "SUCCESS! OAuth config endpoint is working (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

