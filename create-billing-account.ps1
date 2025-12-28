# Script to help create and link billing account

$PROJECT_ID = "altayarback"
$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Billing Account Setup Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Current project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

# Check current billing status
Write-Host "Checking current billing status..." -ForegroundColor Yellow
$billingInfo = & $GCLOUD_CMD billing projects describe $PROJECT_ID 2>&1

if ($LASTEXITCODE -eq 0) {
    $billingAccount = & $GCLOUD_CMD billing projects describe $PROJECT_ID --format="value(billingAccountName)"
    if ($billingAccount) {
        Write-Host "OK: Billing account is already linked!" -ForegroundColor Green
        Write-Host "Billing Account: $billingAccount" -ForegroundColor Cyan
        exit 0
    }
}

Write-Host "WARNING: No billing account linked to project" -ForegroundColor Yellow
Write-Host ""

# List available billing accounts
Write-Host "Checking available billing accounts..." -ForegroundColor Yellow
$accounts = & $GCLOUD_CMD billing accounts list --format="table(name,displayName,open)" 2>&1

if ($LASTEXITCODE -eq 0 -and $accounts -notmatch "Listed 0 items") {
    Write-Host ""
    Write-Host "Available billing accounts:" -ForegroundColor Cyan
    Write-Host $accounts
    Write-Host ""
    Write-Host "If you see any accounts with 'True' in the 'open' column," -ForegroundColor Yellow
    Write-Host "you can link them to the project." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "No active billing accounts found" -ForegroundColor Red
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create a new billing account:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/billing/create" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Link it to your project:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/billing?project=$PROJECT_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Or use the command line:" -ForegroundColor White
Write-Host "   gcloud billing accounts list" -ForegroundColor Cyan
Write-Host "   gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID" -ForegroundColor Cyan
Write-Host ""
Write-Host "See FIX_BILLING_ACCOUNT.md for detailed instructions" -ForegroundColor Yellow
Write-Host ""

