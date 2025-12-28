# Simple script to run migrations using gcloud run jobs execute with better error handling

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Migrations - Simple Method" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$JOB_NAME = "altayar-migrations"
$REGION = "us-central1"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Job Name: $JOB_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host ""

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Executing Cloud Run Job..." -ForegroundColor Cyan
Write-Host "   This will run migrations inside Cloud Run" -ForegroundColor Yellow
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Execute job
$executeCmd = "gcloud run jobs execute $JOB_NAME --region $REGION --wait"

Write-Host "Executing migrations..." -ForegroundColor Gray
Write-Host ""

Invoke-Expression $executeCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Migrations completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test register/login on your app" -ForegroundColor White
    Write-Host "2. Check health: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Migrations failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking logs..." -ForegroundColor Yellow
    
    # Get latest execution
    $executions = gcloud run jobs executions list --job $JOB_NAME --region $REGION --format="json" --limit=1 | ConvertFrom-Json
    if ($executions -and $executions.Count -gt 0) {
        $latestExecution = $executions[0]
        $executionName = $latestExecution.metadata.name
        
        Write-Host ""
        Write-Host "Latest execution: $executionName" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "View logs:" -ForegroundColor Cyan
        Write-Host "  gcloud run jobs executions logs read $executionName --job $JOB_NAME --region $REGION" -ForegroundColor White
        Write-Host ""
        Write-Host "View details:" -ForegroundColor Cyan
        Write-Host "  gcloud run jobs executions describe $executionName --region $REGION" -ForegroundColor White
    }
    
    exit 1
}

