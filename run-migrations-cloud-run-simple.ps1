# PowerShell script to run database migrations on Cloud Run
# Simple version: Uses gcloud run services update with a one-time migration command

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Migrations on Cloud Run" -ForegroundColor Cyan
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

Write-Host "Step 2: Creating temporary migration revision..." -ForegroundColor Cyan
Write-Host "   This will create a new revision that runs migrations on startup" -ForegroundColor Gray
Write-Host ""

# Build environment variables string
$envVarsList = @()
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        # Escape special characters in values
        $value = $envVar.value -replace '%', '%%'
        $envVarsList += "$($envVar.name)=$value"
    }
}

$envVarsString = $envVarsList -join ","

# Get Cloud SQL instances
$cloudSqlInstances = $cloudSqlAnnotations.'run.googleapis.com/cloudsql-instances'

# Create a script that runs migrations on container startup
Write-Host "Step 3: Updating service to run migrations..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Create a new revision with command override to run migrations
$updateCmd = "gcloud run services update $SERVICE_NAME " +
    "--region $REGION " +
    "--update-env-vars $envVarsString " +
    "--add-cloudsql-instances $cloudSqlInstances " +
    "--command sh " +
    "--args -c,'npm run migrate:latest && node server.js' " +
    "--timeout 300 " +
    "--cpu 2 " +
    "--memory 2Gi " +
    "--quiet"

Write-Host "Executing: $updateCmd" -ForegroundColor Gray
Write-Host ""

Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for migrations to complete (60 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 60
    
    Write-Host ""
    Write-Host "Step 4: Restoring normal service command..." -ForegroundColor Cyan
    
    # Restore normal command (just run server.js)
    $restoreCmd = "gcloud run services update $SERVICE_NAME " +
        "--region $REGION " +
        "--update-env-vars $envVarsString " +
        "--add-cloudsql-instances $cloudSqlInstances " +
        "--command node " +
        "--args server.js " +
        "--timeout 300 " +
        "--cpu 2 " +
        "--memory 2Gi " +
        "--quiet"
    
    Invoke-Expression $restoreCmd | Out-Null
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Migrations completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test registration: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/register" -ForegroundColor White
    Write-Host "2. Check health: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

