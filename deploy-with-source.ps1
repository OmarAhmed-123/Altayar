# Alternative deployment using --source (no Docker needed)
# This uses Cloud Build directly

$ErrorActionPreference = "Stop"

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayarback"
$REGION = "us-central1"
$SERVICE_NAME = "altayar-backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Altayar Backend Deployment (Source)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check billing first
Write-Host "Checking billing status..." -ForegroundColor Yellow
$billingCheck = & $GCLOUD_CMD billing projects describe $PROJECT_ID 2>&1
if ($LASTEXITCODE -ne 0 -or $billingCheck -match "NOT_FOUND") {
    Write-Host "ERROR: Billing account required!" -ForegroundColor Red
    Write-Host "Please enable billing: https://console.cloud.google.com/billing?project=$PROJECT_ID" -ForegroundColor Yellow
    Write-Host "See ENABLE_BILLING.md for instructions" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Billing enabled" -ForegroundColor Green
Write-Host ""

# Set project
& $GCLOUD_CMD config set project $PROJECT_ID

# Enable APIs
Write-Host "Enabling APIs..." -ForegroundColor Yellow
& $GCLOUD_CMD services enable run.googleapis.com --quiet
& $GCLOUD_CMD services enable cloudbuild.googleapis.com --quiet
Write-Host "OK: APIs enabled" -ForegroundColor Green
Write-Host ""

# Deploy from source
Write-Host "Deploying from source..." -ForegroundColor Yellow
Write-Host "This will build and deploy automatically..." -ForegroundColor Cyan
Write-Host ""

& $GCLOUD_CMD run deploy $SERVICE_NAME `
    --source . `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}

# Get URL
$SERVICE_URL = & $GCLOUD_CMD run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "API URL: $SERVICE_URL/api" -ForegroundColor Cyan
Write-Host ""

