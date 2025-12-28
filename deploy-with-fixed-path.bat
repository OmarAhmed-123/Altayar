@echo off
REM Deployment script with fixed gcloud path
REM This ensures gcloud is found even if not in system PATH

setlocal enabledelayedexpansion

echo ========================================
echo 🚀 Altayar Backend - Deployment (Fixed Path)
echo ========================================
echo.

REM Add gcloud to PATH
set GCLOUD_BIN=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin
if exist "%GCLOUD_BIN%\gcloud.cmd" (
    set PATH=%PATH%;%GCLOUD_BIN%
    echo ✅ gcloud path configured: %GCLOUD_BIN%
) else (
    echo ❌ gcloud not found at: %GCLOUD_BIN%
    echo Please check your Google Cloud SDK installation
    pause
    exit /b 1
)

REM Verify gcloud works
gcloud --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ gcloud is not working. Please check your installation.
    pause
    exit /b 1
)

echo ✅ gcloud is ready
echo.

REM Now run the main deployment script
call complete-deployment.bat

endlocal

