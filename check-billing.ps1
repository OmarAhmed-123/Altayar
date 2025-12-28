# Check if billing is enabled for the project

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayar-46d6f"
$BILLING_ACCOUNT_ID = "01A9EE-92CE19-7CF271"

Write-Host "Checking billing status for project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host ""

# Check billing account
$billingInfo = & $GCLOUD_CMD billing projects describe $PROJECT_ID 2>&1

if ($LASTEXITCODE -eq 0) {
    $billingAccount = & $GCLOUD_CMD billing projects describe $PROJECT_ID --format="value(billingAccountName)"
    if ($billingAccount) {
        Write-Host "OK: Billing account is enabled" -ForegroundColor Green
        Write-Host "Billing Account: $billingAccount" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "ERROR: No billing account linked" -ForegroundColor Red
    }
} else {
    Write-Host "ERROR: Billing account not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Please enable billing:" -ForegroundColor Yellow
Write-Host "1. Go to: https://console.cloud.google.com/billing?project=$PROJECT_ID" -ForegroundColor Cyan
Write-Host "2. Link or create a billing account" -ForegroundColor Cyan
Write-Host ""
Write-Host "See ENABLE_BILLING.md for detailed instructions" -ForegroundColor Yellow

exit 1

