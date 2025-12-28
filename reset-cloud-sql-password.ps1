# PowerShell script to reset Cloud SQL postgres user password
# This will help if the password is incorrect

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Reset Cloud SQL Postgres Password" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This will reset the postgres user password in Cloud SQL" -ForegroundColor Yellow
Write-Host "Make sure you have the correct permissions" -ForegroundColor Yellow
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$INSTANCE_NAME = "altayar-db"
$REGION = "us-central1"
$NEW_PASSWORD = "AAIOH2040%%"  # This will be the new password

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Setting new password for postgres user..." -ForegroundColor Cyan
Write-Host "   Instance: $INSTANCE_NAME" -ForegroundColor White
Write-Host "   Region: $REGION" -ForegroundColor White
Write-Host "   New Password: $NEW_PASSWORD" -ForegroundColor White
Write-Host ""

# Reset password using gcloud sql users set-password
# CRITICAL: For passwords with special characters, we need to quote them
$resetCmd = "gcloud sql users set-password postgres " +
    "--instance=$INSTANCE_NAME " +
    "--password=`"$NEW_PASSWORD`" " +
    "--project=$PROJECT_ID"

Write-Host "Executing: gcloud sql users set-password..." -ForegroundColor Cyan
Invoke-Expression $resetCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Password reset!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Run: verify-password-and-fix.bat" -ForegroundColor White
    Write-Host "   This will update Cloud Run with the new password" -ForegroundColor White
    Write-Host "2. Wait 2-3 minutes for connection to establish" -ForegroundColor White
    Write-Host "3. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to reset password" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    Write-Host "   You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Check Cloud SQL instance permissions" -ForegroundColor White
    Write-Host "   2. Verify instance name: $INSTANCE_NAME" -ForegroundColor White
    Write-Host "   3. Try resetting password manually in Cloud Console" -ForegroundColor White
    exit 1
}

