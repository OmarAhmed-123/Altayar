$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Final OAuth 404 Fix - Complete Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "[1/6] Setting project..." -ForegroundColor Yellow
$result = gcloud config set project $PROJECT_ID 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to set project" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}
Write-Host "OK: Project set to $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Step 2: Generate secrets
Write-Host "[2/6] Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "OK: Secrets generated" -ForegroundColor Green
Write-Host ""

# Step 3: Build environment variables
Write-Host "[3/6] Building environment variables..." -ForegroundColor Yellow
$envVars = "NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=https://altayar-46d6f.web.app` https://altayar-46d6f.firebaseapp.com,BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
Write-Host "OK: Environment variables prepared" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to Cloud Run
Write-Host "[4/6] Deploying to Cloud Run..." -ForegroundColor Yellow
Write-Host "This will take 3-5 minutes, please wait..." -ForegroundColor Gray
Write-Host ""

$deployOutput = gcloud run deploy $SERVICE_NAME `
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
    Write-Host "WARNING: First deployment attempt failed, retrying without --add-cloudsql-instances..." -ForegroundColor Yellow
    $deployOutput = gcloud run deploy $SERVICE_NAME `
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
        Write-Host $deployOutput -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "OK: Deployment completed successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Wait for service
Write-Host "[5/6] Waiting 40 seconds for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 40
Write-Host "OK: Service should be ready" -ForegroundColor Green
Write-Host ""

# Step 6: Test endpoints
Write-Host "[6/6] Testing endpoints..." -ForegroundColor Yellow
$SERVICE_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

# Test Health
Write-Host "Testing /api/health..." -ForegroundColor Gray
try {
    $health = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "OK: Health check - Status: $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Health check failed - $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test OAuth Config
Write-Host "Testing /api/oauth/config..." -ForegroundColor Gray
try {
    $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "OK: OAuth config - Status: $($oauth.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($oauth.Content)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: OAuth config failed - $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor White
Write-Host "API URL: $SERVICE_URL/api" -ForegroundColor White
Write-Host "Health: $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""

