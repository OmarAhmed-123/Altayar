@echo off
REM Batch script to build and deploy to Cloud Run

echo ========================================
echo Building and Deploying to Cloud Run
echo ========================================
echo.

cd /d "%~dp0"

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell is not available
    echo Please install PowerShell or run build-and-deploy.ps1 directly
    pause
    exit /b 1
)

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "build-and-deploy.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
pause

