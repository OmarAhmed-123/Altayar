# Script to help create and link new billing account

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "hybrid-unity-481421-m7"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Create New Billing Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

Write-Host "The current billing account cannot be reopened." -ForegroundColor Yellow
Write-Host "You need to create a NEW billing account." -ForegroundColor Yellow
Write-Host ""

Write-Host "Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create new billing account:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/billing/create" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. After creating, get the billing account ID:" -ForegroundColor White
Write-Host "   Run: gcloud billing accounts list" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Link it to project:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/billing?project=$PROJECT_ID" -ForegroundColor Cyan
Write-Host "   Or use command line (see below)" -ForegroundColor White
Write-Host ""

# List existing accounts
Write-Host "Current billing accounts:" -ForegroundColor Yellow
$accounts = & $GCLOUD_CMD billing accounts list --format="table(name,displayName,open)" 2>&1
Write-Host $accounts
Write-Host ""

Write-Host "After creating new account, you can link it:" -ForegroundColor Cyan
Write-Host "gcloud billing projects link $PROJECT_ID --billing-account=NEW_BILLING_ACCOUNT_ID" -ForegroundColor White
Write-Host ""

Write-Host "Or use Railway (free, no billing needed):" -ForegroundColor Green
Write-Host "See: RAILWAY_DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""

