# PowerShell script to deploy built image to Cloud Run
# This script should be run after build-and-deploy.bat completes

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying to Cloud Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/altayar-backend"

# Get latest image tag (use BUILD_ID from latest build)
Write-Host "Getting latest image tag..." -ForegroundColor Cyan
$buildId = gcloud builds list --limit=1 --format="value(id)" --sort-by=~createTime 2>$null

if (-not $buildId) {
    Write-Host "ERROR: No build found. Please run build-and-deploy.bat first." -ForegroundColor Red
    exit 1
}

$latestTag = $buildId

Write-Host "Using image: $IMAGE_NAME`:$latestTag" -ForegroundColor Green
Write-Host ""

# Deploy to Cloud Run with basic environment variables
Write-Host "Deploying to Cloud Run..." -ForegroundColor Cyan
Write-Host "This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

gcloud run deploy $SERVICE_NAME `
    --image "$IMAGE_NAME`:$latestTag" `
    --region $REGION `
    --platform managed `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --set-env-vars "NODE_ENV=production" `
    --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Check Cloud Run logs for errors" -ForegroundColor White
    Write-Host "2. Run: fix-database-connection-now.bat to set environment variables" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "SUCCESS: Deployment completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run: fix-database-connection-now.bat" -ForegroundColor White
Write-Host "   This will set database credentials and Cloud SQL connection" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Test the service:" -ForegroundColor White
Write-Host "   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor Gray
Write-Host ""

