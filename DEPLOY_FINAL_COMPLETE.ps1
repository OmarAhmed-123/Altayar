# ========================================
# FINAL COMPLETE DEPLOYMENT - All Issues Fixed
# ========================================

$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:altayar-db"
$SERVICE_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FINAL COMPLETE DEPLOYMENT" -ForegroundColor Green
Write-Host "All Issues Fixed - Using YAML File" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Set project
Write-Host "[1/7] Setting project..." -ForegroundColor Yellow
gcloud config set project $PROJECT_ID 2>&1 | Out-Null
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 2: Generate secrets
Write-Host "[2/7] Generating secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 3: Create env vars YAML file
Write-Host "[3/7] Creating environment variables file..." -ForegroundColor Yellow
$envVarsContent = @"
NODE_ENV: production
DB_HOST: /cloudsql/${CONNECTION_NAME}
DB_PORT: "5432"
DB_USER: postgres
DB_PASSWORD: "AAIOH2040%%"
DB_NAME: tourist_app_db
JWT_SECRET: "$JWT_SECRET"
SESSION_SECRET: "$SESSION_SECRET"
FRONTEND_URL: "https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
BACKEND_URL: "$SERVICE_URL"
"@

$envVarsContent | Out-File -FilePath "env-vars-deploy.yaml" -Encoding UTF8
Write-Host "OK: File created" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy
Write-Host "[4/7] Deploying to Cloud Run (3-5 minutes)..." -ForegroundColor Yellow
Write-Host "Please wait..." -ForegroundColor Gray

$deployResult = gcloud run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --env-vars-file env-vars-deploy.yaml `
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
Write-Host "[5/7] Waiting 60 seconds for service..." -ForegroundColor Yellow
Start-Sleep -Seconds 60
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# Step 6: Test Health
Write-Host "[6/7] Testing /api/health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
    Write-Host "OK: Status $($health.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "WARNING: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Test OAuth Config
Write-Host "[7/7] Testing /api/oauth/config..." -ForegroundColor Yellow
$maxRetries = 5
$retryCount = 0
$success = $false

while ($retryCount -lt $maxRetries -and -not $success) {
    $retryCount++
    Write-Host "Attempt $retryCount/$maxRetries..." -ForegroundColor Gray
    try {
        $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
        if ($oauth.StatusCode -eq 200) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host "SUCCESS! OAuth Config is Working!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Status Code: $($oauth.StatusCode)" -ForegroundColor Green
            Write-Host "Response:" -ForegroundColor Yellow
            Write-Host $oauth.Content -ForegroundColor White
            Write-Host ""
            $success = $true
        }
    } catch {
        Write-Host "Attempt $retryCount failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($retryCount -lt $maxRetries) {
            Write-Host "Waiting 15 seconds before retry..." -ForegroundColor Gray
            Start-Sleep -Seconds 15
        }
    }
}

if (-not $success) {
    Write-Host ""
    Write-Host "ERROR: OAuth config still returning 404" -ForegroundColor Red
    Write-Host "Checking if route is in server.js..." -ForegroundColor Yellow
    
    # Check if route exists in code
    $routeExists = Select-String -Path "server.js" -Pattern "app\.get\(['\"]\/api\/oauth\/config" -Quiet
    if ($routeExists) {
        Write-Host "Route exists in code. The deployment may not have included the latest changes." -ForegroundColor Yellow
        Write-Host "Please verify the code was deployed correctly." -ForegroundColor Yellow
    } else {
        Write-Host "Route NOT found in server.js! This is the problem." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service: $SERVICE_URL" -ForegroundColor White
Write-Host "OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""

