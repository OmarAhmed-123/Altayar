# Complete Deployment Script - Using New Billing Account
# Project: altayar-46d6f
# Billing Account: 01A9EE-92CE19-7CF271 (Active)
# Email: dipencilcom@gmail.com

# CRITICAL: Set error action to Continue to prevent stopping on stderr messages
$ErrorActionPreference = "Continue"

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayar-46d6f"
$BILLING_ACCOUNT_ID = "01A9EE-92CE19-7CF271"
$GCP_EMAIL = "dipencilcom@gmail.com"
$REGION = "us-central1"
$SERVICE_NAME = "altayar-backend"
$INSTANCE_NAME = "altayar-db"
$DATABASE_NAME = "tourist_app_db"
$DB_USER = "postgres"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Altayar Backend - Complete Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Billing Account: $BILLING_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host "Email: $GCP_EMAIL" -ForegroundColor Yellow
Write-Host ""

# Verify gcloud
if (-not (Test-Path $GCLOUD_CMD)) {
    Write-Host "ERROR: gcloud not found" -ForegroundColor Red
    exit 1
}

# Add gcloud to PATH for Docker credential helper
$gcloudPath = Split-Path -Parent $GCLOUD_CMD
$env:Path = "$gcloudPath;$env:Path"

# Step 0: Check and switch account if needed
Write-Host "[0/10] Checking authentication..." -ForegroundColor Yellow
try {
    $currentAccountOutput = & $GCLOUD_CMD config get-value account 2>&1
    $currentAccount = $currentAccountOutput | Where-Object { $_ -and $_ -notmatch "ERROR" -and $_ -notmatch "Exception" }
    $accountCheckExitCode = $LASTEXITCODE
} catch {
    $currentAccount = $null
    $accountCheckExitCode = 1
}

if ($accountCheckExitCode -ne 0 -or -not $currentAccount -or $currentAccount -notmatch $GCP_EMAIL) {
    Write-Host "Current account: $currentAccount" -ForegroundColor Cyan
    Write-Host "Required account: $GCP_EMAIL" -ForegroundColor Cyan
    Write-Host "Switching to correct account..." -ForegroundColor Yellow
    
    # Login with correct account
    Write-Host ""
    Write-Host "Please login with: $GCP_EMAIL" -ForegroundColor Yellow
    Write-Host "A browser window will open..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        $null = & $GCLOUD_CMD auth login $GCP_EMAIL --no-launch-browser 2>&1 | Out-Null
        $loginExitCode = $LASTEXITCODE
        
        if ($loginExitCode -ne 0) {
            Write-Host "Opening browser for login..." -ForegroundColor Cyan
            $null = & $GCLOUD_CMD auth login $GCP_EMAIL 2>&1 | Out-Null
            $loginExitCode = $LASTEXITCODE
        }
        
        if ($loginExitCode -eq 0) {
            Write-Host "OK: Logged in as $GCP_EMAIL" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Failed to login" -ForegroundColor Red
            Write-Host "Please run manually: gcloud auth login $GCP_EMAIL" -ForegroundColor Yellow
            exit 1
        }
    } catch {
        Write-Host "ERROR: Exception during login: $_" -ForegroundColor Red
        Write-Host "Please run manually: gcloud auth login $GCP_EMAIL" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "OK: Already logged in as $GCP_EMAIL" -ForegroundColor Green
}
Write-Host ""

# Step 1: Set project
Write-Host "[1/10] Setting project..." -ForegroundColor Yellow
try {
    # Suppress stderr output and check exit code only
    $null = & $GCLOUD_CMD config set project $PROJECT_ID 2>&1 | Out-Null
    $projectExitCode = $LASTEXITCODE
    
    # gcloud prints "Updated property [core/project]." to stderr even on success
    # So we check exit code, not output
    if ($projectExitCode -ne 0) {
        Write-Host "WARNING: Could not set project automatically" -ForegroundColor Yellow
        Write-Host "Please ensure you have access to project: $PROJECT_ID" -ForegroundColor Yellow
        Write-Host "Run manually: gcloud config set project $PROJECT_ID" -ForegroundColor Cyan
        exit 1
    } else {
        Write-Host "OK: Project set" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: Failed to set project" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Verify project access
Write-Host "[2/10] Verifying project access..." -ForegroundColor Yellow
try {
    $projectCheckOutput = & $GCLOUD_CMD projects describe $PROJECT_ID --format="value(projectId)" 2>&1
    $projectCheckExitCode = $LASTEXITCODE
    $projectCheck = $projectCheckOutput | Where-Object { $_ -and $_ -notmatch "ERROR" -and $_ -notmatch "WARNING" -and $_ -notmatch "Exception" }

    if ($projectCheckExitCode -ne 0 -or -not $projectCheck -or $projectCheck -ne $PROJECT_ID) {
        Write-Host "ERROR: Cannot access project $PROJECT_ID" -ForegroundColor Red
        $errorDetails = $projectCheckOutput | Where-Object { $_ -match "ERROR" -or $_ -match "Exception" -or $_ -match "permission" }
        if ($errorDetails) {
            Write-Host "Error details: $errorDetails" -ForegroundColor Red
        }
        $currentAccount = & $GCLOUD_CMD config get-value account 2>&1 | Where-Object { $_ -and $_ -notmatch "ERROR" -and $_ -notmatch "Exception" }
        Write-Host "Current account: $currentAccount" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solutions:" -ForegroundColor Cyan
        Write-Host "1. Ensure you're logged in with: $GCP_EMAIL" -ForegroundColor White
        Write-Host "2. Ensure you have 'Owner' or 'Editor' role on project" -ForegroundColor White
        Write-Host "3. Check project exists: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID" -ForegroundColor White
        Write-Host "4. Run: SWITCH_ACCOUNT.bat" -ForegroundColor White
        Write-Host ""
        exit 1
    }
    Write-Host "OK: Project access verified" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to verify project access" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Link billing account
Write-Host "[3/10] Linking billing account..." -ForegroundColor Yellow
try {
    $billingCheckOutput = & $GCLOUD_CMD billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>&1
    $billingCheckExitCode = $LASTEXITCODE
    $billingCheck = $billingCheckOutput | Where-Object { $_ -and $_ -notmatch "ERROR" -and $_ -notmatch "WARNING" -and $_ -notmatch "not found" -and $_ -notmatch "Exception" }

    if ($billingCheckExitCode -ne 0 -or -not $billingCheck) {
        Write-Host "Linking billing account..." -ForegroundColor Cyan
        $linkResult = & $GCLOUD_CMD billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID 2>&1
        $linkExitCode = $LASTEXITCODE
        
        if ($linkExitCode -eq 0) {
            Write-Host "OK: Billing account linked" -ForegroundColor Green
        } else {
            $linkError = $linkResult | Where-Object { $_ -match "ERROR" -or $_ -match "WARNING" -or $_ -match "failed" -or $_ -match "Exception" }
            if ($linkError) {
                Write-Host "WARNING: Could not link automatically" -ForegroundColor Yellow
                Write-Host "Error: $linkError" -ForegroundColor Red
            } else {
                Write-Host "WARNING: Could not link automatically (check if already linked)" -ForegroundColor Yellow
            }
            Write-Host "Please verify: https://console.cloud.google.com/billing?project=$PROJECT_ID" -ForegroundColor Cyan
            Write-Host "Or run: gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID" -ForegroundColor Cyan
        }
    } else {
        Write-Host "OK: Billing account already linked: $billingCheck" -ForegroundColor Green
    }
} catch {
    Write-Host "WARNING: Error checking billing account: $_" -ForegroundColor Yellow
    Write-Host "Continuing anyway..." -ForegroundColor Cyan
}
Write-Host ""

# Step 4: Enable APIs
Write-Host "[4/10] Enabling APIs..." -ForegroundColor Yellow
$apis = @(
    "cloudbuild.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "containerregistry.googleapis.com"
)

$apiErrors = @()
foreach ($api in $apis) {
    try {
        $null = & $GCLOUD_CMD services enable $api --quiet 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Failed to enable $api (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
            $apiErrors += $api
        }
    } catch {
        Write-Host "WARNING: Exception enabling $api : $_" -ForegroundColor Yellow
        $apiErrors += $api
    }
}

if ($apiErrors.Count -gt 0) {
    Write-Host "Some APIs failed to enable, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "OK: APIs enabled" -ForegroundColor Green
}
Write-Host ""

# Step 5: Setup Cloud SQL
Write-Host "[5/10] Setting up Cloud SQL..." -ForegroundColor Yellow
$instanceCheckOutput = & $GCLOUD_CMD sql instances describe $INSTANCE_NAME 2>&1
$instanceCheckExitCode = $LASTEXITCODE
if ($instanceCheckExitCode -ne 0) {
    Write-Host "Creating Cloud SQL instance..." -ForegroundColor Cyan
    $dbPassword = Read-Host "Enter database root password (12+ chars)" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    $dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    
    # Note: --enable-bin-log is only for MySQL, not PostgreSQL
    & $GCLOUD_CMD sql instances create $INSTANCE_NAME `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$REGION `
        --root-password=$dbPasswordPlain `
        --storage-type=SSD `
        --storage-size=10GB `
        --backup-start-time=03:00 `
        --maintenance-window-day=SUN `
        --maintenance-window-hour=4 `
        --quiet
    
    Start-Sleep -Seconds 30
    Write-Host "OK: Instance created" -ForegroundColor Green
} else {
    Write-Host "OK: Instance exists" -ForegroundColor Green
}

$connectionOutput = & $GCLOUD_CMD sql instances describe $INSTANCE_NAME --format="value(connectionName)" 2>&1
$CONNECTION_NAME = $connectionOutput | Where-Object { $_ -and $_ -notmatch "ERROR" -and $_ -notmatch "WARNING" }
if ($CONNECTION_NAME) {
    Write-Host "Connection: $CONNECTION_NAME" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Could not get connection name" -ForegroundColor Yellow
    $CONNECTION_NAME = "${PROJECT_ID}:${REGION}:${INSTANCE_NAME}"
    Write-Host "Using: $CONNECTION_NAME" -ForegroundColor Cyan
}

# Create database
$dbCheckOutput = & $GCLOUD_CMD sql databases describe $DATABASE_NAME --instance=$INSTANCE_NAME 2>&1
$dbCheckExitCode = $LASTEXITCODE
if ($dbCheckExitCode -ne 0) {
    $dbCreateOutput = & $GCLOUD_CMD sql databases create $DATABASE_NAME --instance=$INSTANCE_NAME --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Database created" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not create database (may already exist)" -ForegroundColor Yellow
    }
} else {
    Write-Host "OK: Database exists" -ForegroundColor Green
}

# Create user
$userCheckOutput = & $GCLOUD_CMD sql users describe $DB_USER --instance=$INSTANCE_NAME 2>&1
$userCheckExitCode = $LASTEXITCODE
if ($userCheckExitCode -ne 0) {
    $userPassword = Read-Host "Enter password for user '$DB_USER'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($userPassword)
    $userPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    $userCreateOutput = & $GCLOUD_CMD sql users create $DB_USER --instance=$INSTANCE_NAME --password=$userPasswordPlain --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: User created" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not create user (may already exist)" -ForegroundColor Yellow
    }
} else {
    Write-Host "OK: User exists" -ForegroundColor Green
}
Write-Host ""

# Step 6: Build Docker
Write-Host "[6/10] Building Docker image..." -ForegroundColor Yellow
$dockerBuildOutput = docker build -t "${IMAGE_NAME}:latest" . 2>&1
$dockerBuildExitCode = $LASTEXITCODE
if ($dockerBuildExitCode -ne 0) {
    Write-Host "ERROR: Docker build failed" -ForegroundColor Red
    $buildError = $dockerBuildOutput | Where-Object { $_ -match "ERROR" -or $_ -match "failed" -or $_ -match "error" }
    if ($buildError) {
        Write-Host "Error details: $buildError" -ForegroundColor Red
    }
    exit 1
}
Write-Host "OK: Image built" -ForegroundColor Green
Write-Host ""

# Step 7: Push
Write-Host "[7/10] Pushing image..." -ForegroundColor Yellow

# Method 1: Try using gcloud auth configure-docker with proper PATH
Write-Host "Configuring Docker authentication..." -ForegroundColor Cyan
try {
    # Get gcloud SDK path
    $gcloudPath = Split-Path -Parent $GCLOUD_CMD
    $gcloudBinPath = $gcloudPath
    $env:Path = "$gcloudBinPath;$env:Path"
    
    # Configure Docker auth
    $null = & $GCLOUD_CMD auth configure-docker gcr.io --quiet 2>&1 | Out-Null
    
    # Alternative: Use application-default credentials
    Write-Host "Setting up application-default credentials..." -ForegroundColor Cyan
    $null = & $GCLOUD_CMD auth application-default login --quiet 2>&1 | Out-Null
    
    # Get access token and login to Docker
    Write-Host "Authenticating Docker with gcloud..." -ForegroundColor Cyan
    $accessToken = & $GCLOUD_CMD auth print-access-token 2>&1 | Where-Object { $_ -and $_ -notmatch "ERROR" }
    
    if ($accessToken) {
        # Login to gcr.io using access token
        $loginOutput = echo $accessToken | docker login -u oauth2accesstoken --password-stdin https://gcr.io 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "WARNING: Docker login with token failed, trying alternative method..." -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "WARNING: Error configuring Docker auth: $_" -ForegroundColor Yellow
}

# Try pushing the image
Write-Host "Pushing image to Container Registry..." -ForegroundColor Cyan
$dockerPushOutput = docker push "${IMAGE_NAME}:latest" 2>&1
$dockerPushExitCode = $LASTEXITCODE

if ($dockerPushExitCode -ne 0) {
    Write-Host "ERROR: Docker push failed" -ForegroundColor Red
    $pushError = $dockerPushOutput | Where-Object { $_ -match "ERROR" -or $_ -match "failed" -or $_ -match "error" -or $_ -match "denied" -or $_ -match "unauthorized" -or $_ -match "authentication" }
    if ($pushError) {
        Write-Host "Error details: $pushError" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "Trying alternative: Using Cloud Build..." -ForegroundColor Yellow
    Write-Host "This will build and push the image using Cloud Build service..." -ForegroundColor Cyan
    
    # Alternative: Use Cloud Build to build and push
    try {
        $buildOutput = & $GCLOUD_CMD builds submit --tag "${IMAGE_NAME}:latest" --project $PROJECT_ID 2>&1
        $buildExitCode = $LASTEXITCODE
        
        if ($buildExitCode -eq 0) {
            Write-Host "OK: Image built and pushed using Cloud Build" -ForegroundColor Green
        } else {
            Write-Host "ERROR: Cloud Build also failed" -ForegroundColor Red
            Write-Host ""
            Write-Host "Manual steps:" -ForegroundColor Yellow
            Write-Host "1. Run: gcloud auth configure-docker" -ForegroundColor White
            Write-Host "2. Run: gcloud auth application-default login" -ForegroundColor White
            Write-Host "3. Run: docker push ${IMAGE_NAME}:latest" -ForegroundColor White
            exit 1
        }
    } catch {
        Write-Host "ERROR: Cloud Build failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "OK: Image pushed" -ForegroundColor Green
}
Write-Host ""

# Step 8: Deploy
Write-Host "[8/10] Deploying to Cloud Run..." -ForegroundColor Yellow

# Note: PORT is automatically set by Cloud Run, don't set it manually
# Cloud Run sets PORT automatically (usually 8080)
$deployOutput = & $GCLOUD_CMD run deploy $SERVICE_NAME `
    --image "${IMAGE_NAME}:latest" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --add-cloudsql-instances $CONNECTION_NAME `
    --set-env-vars "NODE_ENV=production" `
    --project $PROJECT_ID 2>&1

$deployExitCode = $LASTEXITCODE
if ($deployExitCode -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    $deployError = $deployOutput | Where-Object { $_ -match "ERROR" -or $_ -match "failed" -or $_ -match "error" -or $_ -match "permission" }
    if ($deployError) {
        Write-Host "Error details: $deployError" -ForegroundColor Red
    }
    exit 1
}
Write-Host "OK: Deployed" -ForegroundColor Green
Write-Host ""

# Step 9: Get URL
Write-Host "[9/10] Getting service URL..." -ForegroundColor Yellow
$urlOutput = & $GCLOUD_CMD run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1
$SERVICE_URL = $urlOutput | Where-Object { $_ -and $_ -notmatch "ERROR" -and $_ -notmatch "WARNING" -and $_ -match "https://" }
if (-not $SERVICE_URL) {
    Write-Host "WARNING: Could not get service URL automatically" -ForegroundColor Yellow
    Write-Host "Please check: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor Cyan
    $SERVICE_URL = "https://$SERVICE_NAME-$REGION-$PROJECT_ID.a.run.app"
    Write-Host "Trying: $SERVICE_URL" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "API URL: $SERVICE_URL/api" -ForegroundColor Cyan
Write-Host "Health: $SERVICE_URL/api/health" -ForegroundColor Cyan
Write-Host ""

# Step 10: Update frontend
Write-Host "[10/10] Updating frontend..." -ForegroundColor Yellow

# Try Flutter first
$FLUTTER_PATHS = @(
    "E:\Altayar82\lib\core\config\app_config.dart",
    "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart"
)
$flutterFound = $false
foreach ($path in $FLUTTER_PATHS) {
    if (Test-Path $path) {
        node update-frontend-config.js $SERVICE_URL 2>$null
        Write-Host "OK: Flutter frontend updated ($path)" -ForegroundColor Green
        $flutterFound = $true
        break
    }
}

# Try React Native
$RN_PATHS = @(
    "E:\Altayar82\src\services\api.ts",
    "E:\Altayar82\src\services\apiClient.ts",
    "E:\Altayar82\src\config\api.ts"
)
$rnFound = $false
foreach ($path in $RN_PATHS) {
    if (Test-Path $path) {
        node update-react-native-config.js $SERVICE_URL 2>$null
        Write-Host "OK: React Native frontend updated ($path)" -ForegroundColor Green
        $rnFound = $true
        break
    }
}

if (-not $flutterFound -and -not $rnFound) {
    Write-Host "WARNING: Frontend config not found" -ForegroundColor Yellow
    Write-Host "Please update manually:" -ForegroundColor Cyan
    Write-Host "  Flutter: node update-frontend-config.js $SERVICE_URL" -ForegroundColor White
    Write-Host "  React Native: node update-react-native-config.js $SERVICE_URL" -ForegroundColor White
}
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run migrations (see FINAL_DEPLOYMENT_STEPS.md)" -ForegroundColor White
Write-Host "2. Test API: curl $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "3. Update FRONTEND_URL in .env if needed" -ForegroundColor White
Write-Host ""

