# Add Environment Variables to Cloud Run Service
# Project: altayar-46d6f

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Adding Environment Variables to Cloud Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get database password
Write-Host "Enter database password for 'postgres' user:" -ForegroundColor Yellow
$dbPassword = Read-Host "Password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
$dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# Get JWT secret
Write-Host ""
Write-Host "Enter JWT Secret (or press Enter for auto-generated):" -ForegroundColor Yellow
$jwtSecret = Read-Host "JWT Secret"
if (-not $jwtSecret) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated JWT Secret: $jwtSecret" -ForegroundColor Green
}

# Get Session Secret
Write-Host ""
Write-Host "Enter Session Secret (or press Enter for auto-generated):" -ForegroundColor Yellow
$sessionSecret = Read-Host "Session Secret"
if (-not $sessionSecret) {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated Session Secret: $sessionSecret" -ForegroundColor Green
}

# Get Frontend URL
Write-Host ""
Write-Host "Enter Frontend URL (or press Enter to skip):" -ForegroundColor Yellow
$frontendUrl = Read-Host "Frontend URL"

# Build environment variables string
$envVars = @(
    "NODE_ENV=production",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$dbPasswordPlain",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret"
)

if ($frontendUrl) {
    $envVars += "FRONTEND_URL=$frontendUrl"
}

$envVarsString = $envVars -join ","

Write-Host ""
Write-Host "Updating Cloud Run service with environment variables..." -ForegroundColor Yellow

# Update the service
$updateOutput = & $GCLOUD_CMD run services update $SERVICE_NAME `
    --region $REGION `
    --update-env-vars $envVarsString `
    --project $PROJECT_ID 2>&1

$updateExitCode = $LASTEXITCODE

if ($updateExitCode -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Environment Variables Updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Service will restart with new environment variables." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Test the service:" -ForegroundColor Yellow
    Write-Host "  https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update environment variables" -ForegroundColor Red
    Write-Host "Error: $updateOutput" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can update manually:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor White
    Write-Host "2. Click on service: $SERVICE_NAME" -ForegroundColor White
    Write-Host "3. Edit & Deploy New Revision" -ForegroundColor White
    Write-Host "4. Variables & Secrets > Add Variable" -ForegroundColor White
    Write-Host ""
}

Write-Host ""

