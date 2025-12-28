# PowerShell script to fix Cloud Run database connection
# This script updates the Cloud Run service with correct database environment variables

$ErrorActionPreference = "Stop"

Write-Host "🔧 Fixing Cloud Run Database Connection" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

Write-Host "📋 Configuration:" -ForegroundColor Cyan
Write-Host "   Project ID: $PROJECT_ID" -ForegroundColor White
Write-Host "   Service: $SERVICE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host "   Cloud SQL: $CONNECTION_NAME" -ForegroundColor White
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>$null
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host "🔧 Setting project..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project" -ForegroundColor Red
    exit 1
}

# Get database password
Write-Host ""
Write-Host "🔐 Database Configuration" -ForegroundColor Cyan
$dbPassword = Read-Host "Enter Cloud SQL database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Get or generate JWT secret
$jwtSecret = Read-Host "Enter JWT_SECRET (or press Enter to generate new one)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "✅ Generated new JWT_SECRET" -ForegroundColor Green
}

# Get or generate Session secret
$sessionSecret = Read-Host "Enter SESSION_SECRET (or press Enter to generate new one)"
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
    $sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "✅ Generated new SESSION_SECRET" -ForegroundColor Green
}

Write-Host ""
Write-Host "📤 Updating Cloud Run service..." -ForegroundColor Cyan
Write-Host "   This may take 1-2 minutes..." -ForegroundColor Yellow
Write-Host ""

# Update Cloud Run service with environment variables
# CRITICAL: Use Cloud SQL Proxy connection string
$envVars = @(
    "NODE_ENV=production",
    "PORT=8080",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$dbPasswordPlain",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com"
) -join ","

gcloud run services update $SERVICE_NAME `
    --region $REGION `
    --project $PROJECT_ID `
    --add-cloudsql-instances $CONNECTION_NAME `
    --update-env-vars $envVars `
    --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Cloud Run service updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Updated Environment Variables:" -ForegroundColor Cyan
    Write-Host "   DB_HOST=/cloudsql/$CONNECTION_NAME" -ForegroundColor White
    Write-Host "   DB_PORT=5432" -ForegroundColor White
    Write-Host "   DB_USER=postgres" -ForegroundColor White
    Write-Host "   DB_NAME=tourist_app_db" -ForegroundColor White
    Write-Host "   NODE_ENV=production" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Verifying service..." -ForegroundColor Cyan
    
    # Wait a bit for service to update
    Start-Sleep -Seconds 10
    
    # Test health endpoint
    $healthUrl = "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health"
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 30 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "✅ Service is responding!" -ForegroundColor Green
            Write-Host "   Status: $($healthData.status)" -ForegroundColor White
            Write-Host "   Database: $($healthData.database.status)" -ForegroundColor White
            Write-Host ""
            
            if ($healthData.database.status -eq "connected") {
                Write-Host "🎉 SUCCESS! Database connection is working!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Service is running but database is not connected yet." -ForegroundColor Yellow
                Write-Host "   This may take a few more seconds. Please check again." -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "⚠️  Could not verify service health (this is normal if service is still updating)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Test the API:" -ForegroundColor White
    Write-Host "   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test registration/login:" -ForegroundColor White
    Write-Host "   POST https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/register" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. If database is still not connected:" -ForegroundColor White
    Write-Host "   - Check Cloud SQL instance is running" -ForegroundColor Gray
    Write-Host "   - Verify Cloud SQL instance is linked to Cloud Run service" -ForegroundColor Gray
    Write-Host "   - Check Cloud Run logs: gcloud run services logs read $SERVICE_NAME --region $REGION" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to update Cloud Run service" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Manual Setup Instructions:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor White
    Write-Host "2. Click on service: $SERVICE_NAME" -ForegroundColor White
    Write-Host "3. Click 'Edit & Deploy New Revision'" -ForegroundColor White
    Write-Host "4. In 'Connections' section, add Cloud SQL instance: $CONNECTION_NAME" -ForegroundColor White
    Write-Host "5. In 'Variables & Secrets' section, add these environment variables:" -ForegroundColor White
    Write-Host "   - NODE_ENV = production" -ForegroundColor Gray
    Write-Host "   - PORT = 8080" -ForegroundColor Gray
    Write-Host "   - DB_HOST = /cloudsql/$CONNECTION_NAME" -ForegroundColor Gray
    Write-Host "   - DB_PORT = 5432" -ForegroundColor Gray
    Write-Host "   - DB_USER = postgres" -ForegroundColor Gray
    Write-Host "   - DB_PASSWORD = [your password]" -ForegroundColor Gray
    Write-Host "   - DB_NAME = tourist_app_db" -ForegroundColor Gray
    Write-Host "   - JWT_SECRET = [your secret]" -ForegroundColor Gray
    Write-Host "   - SESSION_SECRET = [your secret]" -ForegroundColor Gray
    Write-Host "   - FRONTEND_URL = https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com" -ForegroundColor Gray
    Write-Host "6. Click 'Deploy'" -ForegroundColor White
    Write-Host ""
    exit 1
}

