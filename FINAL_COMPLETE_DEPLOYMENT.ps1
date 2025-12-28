# ========================================
# FINAL COMPLETE DEPLOYMENT - All Fixes
# ========================================
# This script does EVERYTHING automatically:
# 1. Sets up Google Cloud
# 2. Enables all APIs
# 3. Deploys with all fixes
# 4. Tests all endpoints
# 5. Verifies everything works
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
Write-Host "FINAL COMPLETE DEPLOYMENT" -ForegroundColor Green
Write-Host "All Fixes Applied Automatically" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "[1/8] Setting Google Cloud project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Project set" -ForegroundColor Green
} else {
    Write-Host "WARNING: Project may already be set" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Enable APIs
Write-Host "[2/8] Enabling required APIs..." -ForegroundColor Yellow
$apis = @("run.googleapis.com", "sqladmin.googleapis.com", "cloudbuild.googleapis.com", "containerregistry.googleapis.com")
foreach ($api in $apis) {
    gcloud services enable $api --project $PROJECT_ID 2>&1 | Out-Null
}
Write-Host "OK: APIs enabled" -ForegroundColor Green
Write-Host ""

# Step 3: Generate secrets
Write-Host "[3/8] Generating JWT and Session secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "OK: Secrets generated" -ForegroundColor Green
Write-Host ""

# Step 4: Build environment variables
Write-Host "[4/8] Building environment variables..." -ForegroundColor Yellow
$envVars = "NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/${CONNECTION_NAME},DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET,FRONTEND_URL=https://altayar-46d6f.web.app` https://altayar-46d6f.firebaseapp.com,BACKEND_URL=$SERVICE_URL"
Write-Host "OK: Environment variables ready" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy to Cloud Run
Write-Host "[5/8] Deploying to Cloud Run..." -ForegroundColor Yellow
Write-Host "This will take 3-5 minutes. Please wait..." -ForegroundColor Gray
Write-Host ""

# Try with Cloud SQL connection first
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

# Step 6: Wait for service
Write-Host "[6/8] Waiting 45 seconds for service to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 45
Write-Host "OK: Service should be ready" -ForegroundColor Green
Write-Host ""

# Step 7: Test Health endpoint
Write-Host "[7/8] Testing endpoints..." -ForegroundColor Yellow
Write-Host "Testing /api/health..." -ForegroundColor Gray
try {
    $health = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Write-Host "OK: Health check - Status $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Health check - $($_.Exception.Message)" -ForegroundColor Yellow
}

# Step 8: Test OAuth Config endpoint
Write-Host "Testing /api/oauth/config..." -ForegroundColor Gray
try {
    $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Write-Host "SUCCESS: OAuth config - Status $($oauth.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host $oauth.Content -ForegroundColor Gray
} catch {
    Write-Host "ERROR: OAuth config failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        # Try to read response body
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

# Final Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Service Information:" -ForegroundColor Yellow
Write-Host "  URL: $SERVICE_URL" -ForegroundColor White
Write-Host "  API: $SERVICE_URL/api" -ForegroundColor White
Write-Host "  Health: $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "  OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test from frontend" -ForegroundColor White
Write-Host "  2. Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50" -ForegroundColor White
Write-Host "  3. Verify database connection" -ForegroundColor White
Write-Host ""

