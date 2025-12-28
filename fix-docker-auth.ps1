# Fix Docker Authentication for Google Container Registry
# Project: altayar-46d6f

$GCLOUD_CMD = "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$PROJECT_ID = "altayar-46d6f"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Docker Authentication" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get gcloud SDK path
$gcloudPath = Split-Path -Parent $GCLOUD_CMD
$gcloudBinPath = $gcloudPath

Write-Host "GCloud Path: $gcloudBinPath" -ForegroundColor Yellow
Write-Host ""

# Add gcloud to PATH
$env:Path = "$gcloudBinPath;$env:Path"

Write-Host "[1/4] Configuring Docker credential helper..." -ForegroundColor Yellow
try {
    $null = & $GCLOUD_CMD auth configure-docker gcr.io --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Docker credential helper configured" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not configure credential helper automatically" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Error configuring credential helper: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[2/4] Setting up application-default credentials..." -ForegroundColor Yellow
try {
    $null = & $GCLOUD_CMD auth application-default login --quiet 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Application-default credentials set" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Could not set application-default credentials" -ForegroundColor Yellow
    }
} catch {
    Write-Host "WARNING: Error setting application-default credentials: $_" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "[3/4] Getting access token..." -ForegroundColor Yellow
try {
    $accessToken = & $GCLOUD_CMD auth print-access-token 2>&1 | Where-Object { $_ -and $_ -notmatch "ERROR" }
    if ($accessToken) {
        Write-Host "OK: Access token obtained" -ForegroundColor Green
        
        Write-Host "[4/4] Logging in to Docker..." -ForegroundColor Yellow
        $loginOutput = echo $accessToken | docker login -u oauth2accesstoken --password-stdin https://gcr.io 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OK: Docker login successful" -ForegroundColor Green
        } else {
            Write-Host "WARNING: Docker login failed" -ForegroundColor Yellow
            Write-Host "Output: $loginOutput" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ERROR: Could not get access token" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Failed to get access token: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Testing Docker authentication..." -ForegroundColor Yellow
$testOutput = docker pull gcr.io/$PROJECT_ID/hello-world 2>&1
if ($LASTEXITCODE -eq 0 -or $testOutput -match "not found" -or $testOutput -match "unauthorized" -eq $false) {
    Write-Host "OK: Docker authentication appears to be working" -ForegroundColor Green
} else {
    Write-Host "WARNING: Docker authentication may still have issues" -ForegroundColor Yellow
    Write-Host "You may need to run: gcloud auth configure-docker" -ForegroundColor Cyan
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If authentication still fails, try:" -ForegroundColor Yellow
Write-Host "1. gcloud auth login" -ForegroundColor White
Write-Host "2. gcloud auth configure-docker" -ForegroundColor White
Write-Host "3. gcloud auth application-default login" -ForegroundColor White
Write-Host "4. Run DEPLOY_NOW.bat again" -ForegroundColor White
Write-Host ""

