# PowerShell script to view Cloud Run service logs
# This helps diagnose database connection issues

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cloud Run Service Logs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Fetching latest logs (last 100 lines)..." -ForegroundColor Cyan
Write-Host ""

# Get logs
$logs = gcloud run services logs read $SERVICE_NAME --region $REGION --limit 100 2>&1

# Filter for database-related logs
Write-Host "=== Database Connection Logs ===" -ForegroundColor Yellow
$logs | Select-String -Pattern "DB|database|Database|PostgreSQL|ECONNREFUSED|Cloud SQL|socket|connection" -Context 2,2 | ForEach-Object {
    if ($_.Line -match "DB|database|Database|PostgreSQL|ECONNREFUSED|Cloud SQL|socket|connection") {
        if ($_.Line -match "ERROR|FAILED|ECONNREFUSED") {
            Write-Host $_.Line -ForegroundColor Red
        } elseif ($_.Line -match "SUCCESS|Connected|connected") {
            Write-Host $_.Line -ForegroundColor Green
        } else {
            Write-Host $_.Line -ForegroundColor White
        }
    }
}

Write-Host ""
Write-Host "=== All Recent Logs ===" -ForegroundColor Yellow
$logs | Select-Object -Last 50 | ForEach-Object {
    Write-Host $_ -ForegroundColor Gray
}

Write-Host ""
Write-Host "To see more logs, run:" -ForegroundColor Cyan
Write-Host "   gcloud run services logs read $SERVICE_NAME --region $REGION --limit 500" -ForegroundColor Gray
Write-Host ""

