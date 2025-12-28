$ErrorActionPreference = "Continue"
$SERVICE_URL = "https://altayar-backend-kuwjte4rda-uc.a.run.app"

Write-Host "Testing OAuth Config Endpoint..." -ForegroundColor Yellow
Write-Host ""

# Test multiple times with retries
for ($i = 1; $i -le 5; $i++) {
    Write-Host "Attempt $i/5..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$SERVICE_URL/api/oauth/config" -UseBasicParsing -TimeoutSec 20 -ErrorAction Stop
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "SUCCESS! OAuth Config is Working!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Yellow
        Write-Host $response.Content -ForegroundColor White
        Write-Host ""
        exit 0
    } catch {
        Write-Host "Attempt $i failed: $($_.Exception.Message)" -ForegroundColor Yellow
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Status Code: $statusCode" -ForegroundColor Red
        }
        if ($i -lt 5) {
            Write-Host "Waiting 10 seconds before retry..." -ForegroundColor Gray
            Start-Sleep -Seconds 10
        }
    }
}

Write-Host ""
Write-Host "All attempts failed. The endpoint is still returning 404." -ForegroundColor Red
Write-Host "This means the deployment may not have completed yet or the route is not registered." -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait 2-3 more minutes for deployment to complete" -ForegroundColor White
Write-Host "2. Check if the code was deployed: The route should be in server.js line 445" -ForegroundColor White
Write-Host "3. Verify deployment: gcloud run services describe altayar-backend --region us-central1" -ForegroundColor White
Write-Host ""

