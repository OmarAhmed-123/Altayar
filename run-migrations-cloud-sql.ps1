# PowerShell script to run database migrations on Cloud SQL
# CRITICAL FIX: This script now uses Cloud Run Job to run migrations
# This is the recommended way as it uses Cloud SQL Proxy socket automatically

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Running Migrations on Cloud SQL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[IMPORTANT] This script now uses Cloud Run Job" -ForegroundColor Yellow
Write-Host "   This is the recommended way to run migrations on Cloud SQL" -ForegroundColor Yellow
Write-Host "   It automatically uses Cloud SQL Proxy socket connection" -ForegroundColor Yellow
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$REGION = "us-central1"
$INSTANCE_NAME = "altayar-db"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
$JOB_NAME = "run-migrations"
$SERVICE_NAME = "altayar-backend"

# Set project
try {
    $null = gcloud config set project $PROJECT_ID 2>&1 | Out-String
} catch {
    # Ignore - project may already be set
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host "   Cloud SQL: $CONNECTION_NAME" -ForegroundColor White
Write-Host "   Job Name: $JOB_NAME" -ForegroundColor White
Write-Host ""

# Check if Cloud SQL Proxy is available locally (optional)
Write-Host "Checking connection method..." -ForegroundColor Cyan
Write-Host "   Using Cloud Run Job (recommended)" -ForegroundColor Green
Write-Host "   This will use Cloud SQL Proxy socket automatically" -ForegroundColor White
Write-Host ""

# Check if job exists
Write-Host "Checking if Cloud Run Job exists..." -ForegroundColor Cyan
try {
    $null = gcloud run jobs describe $JOB_NAME --region $REGION --format="value(name)" 2>&1 | Out-String
    $jobExists = $LASTEXITCODE -eq 0
} catch {
    $jobExists = $false
}

if (-not $jobExists) {
    Write-Host "   Job does not exist, creating..." -ForegroundColor Yellow
    
    # Get service image
    try {
        $serviceOutput = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | Out-String
        $serviceInfo = $serviceOutput | ConvertFrom-Json
    } catch {
        Write-Host "   [ERROR] Could not get Cloud Run service info" -ForegroundColor Red
        Write-Host "   Please make sure the service is deployed first" -ForegroundColor Yellow
        exit 1
    }
    
    if (-not $serviceInfo) {
        Write-Host "   [ERROR] Could not get Cloud Run service info" -ForegroundColor Red
        Write-Host "   Please make sure the service is deployed first" -ForegroundColor Yellow
        exit 1
    }
    
    $image = $serviceInfo.spec.template.spec.containers[0].image
    Write-Host "   Using image: $image" -ForegroundColor White
    
    # Get environment variables from service
    $envVars = $serviceInfo.spec.template.spec.containers[0].env
    $envVarsList = @()
    
    foreach ($envVar in $envVars) {
        if ($envVar.value) {
            $key = $envVar.name
            $value = $envVar.value
            
            # Skip PORT - Cloud Run sets it automatically
            if ($key -eq "PORT") {
                continue
            }
            
            # Skip FRONTEND_URL and BACKEND_URL - not needed for migrations
            # These contain commas which cause syntax errors
            if ($key -eq "FRONTEND_URL" -or $key -eq "BACKEND_URL") {
                continue
            }
            
            $envVarsList += "${key}=${value}"
        }
    }
    
    $envVarsString = $envVarsList -join ","
    
    # Create job
    Write-Host "   Creating Cloud Run Job..." -ForegroundColor Yellow
    try {
        # Use gcloud directly with proper argument passing
        $output = gcloud run jobs create $JOB_NAME `
            --region $REGION `
            --image $image `
            --add-cloudsql-instances $CONNECTION_NAME `
            --set-env-vars $envVarsString `
            --command node `
            --args run-migrations-in-container.js `
            --max-retries 1 `
            --task-timeout 600 `
            --project $PROJECT_ID `
            --quiet `
            2>&1 | Out-String
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Job created successfully" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] Failed to create job" -ForegroundColor Red
            Write-Host "   Exit code: $LASTEXITCODE" -ForegroundColor Yellow
            Write-Host "   Output: $output" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "   [ERROR] Failed to create job" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   [OK] Job exists" -ForegroundColor Green
}

# Execute job
Write-Host ""
Write-Host "Executing migration job..." -ForegroundColor Cyan
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
Write-Host ""

gcloud run jobs execute $JOB_NAME --region $REGION --wait

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[OK] Migrations completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test registration: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/register" -ForegroundColor White
    Write-Host "2. Check health: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERROR] Migrations failed" -ForegroundColor Red
    Write-Host "Check logs: gcloud run jobs executions list --job $JOB_NAME --region $REGION" -ForegroundColor Yellow
    Write-Host "Or view logs: gcloud run jobs executions logs read --job $JOB_NAME --region $REGION --limit 50" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

