# Switch to correct Google Cloud account
# Email: dipencilcom@gmail.com

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$GCP_EMAIL = "dipencilcom@gmail.com"
$PROJECT_ID = "altayar-46d6f"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Switching Google Cloud Account" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Required Email: $GCP_EMAIL" -ForegroundColor Yellow
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

# Check current account
$currentAccount = & $GCLOUD_CMD config get-value account 2>&1
Write-Host "Current account: $currentAccount" -ForegroundColor Cyan
Write-Host ""

if ($currentAccount -match $GCP_EMAIL) {
    Write-Host "OK: Already using correct account!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Switching to: $GCP_EMAIL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "A browser window will open for authentication..." -ForegroundColor Cyan
    Write-Host ""
    
    # Login with correct account
    & $GCLOUD_CMD auth login $GCP_EMAIL
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "OK: Successfully logged in as $GCP_EMAIL" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Failed to login" -ForegroundColor Red
        exit 1
    }
}

# Set project
Write-Host ""
Write-Host "Setting project: $PROJECT_ID" -ForegroundColor Yellow
& $GCLOUD_CMD config set project $PROJECT_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Project set" -ForegroundColor Green
} else {
    Write-Host "WARNING: Could not set project" -ForegroundColor Yellow
    Write-Host "Please ensure you have access to: $PROJECT_ID" -ForegroundColor Yellow
}

# Verify
Write-Host ""
Write-Host "Verifying..." -ForegroundColor Yellow
$finalAccount = & $GCLOUD_CMD config get-value account 2>&1
$finalProject = & $GCLOUD_CMD config get-value project 2>&1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Current Configuration:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Account: $finalAccount" -ForegroundColor White
Write-Host "Project: $finalProject" -ForegroundColor White
Write-Host ""

if ($finalAccount -match $GCP_EMAIL -and $finalProject -eq $PROJECT_ID) {
    Write-Host "OK: Configuration is correct!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: DEPLOY_NOW.bat" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Configuration may be incorrect" -ForegroundColor Yellow
    Write-Host "Please verify manually" -ForegroundColor Yellow
}

Write-Host ""

