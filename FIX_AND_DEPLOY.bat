@echo off
REM Complete fix and deploy script for the correct project

echo ========================================
echo Fix Billing and Deploy
echo ========================================
echo.
echo Project: hybrid-unity-481421-m7
echo Billing Account: 018808-E12F47-5E15FF
echo.

REM Step 1: Try to reopen billing account
echo [1/3] Attempting to link billing account...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0reopen-billing-account.ps1"
echo.

REM Step 2: Check billing
echo [2/3] Checking billing status...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0check-billing.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Billing account not linked
    echo.
    echo Please:
    echo 1. Reopen billing account: https://console.cloud.google.com/billing/018808-E12F47-5E15FF
    echo 2. Or create new account: https://console.cloud.google.com/billing/create
    echo 3. Then run this script again
    echo.
    pause
    exit /b 1
)
echo.

REM Step 3: Deploy
echo [3/3] Starting deployment...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0deploy-fixed.ps1"

pause

