# PowerShell script to verify database tables and run migrations if needed
# This ensures all tables exist before the application tries to use them

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verify and Fix Database Tables" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$JOB_NAME = "altayar-migrations-now"
$REGION = "us-central1"
$CLOUD_SQL_INSTANCE = "altayar-46d6f:us-central1:altayar-db"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Getting Cloud Run service configuration..." -ForegroundColor Cyan

# Get service configuration
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

Write-Host "   SUCCESS: Cloud Run service found" -ForegroundColor Green
Write-Host "   URL: $($serviceInfo.status.url)" -ForegroundColor White

# Get the image from the service
$IMAGE_NAME = $serviceInfo.spec.template.spec.containers[0].image
Write-Host "   Image: $IMAGE_NAME" -ForegroundColor White

# Get environment variables from service
$envVars = $serviceInfo.spec.template.spec.containers[0].env
$envVarsMap = @{}

# Build map of existing environment variables
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        $envVarsMap[$envVar.name] = $envVar.value
    }
}

# Ensure all required variables are set
if (-not $envVarsMap["DB_HOST"] -or $envVarsMap["DB_HOST"] -eq "127.0.0.1") {
    $envVarsMap["DB_HOST"] = "/cloudsql/$CLOUD_SQL_INSTANCE"
}

if (-not $envVarsMap["DB_USER"]) {
    $envVarsMap["DB_USER"] = "postgres"
}

if (-not $envVarsMap["DB_NAME"]) {
    $envVarsMap["DB_NAME"] = "tourist_app_db"
}

if (-not $envVarsMap["DB_PORT"]) {
    $envVarsMap["DB_PORT"] = "5432"
}

if (-not $envVarsMap["DB_PASSWORD"]) {
    Write-Host "   WARNING: DB_PASSWORD is not set!" -ForegroundColor Red
    Write-Host "   Enter database password:" -ForegroundColor Yellow
    $dbPassword = Read-Host "DB_PASSWORD" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    $envVarsMap["DB_PASSWORD"] = $dbPasswordPlain
}

if (-not $envVarsMap["NODE_ENV"]) {
    $envVarsMap["NODE_ENV"] = "production"
}

Write-Host ""
Write-Host "Step 2: Running migrations to ensure tables exist..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build environment variables for job
$envVarArgs = @()
foreach ($key in $envVarsMap.Keys) {
    $value = $envVarsMap[$key]
    $envVarArgs += "--update-env-vars"
    $envVarArgs += "$key=$value"
}

# Update job with correct environment variables
$updateCmdParts = @(
    "gcloud run jobs update $JOB_NAME",
    "--image $IMAGE_NAME",
    "--region $REGION",
    "--project $PROJECT_ID"
)
$updateCmdParts += $envVarArgs
$updateCmdParts += @(
    "--set-cloudsql-instances $CLOUD_SQL_INSTANCE",
    "--task-timeout 600",
    "--cpu 2",
    "--memory 2Gi",
    "--max-retries 1",
    "--args node",
    "--args run-migrations-in-container.js",
    "--quiet"
)

$updateCmd = $updateCmdParts -join " "

Write-Host "   Updating Cloud Run Job..." -ForegroundColor Cyan
Invoke-Expression $updateCmd | Out-Null

# Execute job
Write-Host "   Executing migrations..." -ForegroundColor Cyan
$executeCmd = "gcloud run jobs execute $JOB_NAME --region $REGION --project $PROJECT_ID --wait"
Invoke-Expression $executeCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Migrations completed!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 30 seconds for tables to be fully available" -ForegroundColor White
    Write-Host "2. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "3. Try register/login - should work now!" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Migrations failed" -ForegroundColor Red
    Write-Host "   Check Cloud Run Job logs for details" -ForegroundColor Yellow
    Write-Host "   Run: gcloud run jobs executions list --job=$JOB_NAME --region=$REGION" -ForegroundColor White
    exit 1
}

