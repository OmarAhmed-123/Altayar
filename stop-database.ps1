# PowerShell script to stop/shutdown Cloud SQL database instance
# Usage: .\stop-database.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "إيقاف قاعدة البيانات على Google Cloud" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$INSTANCE_NAME = "altayar-db"
$REGION = "us-central1"

# Check if gcloud is installed
try {
    $null = gcloud --version 2>$null
} catch {
    Write-Host "❌ Error: gcloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud SDK first" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Set the project
Write-Host "🔧 Setting project to $PROJECT_ID..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check current instance status
Write-Host ""
Write-Host "📊 Checking current instance status..." -ForegroundColor Cyan
try {
    $currentState = gcloud sql instances describe $INSTANCE_NAME --format="value(state)" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Instance $INSTANCE_NAME not found!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "Current state: $currentState" -ForegroundColor White
    
    if ($currentState -eq "RUNNABLE") {
        Write-Host ""
        Write-Host "🛑 Stopping Cloud SQL instance..." -ForegroundColor Yellow
        gcloud sql instances patch $INSTANCE_NAME --activation-policy=NEVER
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Database instance stopped successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "ℹ️  The instance is now stopped and will not incur charges." -ForegroundColor Cyan
            Write-Host "ℹ️  Use start-database.ps1 to start it again." -ForegroundColor Cyan
        } else {
            Write-Host "❌ Failed to stop instance" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    } elseif ($currentState -eq "STOPPED") {
        Write-Host ""
        Write-Host "ℹ️  Instance is already stopped" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  Instance is in state: $currentState" -ForegroundColor Yellow
        Write-Host "⚠️  Cannot stop instance in this state" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking instance status: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"

