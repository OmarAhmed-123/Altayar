# PowerShell script to start Cloud SQL database instance
# Usage: .\start-database.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "تشغيل قاعدة البيانات على Google Cloud" -ForegroundColor Cyan
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
    
    if ($currentState -eq "STOPPED") {
        Write-Host ""
        Write-Host "▶️  Starting Cloud SQL instance..." -ForegroundColor Yellow
        Write-Host "⏳ This may take a few minutes..." -ForegroundColor Cyan
        gcloud sql instances patch $INSTANCE_NAME --activation-policy=ALWAYS
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Database instance started successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "⏳ Waiting for instance to be ready..." -ForegroundColor Cyan
            
            # Wait for instance to become RUNNABLE
            $maxWaitTime = 300 # 5 minutes
            $elapsedTime = 0
            $checkInterval = 10 # Check every 10 seconds
            
            while ($elapsedTime -lt $maxWaitTime) {
                Start-Sleep -Seconds $checkInterval
                $elapsedTime += $checkInterval
                
                $newState = gcloud sql instances describe $INSTANCE_NAME --format="value(state)" 2>&1
                Write-Host "⏳ Current state: $newState - waiting... ($elapsedTime seconds)" -ForegroundColor Gray
                
                if ($newState -eq "RUNNABLE") {
                    Write-Host ""
                    Write-Host "✅ Instance is now RUNNABLE and ready to accept connections!" -ForegroundColor Green
                    break
                }
            }
            
            if ($elapsedTime -ge $maxWaitTime) {
                Write-Host ""
                Write-Host "⚠️  Timeout waiting for instance to become RUNNABLE" -ForegroundColor Yellow
                Write-Host "⚠️  Please check the instance status manually" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Failed to start instance" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    } elseif ($currentState -eq "RUNNABLE") {
        Write-Host ""
        Write-Host "ℹ️  Instance is already running" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "⚠️  Instance is in state: $currentState" -ForegroundColor Yellow
        Write-Host "⚠️  Please wait for the instance to be in a stable state" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error checking instance status: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"

