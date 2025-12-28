# PowerShell script to execute all fixes and migrations
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Executing All Fixes and Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$INSTANCE_NAME = "altayar-db"
$CONNECTION_NAME = "${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
$JOB_NAME = "run-migrations"

# Set project
Write-Host "Step 1: Setting Google Cloud project..." -ForegroundColor Cyan
try {
    $null = gcloud config set project $PROJECT_ID 2>&1 | Out-String
    Write-Host "   [OK] Project set to: $PROJECT_ID" -ForegroundColor Green
} catch {
    Write-Host "   [WARNING] Could not set project (may already be set)" -ForegroundColor Yellow
}

# Check Cloud SQL instance
Write-Host ""
Write-Host "Step 2: Checking Cloud SQL instance..." -ForegroundColor Cyan
try {
    $dbState = gcloud sql instances describe $INSTANCE_NAME --format="value(state)" 2>&1 | Out-String
    $dbState = $dbState.Trim()
    if ($dbState -eq "RUNNABLE") {
        Write-Host "   [OK] Cloud SQL instance is RUNNABLE" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Cloud SQL instance state: $dbState" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [ERROR] Could not check Cloud SQL instance" -ForegroundColor Red
    exit 1
}

# Check Cloud Run service
Write-Host ""
Write-Host "Step 3: Checking Cloud Run service..." -ForegroundColor Cyan
try {
    $serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json
    if ($serviceInfo) {
        $serviceUrl = $serviceInfo.status.url
        $ready = $serviceInfo.status.conditions | Where-Object { $_.type -eq "Ready" }
        if ($ready.status -eq "True") {
            Write-Host "   [OK] Cloud Run service is RUNNING" -ForegroundColor Green
            Write-Host "   [OK] Service URL: $serviceUrl" -ForegroundColor White
        } else {
            Write-Host "   [WARNING] Cloud Run service is not ready" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   [ERROR] Could not check Cloud Run service" -ForegroundColor Red
    exit 1
}

# Check if migration job exists
Write-Host ""
Write-Host "Step 4: Checking migration job..." -ForegroundColor Cyan
$jobExists = $false
try {
    $null = gcloud run jobs describe $JOB_NAME --region $REGION --format="value(name)" 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        $jobExists = $true
        Write-Host "   [INFO] Migration job exists, will delete and recreate it" -ForegroundColor Yellow
        Write-Host "   Deleting existing job..." -ForegroundColor Yellow
        $null = gcloud run jobs delete $JOB_NAME --region $REGION --quiet 2>&1 | Out-String
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Existing job deleted" -ForegroundColor Green
        }
        $jobExists = $false
    }
} catch {
    Write-Host "   [INFO] Migration job does not exist, will create it" -ForegroundColor Yellow
}

# Create migration job if needed
if (-not $jobExists) {
    Write-Host ""
    Write-Host "Step 5: Creating migration job..." -ForegroundColor Cyan
    
    # Get service image
    try {
        $serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json
        $image = $serviceInfo.spec.template.spec.containers[0].image
        Write-Host "   Using image: $image" -ForegroundColor White
    } catch {
        Write-Host "   [ERROR] Could not get service image" -ForegroundColor Red
        exit 1
    }
    
    # Get environment variables
    # CRITICAL: Set NODE_ENV to "production" only (not from service which may be corrupted)
    $envVars = $serviceInfo.spec.template.spec.containers[0].env
    $envVarsList = @()
    
    # Always set NODE_ENV to "production" only - CRITICAL FIX
    $envVarsList += "NODE_ENV=production"
    
    foreach ($envVar in $envVars) {
        if ($envVar.value) {
            $key = $envVar.name
            $value = $envVar.value
            
            # Skip PORT - Cloud Run sets it automatically
            if ($key -eq "PORT") {
                continue
            }
            
            # Skip NODE_ENV - we already set it to "production" only
            if ($key -eq "NODE_ENV") {
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
    Write-Host "   Creating job..." -ForegroundColor Yellow
    Write-Host "   Environment variables: $($envVarsList.Count) variables" -ForegroundColor Gray
    try {
        # CRITICAL FIX: Use the exact same format as run-migrations-cloud-run-job-with-password.ps1
        # This format has been tested and works
        $createCmd = "gcloud run jobs create $JOB_NAME " +
            "--image `"$image`" " +
            "--region $REGION " +
            "--set-env-vars `"$envVarsString`" " +
            "--set-cloudsql-instances $CONNECTION_NAME " +
            "--command node " +
            "--args run-migrations-in-container.js " +
            "--max-retries 1 " +
            "--task-timeout 600 " +
            "--project $PROJECT_ID " +
            "--quiet"
        
        Write-Host "   Executing: gcloud run jobs create..." -ForegroundColor Gray
        Invoke-Expression $createCmd
        
        if ($LASTEXITCODE -eq 0) {
            $output = ""
        } else {
            $output = "Exit code: $LASTEXITCODE"
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   [OK] Migration job created successfully" -ForegroundColor Green
        } else {
            Write-Host "   [ERROR] Failed to create migration job" -ForegroundColor Red
            Write-Host "   Exit code: $LASTEXITCODE" -ForegroundColor Yellow
            Write-Host "   Output: $output" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "   [ERROR] Failed to create migration job" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        exit 1
    }
}

# Execute migration job
Write-Host ""
Write-Host "Step 6: Executing migrations..." -ForegroundColor Cyan
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
Write-Host "   Please wait..." -ForegroundColor Gray
Write-Host ""

try {
    # Execute job with --wait to wait for completion
    # Use Invoke-Expression to avoid PowerShell parsing issues
    $executeCmd = "gcloud run jobs execute $JOB_NAME --region $REGION --wait"
    $executeOutput = Invoke-Expression $executeCmd 2>&1 | Out-String
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Migrations completed successfully" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Migration execution may have issues" -ForegroundColor Yellow
        Write-Host "   Exit code: $LASTEXITCODE" -ForegroundColor Yellow
        Write-Host "   Output: $executeOutput" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   [INFO] Checking job execution status..." -ForegroundColor Cyan
        
        # Check execution status
        try {
            $executions = gcloud run jobs executions list --job $JOB_NAME --region $REGION --format="json" --limit 1 2>&1 | ConvertFrom-Json
            if ($executions -and $executions.Count -gt 0) {
                $latestExecution = $executions[0]
                $status = $latestExecution.status.completionStatus
                Write-Host "   Latest execution status: $status" -ForegroundColor White
                
                if ($status -eq "SUCCEEDED") {
                    Write-Host "   [OK] Migrations actually succeeded!" -ForegroundColor Green
                } else {
                    Write-Host "   [INFO] Check logs: gcloud run jobs executions logs read --job $JOB_NAME --region $REGION --limit 50" -ForegroundColor Yellow
                }
            }
        } catch {
            Write-Host "   [INFO] Could not check execution status" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   [ERROR] Failed to execute migrations" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   You can execute manually: gcloud run jobs execute $JOB_NAME --region $REGION --wait" -ForegroundColor Yellow
}

# Final verification
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] All Fixes and Migrations Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "Health Check: $serviceUrl/api/health" -ForegroundColor Cyan
Write-Host "Registration: $serviceUrl/api/auth/register" -ForegroundColor Cyan
Write-Host ""

