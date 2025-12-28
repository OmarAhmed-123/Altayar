# Altayar Backend Deployment Script (PowerShell)
# This script handles all deployment steps

$ErrorActionPreference = "Stop"

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayarback"
$REGION = "us-central1"
$SERVICE_NAME = "altayar-backend"
$INSTANCE_NAME = "altayar-db"
$DATABASE_NAME = "tourist_app_db"
$DB_USER = "postgres"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Altayar Backend Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verify gcloud exists
if (-not (Test-Path $GCLOUD_CMD)) {
    Write-Host "ERROR: gcloud not found at: $GCLOUD_CMD" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Using gcloud at: $GCLOUD_CMD" -ForegroundColor Green
Write-Host ""

# Step 1: Set project
Write-Host "[1/8] Setting project..." -ForegroundColor Yellow
& $GCLOUD_CMD config set project $PROJECT_ID
Write-Host "OK: Project set to: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Step 2: Enable APIs
Write-Host "[2/8] Enabling APIs..." -ForegroundColor Yellow
& $GCLOUD_CMD services enable cloudbuild.googleapis.com --quiet
& $GCLOUD_CMD services enable run.googleapis.com --quiet
& $GCLOUD_CMD services enable sqladmin.googleapis.com --quiet
& $GCLOUD_CMD services enable containerregistry.googleapis.com --quiet
Write-Host "OK: APIs enabled" -ForegroundColor Green
Write-Host ""

# Step 3: Check/Create Cloud SQL
Write-Host "[3/8] Setting up Cloud SQL..." -ForegroundColor Yellow
$instanceExists = & $GCLOUD_CMD sql instances describe $INSTANCE_NAME 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Creating Cloud SQL instance..." -ForegroundColor Yellow
    $dbPassword = Read-Host "Enter database root password (12+ chars)" -AsSecureString
    $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword))
    
    & $GCLOUD_CMD sql instances create $INSTANCE_NAME `
        --database-version=POSTGRES_15 `
        --tier=db-f1-micro `
        --region=$REGION `
        --root-password=$dbPasswordPlain `
        --storage-type=SSD `
        --storage-size=10GB `
        --backup-start-time=03:00 `
        --enable-bin-log `
        --maintenance-window-day=SUN `
        --maintenance-window-hour=4 `
        --quiet
    
    Start-Sleep -Seconds 30
    Write-Host "OK: Instance created" -ForegroundColor Green
} else {
    Write-Host "OK: Instance exists" -ForegroundColor Green
}

$CONNECTION_NAME = & $GCLOUD_CMD sql instances describe $INSTANCE_NAME --format="value(connectionName)"
Write-Host "Connection: $CONNECTION_NAME" -ForegroundColor Cyan

# Create database
$dbExists = & $GCLOUD_CMD sql databases describe $DATABASE_NAME --instance=$INSTANCE_NAME 2>&1
if ($LASTEXITCODE -ne 0) {
    & $GCLOUD_CMD sql databases create $DATABASE_NAME --instance=$INSTANCE_NAME --quiet
    Write-Host "OK: Database created" -ForegroundColor Green
} else {
    Write-Host "OK: Database exists" -ForegroundColor Green
}

# Create user
$userExists = & $GCLOUD_CMD sql users describe $DB_USER --instance=$INSTANCE_NAME 2>&1
if ($LASTEXITCODE -ne 0) {
    $userPassword = Read-Host "Enter password for user '$DB_USER'" -AsSecureString
    $userPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($userPassword))
    & $GCLOUD_CMD sql users create $DB_USER --instance=$INSTANCE_NAME --password=$userPasswordPlain --quiet
    Write-Host "OK: User created" -ForegroundColor Green
} else {
    Write-Host "OK: User exists" -ForegroundColor Green
}
Write-Host ""

# Step 4: Build Docker
Write-Host "[4/8] Building Docker image..." -ForegroundColor Yellow
docker build -t "${IMAGE_NAME}:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Image built" -ForegroundColor Green
Write-Host ""

# Step 5: Push
Write-Host "[5/8] Pushing image..." -ForegroundColor Yellow
docker push "${IMAGE_NAME}:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker push failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Image pushed" -ForegroundColor Green
Write-Host ""

# Step 6: Deploy
Write-Host "[6/8] Deploying to Cloud Run..." -ForegroundColor Yellow
& $GCLOUD_CMD run deploy $SERVICE_NAME `
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
    --set-env-vars "NODE_ENV=production,PORT=8080" `
    --project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Deployed" -ForegroundColor Green
Write-Host ""

# Step 7: Get URL
Write-Host "[7/8] Getting service URL..." -ForegroundColor Yellow
$SERVICE_URL = & $GCLOUD_CMD run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host "API URL: $SERVICE_URL/api" -ForegroundColor Cyan
Write-Host "Health: $SERVICE_URL/api/health" -ForegroundColor Cyan
Write-Host ""

# Step 8: Update frontend
Write-Host "[8/8] Updating frontend..." -ForegroundColor Yellow
$FRONTEND_CONFIG = "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart"
if (Test-Path $FRONTEND_CONFIG) {
    node update-frontend-config.js $SERVICE_URL 2>$null
    Write-Host "OK: Frontend updated" -ForegroundColor Green
} else {
    Write-Host "WARNING: Frontend config not found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Run migrations (see FINAL_DEPLOYMENT_STEPS.md)" -ForegroundColor White
Write-Host "2. Test API: curl $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "3. Update FRONTEND_URL in .env if needed" -ForegroundColor White
Write-Host ""

