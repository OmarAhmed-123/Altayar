# PowerShell script to manually set PORT in Cloud Run (if needed)
# NOTE: Cloud Run usually sets PORT automatically to 8080
# This script is only needed if you want to ensure PORT is explicitly set

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting PORT in Cloud Run (Manual)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Cloud Run usually sets PORT automatically to 8080" -ForegroundColor Yellow
Write-Host "[INFO] This script is only needed if you want to set it explicitly" -ForegroundColor Yellow
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$PORT = "8080"

# Set project
gcloud config set project $PROJECT_ID 2>&1 | Out-Null

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host "   PORT: $PORT (Cloud Run default)" -ForegroundColor White
Write-Host ""

Write-Host "[INFO] Cloud Run sets PORT automatically" -ForegroundColor Green
Write-Host "[INFO] Your server.js uses: process.env.PORT || 5000" -ForegroundColor Green
Write-Host "[INFO] This will work correctly - Cloud Run sets PORT=8080 automatically" -ForegroundColor Green
Write-Host ""
Write-Host "[NOTE] You don't need to set PORT manually" -ForegroundColor Yellow
Write-Host "[NOTE] If you still want to set it, use Cloud Console:" -ForegroundColor Yellow
Write-Host "   1. Go to: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor White
Write-Host "   2. Click on service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   3. Edit & Deploy New Revision" -ForegroundColor White
Write-Host "   4. Container > Port: 8080" -ForegroundColor White
Write-Host ""

