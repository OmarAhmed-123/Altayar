# Force reopen billing account script

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "hybrid-unity-481421-m7"
$BILLING_ACCOUNT_ID = "018808-E12F47-5E15FF"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Force Reopen Billing Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Billing Account: $BILLING_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host ""

# Check billing account status
Write-Host "Checking billing account status..." -ForegroundColor Yellow
$accountInfo = & $GCLOUD_CMD billing accounts describe $BILLING_ACCOUNT_ID --format="json" 2>&1

if ($LASTEXITCODE -eq 0) {
    $accountJson = $accountInfo | ConvertFrom-Json
    $isOpen = $accountJson.open
    
    if ($isOpen) {
        Write-Host "OK: Billing account is already open!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Linking to project..." -ForegroundColor Yellow
        $linkResult = & $GCLOUD_CMD billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Billing account linked successfully!" -ForegroundColor Green
            exit 0
        }
    } else {
        Write-Host "ERROR: Billing account is CLOSED" -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host "WARNING: Could not check billing account status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "BILLING ACCOUNT IS CLOSED" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "The billing account is closed and cannot be reopened automatically." -ForegroundColor Yellow
Write-Host ""
Write-Host "Solutions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. MANUAL REOPEN (Try this first):" -ForegroundColor Yellow
Write-Host "   Go to: https://console.cloud.google.com/billing/$BILLING_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host "   Look for 'Reopen' or 'Reactivate' button" -ForegroundColor White
Write-Host "   If found, click it and follow instructions" -ForegroundColor White
Write-Host ""
Write-Host "2. CREATE NEW BILLING ACCOUNT (Recommended):" -ForegroundColor Yellow
Write-Host "   Go to: https://console.cloud.google.com/billing/create" -ForegroundColor Cyan
Write-Host "   Create new account and link it to project" -ForegroundColor White
Write-Host ""
Write-Host "3. USE RAILWAY (Easiest - Free, No Billing!):" -ForegroundColor Yellow
Write-Host "   See: RAILWAY_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host "   Railway is free and doesn't need billing!" -ForegroundColor Green
Write-Host ""
Write-Host "4. USE RENDER (Free Alternative):" -ForegroundColor Yellow
Write-Host "   See: RENDER_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

# Try to unlink and create new
Write-Host "Would you like to:" -ForegroundColor Cyan
Write-Host "A) Try to create new billing account link" -ForegroundColor White
Write-Host "B) Use Railway instead (recommended)" -ForegroundColor White
Write-Host "C) Exit and do it manually" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice (A/B/C)"

if ($choice -eq "B" -or $choice -eq "b") {
    Write-Host ""
    Write-Host "Opening Railway deployment guide..." -ForegroundColor Cyan
    Write-Host "See: RAILWAY_DEPLOYMENT.md" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Railway is the easiest solution:" -ForegroundColor Green
    Write-Host "- Free ($5 credit/month)" -ForegroundColor White
    Write-Host "- No billing needed" -ForegroundColor White
    Write-Host "- Deploy in 5 minutes" -ForegroundColor White
    Write-Host "- Free PostgreSQL database" -ForegroundColor White
    Write-Host ""
} elseif ($choice -eq "A" -or $choice -eq "a") {
    Write-Host ""
    Write-Host "Opening billing creation page..." -ForegroundColor Cyan
    Write-Host "Please create a new billing account:" -ForegroundColor Yellow
    Write-Host "https://console.cloud.google.com/billing/create" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""

