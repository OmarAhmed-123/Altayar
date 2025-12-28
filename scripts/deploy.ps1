# PowerShell deployment script for Google Cloud Run
# This script handles the complete deployment process on Windows

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting deployment to Google Cloud Run..." -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>$null
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check if user is authenticated
$authStatus = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>$null
if (-not $authStatus) {
    Write-Host "⚠️  Not authenticated with gcloud" -ForegroundColor Yellow
    Write-Host "Running: gcloud auth login" -ForegroundColor Yellow
    gcloud auth login
}

# Get project ID
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "❌ Error: No Google Cloud project set" -ForegroundColor Red
    Write-Host "Please set a project: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project ID: $PROJECT_ID" -ForegroundColor Green

# Check if Cairo fonts exist (check multiple locations)
$regularFont = "assets\fonts\Cairo-Regular.ttf"
$boldFont = "assets\fonts\Cairo-Bold.ttf"
$regularFontStatic = "assets\fonts\static\Cairo-Regular.ttf"
$boldFontStatic = "assets\fonts\static\Cairo-Bold.ttf"

$fontsFound = $false
if ((Test-Path $regularFont) -and (Test-Path $boldFont)) {
    Write-Host "✅ Cairo fonts found in assets\fonts\" -ForegroundColor Green
    $fontsFound = $true
} elseif ((Test-Path $regularFontStatic) -and (Test-Path $boldFontStatic)) {
    Write-Host "✅ Cairo fonts found in assets\fonts\static\" -ForegroundColor Green
    $fontsFound = $true
}

if (-not $fontsFound) {
    Write-Host "⚠️  Warning: Cairo fonts not found" -ForegroundColor Yellow
    Write-Host "Arabic text in PDFs may not display correctly." -ForegroundColor Yellow
    Write-Host "To fix: Download Cairo fonts from https://fonts.google.com/specimen/Cairo" -ForegroundColor Yellow
    Write-Host "        and place them in assets\fonts\ or assets\fonts\static\" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Set deployment variables
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

Write-Host ""
Write-Host "📦 Building Docker image..." -ForegroundColor Cyan
Write-Host "   (This may take a few minutes...)" -ForegroundColor Gray

# Try building with --no-cache first if previous build failed
# This ensures a clean build and fixes "parent snapshot does not exist" errors
Write-Host "   Cleaning Docker build cache..." -ForegroundColor Gray
docker builder prune -f | Out-Null

# Build with progress output
docker build --progress=plain -t "${IMAGE_NAME}:latest" .

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Docker build failed. Trying with --no-cache..." -ForegroundColor Yellow
    Write-Host "   (This will take longer but should fix cache issues)" -ForegroundColor Gray
    
    # Retry with --no-cache to fix snapshot issues
    docker build --no-cache --progress=plain -t "${IMAGE_NAME}:latest" .
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Docker build failed even with --no-cache" -ForegroundColor Red
        Write-Host "   Please check Docker logs and try:" -ForegroundColor Yellow
        Write-Host "   1. docker system prune -a" -ForegroundColor Yellow
        Write-Host "   2. Restart Docker Desktop" -ForegroundColor Yellow
        Write-Host "   3. Try building manually: docker build -t test-image ." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "📤 Pushing image to Google Container Registry..." -ForegroundColor Cyan
docker push "${IMAGE_NAME}:latest"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying to Cloud Run..." -ForegroundColor Cyan
# PORT is automatically set by Cloud Run (usually 8080), don't set it manually
# --concurrency 80 allows handling multiple requests per instance (important for concurrent registrations)
gcloud run deploy $SERVICE_NAME `
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
    --concurrency 80 `
    --set-env-vars "NODE_ENV=production"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Service URL:" -ForegroundColor Cyan
$serviceUrl = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)"
Write-Host $serviceUrl -ForegroundColor White
Write-Host ""
Write-Host "📊 View logs:" -ForegroundColor Cyan
$logCommand = "gcloud run services logs read $SERVICE_NAME --region $REGION"
Write-Host $logCommand -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Run the log command above to see deployment logs" -ForegroundColor Gray
Write-Host ""

