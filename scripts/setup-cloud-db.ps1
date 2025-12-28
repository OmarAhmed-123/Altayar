# PowerShell script to set up Cloud SQL database connection for Cloud Run
# This script helps configure the database connection on Google Cloud Run

$ErrorActionPreference = "Stop"

Write-Host "🔧 Cloud SQL Database Setup for Cloud Run" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $null = gcloud --version 2>$null
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Get project ID
$PROJECT_ID = gcloud config get-value project 2>$null
if (-not $PROJECT_ID) {
    Write-Host "❌ Error: No Google Cloud project set" -ForegroundColor Red
    Write-Host "Please set a project: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project ID: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Check for existing Cloud SQL instances
Write-Host "🔍 Checking for existing Cloud SQL instances..." -ForegroundColor Cyan
$instances = gcloud sql instances list --format="value(name)" 2>$null

if ($instances) {
    Write-Host "✅ Found Cloud SQL instances:" -ForegroundColor Green
    $instances | ForEach-Object { Write-Host "   - $_" -ForegroundColor White }
    Write-Host ""
    
    $useExisting = Read-Host "Use existing instance? (y/n)"
    if ($useExisting -eq "y" -or $useExisting -eq "Y") {
        $instanceName = Read-Host "Enter instance name"
        $CONNECTION_NAME = gcloud sql instances describe $instanceName --format="value(connectionName)" 2>$null
        
        if (-not $CONNECTION_NAME) {
            Write-Host "❌ Error: Could not get connection name for instance: $instanceName" -ForegroundColor Red
            exit 1
        }
    } else {
        $instanceName = $null
    }
} else {
    Write-Host "⚠️  No Cloud SQL instances found" -ForegroundColor Yellow
    $instanceName = $null
}

# If no instance selected, create new one
if (-not $instanceName) {
    Write-Host ""
    Write-Host "📋 To create a new Cloud SQL instance, run:" -ForegroundColor Cyan
    Write-Host "   gcloud sql instances create altayar-db \" -ForegroundColor White
    Write-Host "       --database-version=POSTGRES_15 \" -ForegroundColor Gray
    Write-Host "       --tier=db-f1-micro \" -ForegroundColor Gray
    Write-Host "       --region=us-central1 \" -ForegroundColor Gray
    Write-Host "       --root-password=YOUR_SECURE_PASSWORD" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Then create database:" -ForegroundColor Cyan
    Write-Host "   gcloud sql databases create tourist_app_db --instance=altayar-db" -ForegroundColor White
    Write-Host ""
    
    $createNow = Read-Host "Create instance now? (y/n)"
    if ($createNow -eq "y" -or $createNow -eq "Y") {
        $dbPassword = Read-Host "Enter database password (min 8 characters)" -AsSecureString
        $dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
        )
        
        Write-Host ""
        Write-Host "Creating Cloud SQL instance (this may take 5-10 minutes)..." -ForegroundColor Yellow
        gcloud sql instances create altayar-db `
            --database-version=POSTGRES_15 `
            --tier=db-f1-micro `
            --region=us-central1 `
            --root-password=$dbPasswordPlain
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Instance created successfully" -ForegroundColor Green
            
            Write-Host "Creating database..." -ForegroundColor Yellow
            gcloud sql databases create tourist_app_db --instance=altayar-db
            
            $CONNECTION_NAME = gcloud sql instances describe altayar-db --format="value(connectionName)" 2>$null
            $instanceName = "altayar-db"
        } else {
            Write-Host "❌ Failed to create instance" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  Skipping instance creation. Please create it manually and run this script again." -ForegroundColor Yellow
        exit 0
    }
}

# Get connection name if not already set
if (-not $CONNECTION_NAME) {
    $CONNECTION_NAME = gcloud sql instances describe $instanceName --format="value(connectionName)" 2>$null
}

Write-Host ""
Write-Host "✅ Connection Name: $CONNECTION_NAME" -ForegroundColor Green
Write-Host ""

# Get database password
$dbPassword = Read-Host "Enter database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

# Generate secrets
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$sessionSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host ""
Write-Host "📤 Updating Cloud Run service with database configuration..." -ForegroundColor Cyan

# Update Cloud Run service
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"

# Update environment variables
gcloud run services update $SERVICE_NAME `
    --region $REGION `
    --add-cloudsql-instances $CONNECTION_NAME `
    --update-env-vars "NODE_ENV=production,DB_HOST=/cloudsql/$CONNECTION_NAME,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$dbPasswordPlain,DB_NAME=tourist_app_db,JWT_SECRET=$jwtSecret,SESSION_SECRET=$sessionSecret"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Cloud Run service updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run migrations on Cloud Run:" -ForegroundColor White
    Write-Host "   See: DATABASE_SETUP.md for instructions" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Test the service:" -ForegroundColor White
    Write-Host "   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to update Cloud Run service" -ForegroundColor Red
    Write-Host ""
    Write-Host "📋 Manual setup:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor White
    Write-Host "2. Click on service: $SERVICE_NAME" -ForegroundColor White
    Write-Host "3. Edit & Deploy New Revision" -ForegroundColor White
    Write-Host "4. Connections > Add Cloud SQL instance: $CONNECTION_NAME" -ForegroundColor White
    Write-Host "5. Variables & Secrets > Add these variables:" -ForegroundColor White
    Write-Host "   DB_HOST=/cloudsql/$CONNECTION_NAME" -ForegroundColor Gray
    Write-Host "   DB_PORT=5432" -ForegroundColor Gray
    Write-Host "   DB_USER=postgres" -ForegroundColor Gray
    Write-Host "   DB_PASSWORD=$dbPasswordPlain" -ForegroundColor Gray
    Write-Host "   DB_NAME=tourist_app_db" -ForegroundColor Gray
    Write-Host "   JWT_SECRET=$jwtSecret" -ForegroundColor Gray
    Write-Host "   SESSION_SECRET=$sessionSecret" -ForegroundColor Gray
    Write-Host ""
}

