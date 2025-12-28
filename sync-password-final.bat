@echo off
REM Batch script to sync password between Cloud SQL and Cloud Run

echo ========================================
echo Sync Password: Cloud SQL ^<^> Cloud Run
echo ========================================
echo.
echo This script will:
echo   1. Check current password in Cloud Run
echo   2. Ask you to enter the CORRECT password from Cloud SQL
echo   3. Update both Cloud SQL and Cloud Run to match
echo   4. Test the connection
echo.
echo IMPORTANT: Enter the password you set in Cloud SQL Console
echo (The one you just changed in the dialog box)
echo.
pause

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0sync-password-final.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed
    echo.
    pause
    exit /b 1
)

echo.
pause

