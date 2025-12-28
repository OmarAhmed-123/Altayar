# ========================================
# Monitor Deployment and Auto-Fix Issues
# ========================================

$ErrorActionPreference = "Continue"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$SERVICE_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Monitoring Deployment Status" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$maxWait = 600 # 10 minutes max
$elapsed = 0
$checkInterval = 15 # Check every 15 seconds

while ($elapsed -lt $maxWait) {
    Write-Host "Checking deployment status... (${elapsed}s elapsed)" -ForegroundColor Yellow
    
    # Check if service is responding
    try {
        $health = Invoke-WebRequest -Uri "$SERVICE_URL/api/health" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($health.StatusCode -eq 200) {
            Write-Host "OK: Health check passed" -ForegroundColor Green
            
            # Test OAuth config
            try {
                $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
                if ($oauth.StatusCode -eq 200) {
                    Write-Host ""
                    Write-Host "========================================" -ForegroundColor Cyan
                    Write-Host "SUCCESS! Everything is working!" -ForegroundColor Green
                    Write-Host "========================================" -ForegroundColor Cyan
                    Write-Host ""
                    Write-Host "OAuth Config Response:" -ForegroundColor Yellow
                    Write-Host $oauth.Content -ForegroundColor White
                    Write-Host ""
                    Write-Host "Service URL: $SERVICE_URL" -ForegroundColor White
                    Write-Host "OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
                    Write-Host ""
                    exit 0
                } else {
                    Write-Host "WARNING: OAuth config returned status $($oauth.StatusCode)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "WARNING: OAuth config not ready yet - $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "Service not ready yet, waiting..." -ForegroundColor Gray
    }
    
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
}

Write-Host ""
Write-Host "Timeout reached. Checking final status..." -ForegroundColor Yellow

# Final check
try {
    $oauth = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    Write-Host "SUCCESS: OAuth config is working!" -ForegroundColor Green
    Write-Host "Response: $($oauth.Content)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: OAuth config still not working" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking logs..." -ForegroundColor Yellow
    gcloud run services logs read $SERVICE_NAME --region $REGION --limit 20 --project $PROJECT_ID 2>&1 | Select-Object -Last 10
}

Write-Host ""

