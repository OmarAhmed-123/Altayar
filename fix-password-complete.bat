@echo off
REM Batch script to completely fix database password issue

echo ========================================
echo Complete Password Fix
echo ========================================
echo.
echo This script will:
echo   1. Reset password in Cloud SQL to: AAIOH2040
echo   2. Update Cloud Run with the same password
echo   3. Test the connection
echo.
echo WARNING: This will change the Cloud SQL password!
echo.
pause

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0fix-password-complete.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed
    echo.
    pause
    exit /b 1
)

echo.
pause

