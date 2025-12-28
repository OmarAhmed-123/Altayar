# PowerShell script to run database migrations using Cloud Run Job
# This runs migrations inside Cloud Run where Cloud SQL connection is already configured
# Uses provided password directly

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Migrations via Cloud Run Job" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$JOB_NAME = "altayar-migrations"
$REGION = "us-central1"
$CLOUD_SQL_INSTANCE = "altayar-46d6f:us-central1:altayar-db"
$DB_PASSWORD = "AAIOH2040%%"  # Direct password

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Job Name: $JOB_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host ""

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Getting Cloud Run service configuration..." -ForegroundColor Cyan

# Get service configuration to extract environment variables and image
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White

# Get the image from the service (use the same image as the service)
$IMAGE_NAME = $serviceInfo.spec.template.spec.containers[0].image
Write-Host "   Image: $IMAGE_NAME" -ForegroundColor White

# Get environment variables from service
$envVars = $serviceInfo.spec.template.spec.containers[0].env

Write-Host "   DB_PASSWORD: Using provided password" -ForegroundColor Green
Write-Host ""

# Build environment variables string
$envVarsList = @()
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        # Escape special characters in values
        $value = $envVar.value -replace '%', '%%' -replace '&', '^&' -replace '|', '^|'
        $envVarsList += "$($envVar.name)=$value"
    }
}

# CRITICAL: Add/Update DB_PASSWORD with provided password
$escapedPassword = $DB_PASSWORD -replace '%', '%%' -replace '&', '^&' -replace '|', '^|'
# Remove existing DB_PASSWORD if present
$envVarsList = $envVarsList | Where-Object { $_ -notlike "DB_PASSWORD=*" }
# Add new DB_PASSWORD
$envVarsList += "DB_PASSWORD=$escapedPassword"

$envVarsString = $envVarsList -join ","

Write-Host "Step 2: Checking if Cloud Run Job exists..." -ForegroundColor Cyan

# Check if job exists
$jobExists = $false
try {
    $jobInfo = gcloud run jobs describe $JOB_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json
    if ($jobInfo) {
        $jobExists = $true
        Write-Host "SUCCESS: Cloud Run Job found" -ForegroundColor Green
    }
} catch {
    Write-Host "INFO: Cloud Run Job does not exist, will create it" -ForegroundColor Yellow
}

Write-Host ""

if (-not $jobExists) {
    Write-Host "Step 3: Creating Cloud Run Job..." -ForegroundColor Cyan
    Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    # Create job
    # CRITICAL FIX: Use correct gcloud run jobs syntax
    $createCmd = "gcloud run jobs create $JOB_NAME " +
        "--image `"$IMAGE_NAME`" " +
        "--region $REGION " +
        "--set-env-vars `"$envVarsString`" " +
        "--set-cloudsql-instances $CLOUD_SQL_INSTANCE " +
        "--command node " +
        "--args run-migrations-in-container.js " +
        "--cpu 2 " +
        "--memory 2Gi " +
        "--task-timeout 600 " +
        "--max-retries 1 " +
        "--quiet"
    
    Write-Host "Creating job..." -ForegroundColor Gray
    Write-Host ""
    
    Invoke-Expression $createCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to create Cloud Run Job" -ForegroundColor Red
        Write-Host "   Check the error message above" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "SUCCESS: Cloud Run Job created" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Step 3: Updating Cloud Run Job..." -ForegroundColor Cyan
    Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    # Update job
    # CRITICAL FIX: Use correct gcloud run jobs syntax
    $updateCmd = "gcloud run jobs update $JOB_NAME " +
        "--image `"$IMAGE_NAME`" " +
        "--region $REGION " +
        "--set-env-vars `"$envVarsString`" " +
        "--set-cloudsql-instances $CLOUD_SQL_INSTANCE " +
        "--command node " +
        "--args run-migrations-in-container.js " +
        "--cpu 2 " +
        "--memory 2Gi " +
        "--task-timeout 600 " +
        "--max-retries 1 " +
        "--quiet"
    
    Write-Host "Updating job..." -ForegroundColor Gray
    Write-Host ""
    
    Invoke-Expression $updateCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: Failed to update Cloud Run Job" -ForegroundColor Red
        Write-Host "   Check the error message above" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "SUCCESS: Cloud Run Job updated" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Step 4: Executing Cloud Run Job..." -ForegroundColor Cyan
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
    Write-Host "3. View job logs: gcloud run jobs executions list --job $JOB_NAME --region $REGION" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Migrations failed" -ForegroundColor Red
    Write-Host "   Check job logs:" -ForegroundColor Yellow
    Write-Host "   gcloud run jobs executions list --job $JOB_NAME --region $REGION" -ForegroundColor White
    Write-Host "   gcloud run jobs executions logs read <execution-name> --job $JOB_NAME --region $REGION" -ForegroundColor White
    exit 1
}

