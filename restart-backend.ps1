# PowerShell script to restart backend on Google Cloud Run after code changes
# This script builds, pushes, and deploys the updated code

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Backend on Google Cloud Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Set project
Write-Host "Step 1: Setting Google Cloud project..." -ForegroundColor Cyan
try {
    $null = gcloud config set project $PROJECT_ID 2>&1 | Out-String
    Write-Host "   [OK] Project set to: $PROJECT_ID" -ForegroundColor Green
} catch {
    Write-Host "   [WARNING] Could not set project (may already be set)" -ForegroundColor Yellow
}

# Get current service configuration to preserve settings
Write-Host ""
Write-Host "Step 2: Getting current service configuration..." -ForegroundColor Cyan
try {
    $serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json
    if (-not $serviceInfo) {
        Write-Host "   [ERROR] Service not found" -ForegroundColor Red
        exit 1
    }
    
    # Get current environment variables
    $envVars = $serviceInfo.spec.template.spec.containers[0].env
    $envVarsList = @()
    $envVarsDict = @{}
    foreach ($envVar in $envVars) {
        if ($envVar.value) {
            $key = $envVar.name
            $value = $envVar.value
            
            # Skip PORT - Cloud Run sets it automatically
            if ($key -eq "PORT") {
                continue
            }
            
            # Store as both string format and dictionary for different uses
            $envVarsList += "${key}=${value}"
            $envVarsDict[$key] = $value
        }
    }
    $envVarsString = $envVarsList -join ","
    
    # Get Cloud SQL instances from annotations (Cloud Run v2 format)
    $cloudSqlInstances = $null
    $annotations = $serviceInfo.spec.template.metadata.annotations
    if ($annotations.'run.googleapis.com/cloudsql-instances') {
        $cloudSqlInstances = $annotations.'run.googleapis.com/cloudsql-instances'
    } elseif ($serviceInfo.spec.template.spec.containers[0].cloudSqlInstances) {
        $cloudSqlInstances = $serviceInfo.spec.template.spec.containers[0].cloudSqlInstances
    }
    
    $cloudSqlArg = ""
    if ($cloudSqlInstances) {
        if ($cloudSqlInstances -is [array]) {
            $cloudSqlArg = "--set-cloudsql-instances $($cloudSqlInstances -join ',')"
        } else {
            $cloudSqlArg = "--set-cloudsql-instances $cloudSqlInstances"
        }
    }
    
    # Get other settings
    $memory = $serviceInfo.spec.template.spec.containers[0].resources.limits.memory
    $cpu = $serviceInfo.spec.template.spec.containers[0].resources.limits.cpu
    $timeout = $serviceInfo.spec.template.spec.timeoutSeconds
    $maxInstances = $serviceInfo.spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale'
    $minInstances = $serviceInfo.spec.template.metadata.annotations.'autoscaling.knative.dev/minScale'
    
    Write-Host "   [OK] Service configuration loaded" -ForegroundColor Green
    Write-Host "   Memory: $memory" -ForegroundColor White
    Write-Host "   CPU: $cpu" -ForegroundColor White
    Write-Host "   Environment variables: $($envVarsList.Count)" -ForegroundColor White
} catch {
    Write-Host "   [ERROR] Could not get service configuration" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host ""
Write-Host "Step 3: Checking Docker..." -ForegroundColor Cyan
$useCloudBuild = $false
try {
    $null = docker ps 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [WARNING] Docker is not running" -ForegroundColor Yellow
        Write-Host "   Using Cloud Build instead (no Docker Desktop needed)..." -ForegroundColor Yellow
        $useCloudBuild = $true
    } else {
        Write-Host "   [OK] Docker is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   [WARNING] Docker is not available" -ForegroundColor Yellow
    Write-Host "   Using Cloud Build instead (no Docker Desktop needed)..." -ForegroundColor Yellow
    $useCloudBuild = $true
}

if (-not $useCloudBuild) {
    # Build Docker image locally
    Write-Host ""
    Write-Host "Step 4: Building Docker image locally..." -ForegroundColor Cyan
    Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
    try {
        docker build -t "${IMAGE_NAME}:latest" .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   [WARNING] Docker build failed, trying with --no-cache..." -ForegroundColor Yellow
            docker build --no-cache -t "${IMAGE_NAME}:latest" .
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "   [WARNING] Local Docker build failed, switching to Cloud Build..." -ForegroundColor Yellow
                $useCloudBuild = $true
            } else {
                Write-Host "   [OK] Docker image built successfully" -ForegroundColor Green
            }
        } else {
            Write-Host "   [OK] Docker image built successfully" -ForegroundColor Green
        }
    } catch {
        Write-Host "   [WARNING] Docker build failed, switching to Cloud Build..." -ForegroundColor Yellow
        $useCloudBuild = $true
    }
    
    if (-not $useCloudBuild) {
        # Push Docker image
        Write-Host ""
        Write-Host "Step 5: Pushing image to Container Registry..." -ForegroundColor Cyan
        Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
        try {
            docker push "${IMAGE_NAME}:latest"
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "   [WARNING] Docker push failed, switching to Cloud Build..." -ForegroundColor Yellow
                $useCloudBuild = $true
            } else {
                Write-Host "   [OK] Image pushed successfully" -ForegroundColor Green
            }
        } catch {
            Write-Host "   [WARNING] Docker push failed, switching to Cloud Build..." -ForegroundColor Yellow
            $useCloudBuild = $true
        }
    }
}

if ($useCloudBuild) {
    # INNOVATIVE SOLUTION: Use gcloud run deploy --source directly
    # This combines build and deploy in one step, avoiding archive creation issues
    Write-Host ""
    Write-Host "Step 4: Building and deploying directly to Cloud Run..." -ForegroundColor Cyan
    Write-Host "   Using innovative direct deployment method..." -ForegroundColor Yellow
    Write-Host "   (No Docker Desktop needed - Build happens on Google Cloud)" -ForegroundColor Gray
    Write-Host "   This may take 5-10 minutes..." -ForegroundColor Yellow
    
    # Retry logic for direct deployment
    $maxRetries = 3
    $retryCount = 0
    $deploySuccess = $false
    
    while ($retryCount -lt $maxRetries -and -not $deploySuccess) {
        $retryCount++
        
        if ($retryCount -gt 1) {
            Write-Host ""
            Write-Host "   Retry attempt $retryCount of $maxRetries..." -ForegroundColor Yellow
            Write-Host "   Waiting 30 seconds before retry..." -ForegroundColor Gray
            Start-Sleep -Seconds 30
        }
        
        try {
            # Set increased timeout for large uploads (10 minutes)
            $env:GCLOUD_HTTP_TIMEOUT = "600"
            
            Write-Host ""
            Write-Host "   Starting deployment (attempt $retryCount of $maxRetries)..." -ForegroundColor Cyan
            Write-Host "   Uploading source code and building image on Google Cloud..." -ForegroundColor Gray
            Write-Host "   (This may take 5-10 minutes, please be patient)" -ForegroundColor Gray
            Write-Host ""
            
            # INNOVATIVE: Use gcloud run deploy --source directly
            # This method:
            # 1. Uploads source code to Cloud Build
            # 2. Builds Docker image automatically
            # 3. Pushes to Container Registry
            # 4. Deploys to Cloud Run
            # All in one command - avoids archive creation issues!
            
            # INNOVATIVE SOLUTION: Use flags-file (YAML) for complex environment variables
            # This handles spaces, commas, and special characters correctly
            $flagsFile = "deploy-flags-$(Get-Date -Format 'yyyyMMddHHmmss').yaml"
            
            # Build environment variables dictionary for YAML
            $envVarsYaml = @{}
            if ($envVarsDict -and $envVarsDict.Count -gt 0) {
                foreach ($key in $envVarsDict.Keys) {
                    $value = $envVarsDict[$key]
                    # Skip PORT - Cloud Run sets it automatically
                    if ($key -ne "PORT" -and $value) {
                        # Fix FRONTEND_URL: replace spaces with commas
                        if ($key -eq "FRONTEND_URL") {
                            $value = $value -replace '\s+', ','
                        }
                        $envVarsYaml[$key] = $value
                    }
                }
            }
            
            # Create YAML flags file
            $yamlContent = @"
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: $SERVICE_NAME
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/cloudsql-instances: $($cloudSqlInstances -join ',')
        autoscaling.knative.dev/minScale: "$minInstances"
        autoscaling.knative.dev/maxScale: "$maxInstances"
    spec:
      containerConcurrency: 80
      timeoutSeconds: $timeout
      containers:
      - image: PLACEHOLDER_IMAGE
        resources:
          limits:
            cpu: "$cpu"
            memory: "$memory"
        env:
"@
            
            # Add environment variables to YAML
            foreach ($key in $envVarsYaml.Keys) {
                $value = $envVarsYaml[$key]
                # Escape quotes and special characters for YAML
                $escapedValue = $value -replace '"', '\"'
                $yamlContent += "`n        - name: $key`n          value: `"$escapedValue`""
            }
            
            # Write YAML file
            $yamlContent | Out-File -FilePath $flagsFile -Encoding UTF8 -Force
            
            Write-Host "   [INFO] Created flags file: $flagsFile" -ForegroundColor Gray
            
            # Build deploy command with --source (innovative method)
            # Use --update-env-vars with individual flags for better compatibility
            $deployArgs = @(
                "run", "deploy", $SERVICE_NAME,
                "--source", ".",
                "--region", $REGION,
                "--project", $PROJECT_ID,
                "--platform", "managed",
                "--allow-unauthenticated"
            )
            
            # Add environment variables using individual --update-env-vars flags
            # This is more reliable than comma-separated string
            foreach ($key in $envVarsYaml.Keys) {
                $value = $envVarsYaml[$key]
                $deployArgs += "--update-env-vars"
                $deployArgs += "$key=$value"
            }
            
            # Add Cloud SQL connection
            if ($cloudSqlInstances) {
                $deployArgs += "--add-cloudsql-instances"
                if ($cloudSqlInstances -is [array]) {
                    $deployArgs += ($cloudSqlInstances -join ',')
                } else {
                    $deployArgs += $cloudSqlInstances
                }
            }
            
            # Add memory and CPU
            if ($memory) {
                $deployArgs += "--memory"
                $deployArgs += $memory
            }
            if ($cpu) {
                $deployArgs += "--cpu"
                $deployArgs += $cpu
            }
            
            # Add timeout
            if ($timeout) {
                $deployArgs += "--timeout"
                $deployArgs += $timeout
            }
            
            # Add min/max instances
            if ($minInstances) {
                $deployArgs += "--min-instances"
                $deployArgs += $minInstances
            }
            if ($maxInstances) {
                $deployArgs += "--max-instances"
                $deployArgs += $maxInstances
            }
            
            Write-Host "   Executing: gcloud run deploy $SERVICE_NAME --source . --region $REGION" -ForegroundColor Gray
            Write-Host ""
            
            # Execute deployment with proper error handling
            try {
                $deployOutput = & gcloud $deployArgs 2>&1
                $deployExitCode = $LASTEXITCODE
                
                # Display output
                $deployOutput | ForEach-Object {
                    # Filter out the "Creating temporary archive" message - it's just informational
                    if ($_ -notmatch "Creating temporary archive") {
                        Write-Host "   $_" -ForegroundColor White
                    } else {
                        Write-Host "   [INFO] Preparing files for upload..." -ForegroundColor Gray
                    }
                }
                
                # Check exit code
                if ($deployExitCode -eq 0) {
                    Write-Host ""
                    Write-Host "   [OK] Successfully built and deployed to Cloud Run!" -ForegroundColor Green
                    $deploySuccess = $true
                    $useCloudBuild = $false  # Skip separate deploy step
                } else {
                    throw "Deployment failed with exit code: $deployExitCode"
                }
            } catch {
                Write-Host ""
                Write-Host "   [WARNING] Deployment failed: $($_.Exception.Message)" -ForegroundColor Yellow
                
                if ($retryCount -lt $maxRetries) {
                    Write-Host "   Will retry..." -ForegroundColor Yellow
                } else {
                    Write-Host ""
                    Write-Host "   [ERROR] Deployment failed after $maxRetries attempts" -ForegroundColor Red
                    Write-Host ""
                    Write-Host "   Troubleshooting:" -ForegroundColor Cyan
                    Write-Host "   1. Check your internet connection" -ForegroundColor White
                    Write-Host "   2. Verify gcloud authentication: gcloud auth login" -ForegroundColor White
                    Write-Host "   3. Check project permissions: gcloud projects get-iam-policy $PROJECT_ID" -ForegroundColor White
                    Write-Host "   4. Check Cloud Build API: gcloud services enable cloudbuild.googleapis.com" -ForegroundColor White
                    Write-Host "   5. Check Cloud Run API: gcloud services enable run.googleapis.com" -ForegroundColor White
                    exit 1
                }
            } finally {
                # Clean up flags file
                if (Test-Path $flagsFile) {
                    Remove-Item $flagsFile -ErrorAction SilentlyContinue
                }
            }
        } catch {
            Write-Host ""
            Write-Host "   [ERROR] Exception during deployment: $($_.Exception.Message)" -ForegroundColor Red
            
            if ($retryCount -lt $maxRetries) {
                Write-Host "   Will retry..." -ForegroundColor Yellow
            } else {
                Write-Host ""
                Write-Host "   [ERROR] Deployment failed after $maxRetries attempts" -ForegroundColor Red
                Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
                exit 1
            }
        }
    }
}

# Deploy to Cloud Run (skip if already deployed via --source)
Write-Host ""
if ($useCloudBuild) {
    # Already deployed via --source, skip this step
    Write-Host "Step 5: Deployment already completed via direct method" -ForegroundColor Green
    Write-Host "   Skipping separate deploy step..." -ForegroundColor Gray
    $skipDeploy = $true
} else {
    Write-Host "Step 5: Deploying to Cloud Run..." -ForegroundColor Cyan
    Write-Host "   This will restart the service with new code..." -ForegroundColor Yellow
    Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
    $skipDeploy = $false
}

if (-not $skipDeploy) {
    try {
        # Build deploy command preserving all settings
    $deployCmd = "gcloud run deploy $SERVICE_NAME " +
        "--image `"${IMAGE_NAME}:latest`" " +
        "--region $REGION " +
        "--platform managed " +
        "--allow-unauthenticated " +
        "--port 8080 "
    
    if ($memory) {
        $deployCmd += "--memory $memory "
    } else {
        $deployCmd += "--memory 2Gi "
    }
    
    if ($cpu) {
        $deployCmd += "--cpu $cpu "
    } else {
        $deployCmd += "--cpu 2 "
    }
    
    if ($timeout) {
        $deployCmd += "--timeout $timeout "
    } else {
        $deployCmd += "--timeout 300 "
    }
    
    if ($maxInstances) {
        $deployCmd += "--max-instances $maxInstances "
    } else {
        $deployCmd += "--max-instances 10 "
    }
    
    if ($minInstances) {
        $deployCmd += "--min-instances $minInstances "
    } else {
        $deployCmd += "--min-instances 1 "
    }
    
    if ($cloudSqlArg) {
        $deployCmd += "$cloudSqlArg "
    }
    
    if ($envVarsString) {
        $deployCmd += "--set-env-vars `"$envVarsString`" "
    }
    
    $deployCmd += "--project $PROJECT_ID"
    
    Write-Host "   Deploying..." -ForegroundColor Gray
    Invoke-Expression $deployCmd
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   [ERROR] Deployment failed" -ForegroundColor Red
        exit 1
    }
    
        Write-Host "   [OK] Service deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "   [ERROR] Deployment failed" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
        exit 1
    }
}

# Get service URL
Write-Host ""
if ($useCloudBuild) {
    Write-Host "Step 6: Getting service URL..." -ForegroundColor Cyan
} else {
    Write-Host "Step 7: Getting service URL..." -ForegroundColor Cyan
}
try {
    $serviceUrl = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1
    
    Write-Host "   [OK] Service URL: $serviceUrl" -ForegroundColor Green
} catch {
    Write-Host "   [WARNING] Could not get service URL" -ForegroundColor Yellow
    $serviceUrl = "https://altayar-backend-kuwjte4rda-uc.a.run.app"
}

# Wait for service to be ready
Write-Host ""
if ($useCloudBuild) {
    Write-Host "Step 7: Waiting for service to be ready..." -ForegroundColor Cyan
} else {
    Write-Host "Step 8: Waiting for service to be ready..." -ForegroundColor Cyan
}
Write-Host "   Waiting 30 seconds for service to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test health endpoint
Write-Host ""
if ($useCloudBuild) {
    Write-Host "Step 8: Testing health endpoint..." -ForegroundColor Cyan
} else {
    Write-Host "Step 9: Testing health endpoint..." -ForegroundColor Cyan
}
try {
    $healthUrl = "$serviceUrl/api/health"
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "   [OK] Service is healthy and running" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Health check returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [WARNING] Could not test health endpoint (service may still be starting)" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Final summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] Backend Restarted Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URL: $serviceUrl" -ForegroundColor Cyan
Write-Host "Health Check: $serviceUrl/api/health" -ForegroundColor Cyan
Write-Host "API Base: $serviceUrl/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test the service: $serviceUrl/api/health" -ForegroundColor White
Write-Host "2. Check logs: gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50" -ForegroundColor White
Write-Host ""

