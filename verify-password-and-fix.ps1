# PowerShell script to verify and fix database password
# This script will help identify the correct password format

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verify Database Password and Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"

# Set project
gcloud config set project $PROJECT_ID | Out-Null

Write-Host "Step 1: Getting current Cloud Run service environment variables..." -ForegroundColor Cyan

# Get current service configuration
$serviceInfo = gcloud run services describe $SERVICE_NAME --region $REGION --format="json" 2>&1 | ConvertFrom-Json

if (-not $serviceInfo) {
    Write-Host "ERROR: Could not get Cloud Run service info" -ForegroundColor Red
    exit 1
}

# Get current environment variables
$envVars = $serviceInfo.spec.template.spec.containers[0].env

# Find DB_PASSWORD
$currentPassword = $envVars | Where-Object {$_.name -eq "DB_PASSWORD"} | Select-Object -ExpandProperty value

Write-Host ""
Write-Host "Current DB_PASSWORD in Cloud Run:" -ForegroundColor Yellow
if ($currentPassword) {
    Write-Host "  Value: $currentPassword" -ForegroundColor White
    Write-Host "  Length: $($currentPassword.Length)" -ForegroundColor White
    # Show character codes (compatible with older PowerShell)
    $charCodes = $currentPassword.ToCharArray() | ForEach-Object { [int][char]$_ }
    Write-Host "  Character codes: $($charCodes -join ',')" -ForegroundColor White
    Write-Host "  Note: %% in PowerShell string = single % in actual value" -ForegroundColor Yellow
} else {
    Write-Host "  NOT SET" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 2: Testing different password formats..." -ForegroundColor Cyan
Write-Host ""

# Test different password formats
$passwordFormats = @(
    @{Name="AAIOH2040%% (PowerShell format)"; Value="AAIOH2040%%"; Description="Double %% in PowerShell = single %"},
    @{Name="AAIOH2040% (Single %)"; Value="AAIOH2040%"; Description="Single % directly"},
    @{Name="AAIOH2040%%%% (Escaped)"; Value="AAIOH2040%%%%"; Description="Quadruple %% = double %"},
    @{Name="AAIOH2040 (No %)"; Value="AAIOH2040"; Description="No % at all"}
)

Write-Host "Password format options:" -ForegroundColor Yellow
foreach ($format in $passwordFormats) {
    Write-Host "  - $($format.Name): $($format.Value) ($($format.Description))" -ForegroundColor White
}

Write-Host ""
Write-Host "Step 3: Enter the correct password..." -ForegroundColor Cyan
Write-Host "  Current password in Cloud Run: $currentPassword" -ForegroundColor Yellow
Write-Host "  Length: $($currentPassword.Length) characters" -ForegroundColor Yellow
Write-Host ""
Write-Host "  IMPORTANT: The password format matters!" -ForegroundColor Yellow
Write-Host "  - Current in Cloud Run: AAIOH2040%% (11 chars = double %%)" -ForegroundColor White
Write-Host "  - But Cloud SQL might expect: AAIOH2040% (10 chars = single %)" -ForegroundColor White
Write-Host ""
Write-Host "  CRITICAL: In PowerShell Read-Host:" -ForegroundColor Yellow
Write-Host "    - To enter 'AAIOH2040%' (single %), type: AAIOH2040%%" -ForegroundColor White
Write-Host "    - To enter 'AAIOH2040%%' (double %%), type: AAIOH2040%%%%" -ForegroundColor White
Write-Host ""
Write-Host "  Please enter the actual password for Cloud SQL postgres user:" -ForegroundColor Yellow
Write-Host "  (Try: AAIOH2040%% first - this will be stored as AAIOH2040% in Cloud Run)" -ForegroundColor Yellow
Write-Host ""

$dbPasswordSecure = Read-Host "Enter Cloud SQL database password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPasswordSecure)
)

Write-Host ""
Write-Host "Password entered:" -ForegroundColor Green
Write-Host "  Length: $($dbPasswordPlain.Length)" -ForegroundColor White
Write-Host "  First 3 chars: $($dbPasswordPlain.Substring(0, [Math]::Min(3, $dbPasswordPlain.Length)))..." -ForegroundColor White
Write-Host "  Last 3 chars: ...$($dbPasswordPlain.Substring([Math]::Max(0, $dbPasswordPlain.Length - 3)))" -ForegroundColor White

# Get or generate secrets
$jwtSecret = $envVars | Where-Object {$_.name -eq "JWT_SECRET"} | Select-Object -ExpandProperty value
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated new JWT_SECRET" -ForegroundColor Green
}

$sessionSecret = $envVars | Where-Object {$_.name -eq "SESSION_SECRET"} | Select-Object -ExpandProperty value
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated new SESSION_SECRET" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 4: Updating Cloud Run service with correct password..." -ForegroundColor Cyan
Write-Host "   This may take 2-3 minutes..." -ForegroundColor Yellow
Write-Host ""

# Build environment variables list
$envVarsList = @(
    "NODE_ENV=production",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$dbPasswordPlain",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$jwtSecret",
    "SESSION_SECRET=$sessionSecret",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app"
) -join ","

# Update service
$updateCmd = "gcloud run services update $SERVICE_NAME " +
    "--region $REGION " +
    "--project $PROJECT_ID " +
    "--update-env-vars $envVarsList " +
    "--set-cloudsql-instances $CONNECTION_NAME " +
    "--timeout 300 " +
    "--cpu 2 " +
    "--memory 2Gi " +
    "--max-instances 10 " +
    "--min-instances 1 " +
    "--port 8080 " +
    "--quiet"

Invoke-Expression $updateCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Cloud Run service updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for service to update (60 seconds)..." -ForegroundColor Cyan
    
    Start-Sleep -Seconds 60
    
    Write-Host ""
    Write-Host "Testing service..." -ForegroundColor Cyan
    
    # Test health endpoint
    $healthUrl = "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health"
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 10 -UseBasicParsing
        $healthData = $response.Content | ConvertFrom-Json
        
        if ($healthData.database.status -eq "connected") {
            Write-Host "SUCCESS: Service is responding!" -ForegroundColor Green
            Write-Host "   Status: OK" -ForegroundColor Green
            Write-Host "   Database: connected" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Service is responding but database is not connected" -ForegroundColor Yellow
            Write-Host "   Status: $($healthData.status)" -ForegroundColor Yellow
            Write-Host "   Database: $($healthData.database.status)" -ForegroundColor Yellow
            Write-Host "   Error: $($healthData.database.error.message)" -ForegroundColor Yellow
            Write-Host "   This may take a few more minutes..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "WARNING: Could not test service" -ForegroundColor Yellow
        Write-Host "   Error: $_" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS: Password updated!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Wait 2-3 minutes for database connection to establish" -ForegroundColor White
    Write-Host "2. Test: https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health" -ForegroundColor White
    Write-Host "3. Try register/login" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to update service" -ForegroundColor Red
    Write-Host "   Check the error message above" -ForegroundColor Yellow
    exit 1
}

