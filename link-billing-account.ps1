# Script to link existing billing account to project

$PROJECT_ID = "altayar-46d6f"
$BILLING_ACCOUNT_ID = "01A9EE-92CE19-7CF271"
$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Link Billing Account to Project" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# List available billing accounts
Write-Host "Fetching available billing accounts..." -ForegroundColor Yellow
$accounts = & $GCLOUD_CMD billing accounts list --format="table(name,displayName,open)" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Could not fetch billing accounts" -ForegroundColor Red
    Write-Host "Please check your authentication: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Available billing accounts:" -ForegroundColor Cyan
Write-Host $accounts
Write-Host ""

# Check for open accounts
$openAccounts = & $GCLOUD_CMD billing accounts list --filter="open=true" --format="value(name)" 2>&1

if ($openAccounts -and $openAccounts.Count -gt 0) {
    Write-Host "Found open billing account(s)!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To link a billing account, use:" -ForegroundColor Yellow
    Write-Host "gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Replace BILLING_ACCOUNT_ID with one of the account IDs above" -ForegroundColor White
    Write-Host ""
    
    Write-Host ""
    Write-Host "Found billing account ID: $BILLING_ACCOUNT_ID" -ForegroundColor Cyan
    $useDefault = Read-Host "Use this billing account? (Y/n)"
    
    if ($useDefault -eq "" -or $useDefault -eq "Y" -or $useDefault -eq "y") {
        $accountId = $BILLING_ACCOUNT_ID
    } else {
        $accountId = Read-Host "Enter billing account ID to link"
    }
    
    if ($accountId) {
        Write-Host ""
        Write-Host "Linking billing account..." -ForegroundColor Yellow
        & $GCLOUD_CMD billing projects link $PROJECT_ID --billing-account=$accountId
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Billing account linked successfully!" -ForegroundColor Green
            Write-Host ""
            Write-Host "You can now run: .\deploy-fixed.ps1" -ForegroundColor Cyan
        } else {
            Write-Host "ERROR: Failed to link billing account" -ForegroundColor Red
            Write-Host "The account might be closed. Try to reopen it:" -ForegroundColor Yellow
            Write-Host "https://console.cloud.google.com/billing/$accountId" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "WARNING: No open billing accounts found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to create a new billing account:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.cloud.google.com/billing/create" -ForegroundColor Cyan
    Write-Host "2. Fill in the form and add a payment method" -ForegroundColor Cyan
    Write-Host "3. Then run this script again" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "See FIX_BILLING_ACCOUNT.md for detailed instructions" -ForegroundColor Yellow
}

Write-Host ""

