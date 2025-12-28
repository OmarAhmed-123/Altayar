@echo off
REM Batch script to completely fix Cloud SQL connection

echo ========================================
echo Complete Cloud SQL Connection Fix
echo ========================================
echo.

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "fix-cloud-sql-complete.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed
    pause
    exit /b 1
)

echo.
echo Script completed!
pause

