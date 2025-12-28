# PowerShell script to run migrations immediately via Cloud Run Job
# This will create all database tables

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Run Database Migrations Now" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$JOB_NAME = "altayar-migrations-now"
$REGION = "us-central1"
$CLOUD_SQL_INSTANCE = "altayar-46d6f:us-central1:altayar-db"

Write-Host "Step 1: Getting Cloud Run service configuration..." -ForegroundColor Cyan

# Set project
gcloud config set project $PROJECT_ID | Out-Null

# Get service configuration to extract environment variables and image
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

# Build environment variables map for easier manipulation
$envVarsMap = @{}
foreach ($envVar in $envVars) {
    if ($envVar.value) {
        $envVarsMap[$envVar.name] = $envVar.value
    }
}

# CRITICAL FIX: Ensure all required database environment variables are set
Write-Host "   Checking environment variables..." -ForegroundColor Cyan

# Ensure DB_HOST is set to Cloud SQL Proxy socket
$dbHostValue = $envVarsMap["DB_HOST"]
if (-not $dbHostValue -or $dbHostValue -eq "127.0.0.1" -or $dbHostValue -like "*localhost*") {
    $cloudSqlSocket = "/cloudsql/$CLOUD_SQL_INSTANCE"
    Write-Host "   Setting DB_HOST to Cloud SQL Proxy socket: $cloudSqlSocket" -ForegroundColor Yellow
    $envVarsMap["DB_HOST"] = $cloudSqlSocket
} else {
    Write-Host "   Found DB_HOST: $dbHostValue" -ForegroundColor Green
}

# Ensure DB_USER is set
if (-not $envVarsMap["DB_USER"]) {
    Write-Host "   Setting DB_USER to: postgres" -ForegroundColor Yellow
    $envVarsMap["DB_USER"] = "postgres"
} else {
    Write-Host "   Found DB_USER: $($envVarsMap['DB_USER'])" -ForegroundColor Green
}

# Ensure DB_NAME is set
if (-not $envVarsMap["DB_NAME"]) {
    Write-Host "   Setting DB_NAME to: tourist_app_db" -ForegroundColor Yellow
    $envVarsMap["DB_NAME"] = "tourist_app_db"
} else {
    Write-Host "   Found DB_NAME: $($envVarsMap['DB_NAME'])" -ForegroundColor Green
}

# Ensure DB_PORT is set
if (-not $envVarsMap["DB_PORT"]) {
    Write-Host "   Setting DB_PORT to: 5432" -ForegroundColor Yellow
    $envVarsMap["DB_PORT"] = "5432"
}

# CRITICAL: Check if DB_PASSWORD is set
if (-not $envVarsMap["DB_PASSWORD"]) {
    Write-Host "   WARNING: DB_PASSWORD is not set!" -ForegroundColor Red
    Write-Host "   Please run: fix-database-connection-now.bat first" -ForegroundColor Yellow
    Write-Host "   Or enter password manually:" -ForegroundColor Yellow
    $dbPassword = Read-Host "Enter DB_PASSWORD" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    $envVarsMap["DB_PASSWORD"] = $dbPasswordPlain
    Write-Host "   DB_PASSWORD set" -ForegroundColor Green
} else {
    Write-Host "   Found DB_PASSWORD: [SET]" -ForegroundColor Green
}

# Ensure NODE_ENV is set
if (-not $envVarsMap["NODE_ENV"]) {
    $envVarsMap["NODE_ENV"] = "production"
}

# CRITICAL FIX: Build command arguments with individual --update-env-vars for each variable
# This avoids escaping issues with special characters (like % in passwords)
$envVarArgs = @()
foreach ($key in $envVarsMap.Keys) {
    $value = $envVarsMap[$key]
    # Use --update-env-vars for each variable individually
    # This handles special characters correctly
    $envVarArgs += "--update-env-vars"
    $envVarArgs += "$key=$value"
}

Write-Host ""
Write-Host "Step 2: Creating Cloud Run Job for migrations..." -ForegroundColor Cyan

# Check if job exists
$jobExists = $false
try {
    $jobInfo = gcloud run jobs describe $JOB_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json
    if ($jobInfo) {
        $jobExists = $true
        Write-Host "   Job exists, updating..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Job does not exist, creating..." -ForegroundColor Yellow
}

if (-not $jobExists) {
    # Create job
    # CRITICAL: Use individual --update-env-vars flags to avoid escaping issues
    $createCmdParts = @(
        "gcloud run jobs create $JOB_NAME",
        "--image $IMAGE_NAME",
        "--region $REGION",
        "--project $PROJECT_ID"
    )
    $createCmdParts += $envVarArgs
    $createCmdParts += @(
        "--set-cloudsql-instances $CLOUD_SQL_INSTANCE",
        "--task-timeout 600",
        "--cpu 2",
        "--memory 2Gi",
        "--max-retries 1",
        "--args node",
        "--args run-migrations-in-container.js",
        "--quiet"
    )
    
    $createCmd = $createCmdParts -join " "
    
    Write-Host "   Creating Cloud Run Job..." -ForegroundColor Cyan
    Invoke-Expression $createCmd | Out-Null
} else {
    # Update job
    # CRITICAL: Use individual --update-env-vars flags to avoid escaping issues
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
}

Write-Host ""
Write-Host "Step 3: Executing migrations..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Execute job
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
    Write-Host "3. Try register/login" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Migrations failed" -ForegroundColor Red
    Write-Host "   Check Cloud Run Job logs for details" -ForegroundColor Yellow
    Write-Host "   Run: gcloud run jobs executions list --job=$JOB_NAME --region=$REGION" -ForegroundColor White
    exit 1
}

