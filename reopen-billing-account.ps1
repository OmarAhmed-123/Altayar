# Script to reopen closed billing account

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayar-46d6f"
$BILLING_ACCOUNT_ID = "01A9EE-92CE19-7CF271"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reopen Billing Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project ID: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Billing Account ID: $BILLING_ACCOUNT_ID" -ForegroundColor Yellow
Write-Host ""

# Check current billing status
Write-Host "Checking billing status..." -ForegroundColor Yellow
$billingInfo = & $GCLOUD_CMD billing projects describe $PROJECT_ID 2>&1

if ($LASTEXITCODE -eq 0) {
    $currentBilling = & $GCLOUD_CMD billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>&1
    if ($currentBilling) {
        Write-Host "OK: Project already has billing account: $currentBilling" -ForegroundColor Green
        exit 0
    }
}

Write-Host "WARNING: No billing account linked or account is closed" -ForegroundColor Yellow
Write-Host ""

# Try to link the billing account
Write-Host "Attempting to link billing account..." -ForegroundColor Yellow
$linkResult = & $GCLOUD_CMD billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Billing account linked successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: .\deploy-fixed.ps1" -ForegroundColor Cyan
} else {
    Write-Host "ERROR: Could not link billing account" -ForegroundColor Red
    Write-Host ""
    Write-Host "The billing account might be closed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Cyan
    Write-Host "1. Reopen the billing account manually:" -ForegroundColor White
    Write-Host "   https://console.cloud.google.com/billing/$BILLING_ACCOUNT_ID" -ForegroundColor Cyan
    Write-Host "   Look for 'Reopen' or 'Reactivate' button" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Create a new billing account:" -ForegroundColor White
    Write-Host "   https://console.cloud.google.com/billing/create" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Use Railway (free, no billing needed):" -ForegroundColor White
    Write-Host "   See RAILWAY_DEPLOYMENT.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""

