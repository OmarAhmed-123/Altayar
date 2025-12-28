# PowerShell script to run database migrations on Cloud Run
# This script runs migrations inside Cloud Run container where Cloud SQL connection is already configured

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Migrations on Cloud Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/altayar-backend:latest"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host ""

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Checking Cloud Run service..." -ForegroundColor Cyan
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White

# Check Cloud SQL connection
$cloudSqlAnnotations = $serviceInfo.spec.template.metadata.annotations
$hasCloudSqlConnection = $cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances' -ne $null

if (-not $hasCloudSqlConnection) {
    Write-Host ""
    Write-Host "WARNING: Cloud SQL instance not linked to Cloud Run service" -ForegroundColor Yellow
    Write-Host "   Action: Run fix-all-database-issues.bat first" -ForegroundColor Yellow
    exit 1
}

Write-Host "   Cloud SQL Connection: $($cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances')" -ForegroundColor Green
Write-Host ""

# Get environment variables
$envVars = $serviceInfo.spec.template.spec.containers[0].env
$dbPassword = ($envVars | Where-Object { $_.name -eq "DB_PASSWORD" }).value

if (-not $dbPassword) {
    Write-Host "WARNING: DB_PASSWORD not found in Cloud Run service" -ForegroundColor Yellow
    Write-Host "   Action: Run fix-all-database-issues.bat to set environment variables" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 2: Creating migration job..." -ForegroundColor Cyan

# Create a Cloud Run job to run migrations
$jobName = "$SERVICE_NAME-migrations-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "   Job name: $jobName" -ForegroundColor White
Write-Host ""

# Get the image from the service
$image = $serviceInfo.spec.template.spec.containers[0].image

Write-Host "Step 3: Running migrations in Cloud Run job..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Create and execute Cloud Run job
$envVarsList = @()
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        $envVarsList += "$($envVar.name)=$($envVar.value)"
    } elseif ($envVar.valueFrom) {
        # Skip secret references for now
        continue
    }
}

$envVarsString = $envVarsList -join ","

# Create Cloud Run job
$createJobCmd = "gcloud run jobs create $jobName " +
    "--region $REGION " +
    "--image $image " +
    "--set-env-vars $envVarsString " +
    "--add-cloudsql-instances $($cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances') " +
    "--max-retries 1 " +
    "--task-timeout 600 " +
    "--quiet"

Write-Host "Creating job..." -ForegroundColor Gray
Invoke-Expression $createJobCmd | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create job" -ForegroundColor Red
    exit 1
}

# Execute the job with migration command
Write-Host "Executing migrations..." -ForegroundColor Gray
$executeJobCmd = "gcloud run jobs execute $jobName " +
    "--region $REGION " +
    "--wait " +
    "--command npm " +
    "--args run,migrate:latest"

Invoke-Expression $executeJobCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Migrations completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    
    # Clean up job
    Write-Host "Cleaning up job..." -ForegroundColor Gray
    gcloud run jobs delete $jobName --region $REGION --quiet | Out-Null
    
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test registration: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/register" -ForegroundColor White
    Write-Host "2. Check health: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Migrations failed" -ForegroundColor Red
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "   gcloud run jobs executions list --job $jobName --region $REGION" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""

