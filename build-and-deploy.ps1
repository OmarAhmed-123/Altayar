# PowerShell script to build and deploy to Cloud Run
# This script builds the Docker image and deploys it to Cloud Run

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building and Deploying to Cloud Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>$null
} catch {
    Write-Host "ERROR: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host "Setting project..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to set project" -ForegroundColor Red
    exit 1
}

# Build and submit with retry logic and increased timeout
Write-Host ""
Write-Host "Building and submitting..." -ForegroundColor Cyan
Write-Host "   This may take 5-10 minutes..." -ForegroundColor Yellow
Write-Host "   Using increased timeout and retry logic..." -ForegroundColor Gray
Write-Host ""

# CRITICAL FIX: Use simple synchronous build with retry logic
# This is more reliable than async build for most cases
$maxRetries = 3
$retryCount = 0
$buildSuccess = $false

while ($retryCount -lt $maxRetries -and -not $buildSuccess) {
    $retryCount++
    
    if ($retryCount -gt 1) {
        Write-Host ""
        Write-Host "Retry attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
        Write-Host "Waiting 15 seconds before retry..." -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
    
    Write-Host "Starting build (attempt $retryCount)..." -ForegroundColor Cyan
    Write-Host "   Uploading files and building image..." -ForegroundColor Gray
    Write-Host "   (This may take 5-10 minutes, please be patient)" -ForegroundColor Gray
    Write-Host ""
    
    try {
        # CRITICAL: Use synchronous build with increased timeout
        # Set environment variable for increased HTTP timeout (10 minutes)
        $env:GCLOUD_HTTP_TIMEOUT = "600"
        
        # Submit build synchronously
        # This will wait for completion but with increased timeout
        gcloud builds submit --config cloudbuild.yaml
        
        # Check exit code
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "   Build completed successfully!" -ForegroundColor Green
            $buildSuccess = $true
        } else {
            Write-Host ""
            Write-Host "   Build failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            
            if ($retryCount -lt $maxRetries) {
                Write-Host "   Will retry..." -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host ""
        Write-Host "   Error during build: $_" -ForegroundColor Red
        
        if ($retryCount -lt $maxRetries) {
            Write-Host "   Will retry..." -ForegroundColor Yellow
        }
    }
}

if ($buildSuccess) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Build completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Deploy to Cloud Run:" -ForegroundColor White
    Write-Host "   deploy-to-cloud-run.bat" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Set environment variables:" -ForegroundColor White
    Write-Host "   fix-database-connection-now.bat" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Test the service:" -ForegroundColor White
    Write-Host "   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "ERROR: Build failed after $maxRetries attempts" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor White
    Write-Host "2. Try again later (network may be slow)" -ForegroundColor White
    Write-Host "3. Check Google Cloud Build quotas" -ForegroundColor White
    Write-Host "4. Try building with smaller files (exclude node_modules if possible)" -ForegroundColor White
    Write-Host ""
    Write-Host "To view build logs:" -ForegroundColor Cyan
    Write-Host "   gcloud builds list --limit=5" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""

