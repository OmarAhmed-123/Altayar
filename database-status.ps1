# PowerShell script to check Cloud SQL database instance status
# Usage: .\database-status.ps1

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "حالة قاعدة البيانات على Google Cloud" -ForegroundColor Cyan
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
    Read-Host "Press Enter to exit"
    exit 1
}

# Set the project
gcloud config set project $PROJECT_ID

# Get instance information
Write-Host "📊 Instance Information:" -ForegroundColor Cyan
Write-Host ""

try {
    $instanceInfo = gcloud sql instances describe $INSTANCE_NAME --format="json" 2>&1 | ConvertFrom-Json
    
    if ($instanceInfo) {
        Write-Host "Name: $($instanceInfo.name)" -ForegroundColor White
        Write-Host "State: $($instanceInfo.state)" -ForegroundColor White
        Write-Host "Database Version: $($instanceInfo.databaseVersion)" -ForegroundColor White
        Write-Host "Tier: $($instanceInfo.settings.tier)" -ForegroundColor White
        Write-Host "Disk Size: $($instanceInfo.settings.dataDiskSizeGb) GB" -ForegroundColor White
        Write-Host "Connection Name: $($instanceInfo.connectionName)" -ForegroundColor White
        
        if ($instanceInfo.ipAddresses -and $instanceInfo.ipAddresses.Count -gt 0) {
            $publicIP = ($instanceInfo.ipAddresses | Where-Object { $_.type -eq "PRIMARY" }).ipAddress
            if ($publicIP) {
                Write-Host "Public IP: $publicIP" -ForegroundColor White
            }
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Status message
        $state = $instanceInfo.state
        if ($state -eq "RUNNABLE") {
            Write-Host "✅ Status: RUNNABLE - Database is running" -ForegroundColor Green
        } elseif ($state -eq "STOPPED") {
            Write-Host "🛑 Status: STOPPED - Database is stopped" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Status: $state" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to get instance information" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Read-Host "Press Enter to exit"

