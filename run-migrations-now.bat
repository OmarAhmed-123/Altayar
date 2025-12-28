@echo off
REM Batch script to run database migrations immediately

echo ========================================
echo Run Database Migrations Now
echo ========================================
echo.
echo This script will:
echo   1. Create/update Cloud Run Job
echo   2. Run all database migrations
echo   3. Create all database tables
echo.
echo This may take 2-3 minutes...
echo.
pause

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0run-migrations-now.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed
    echo.
    pause
    exit /b 1
)

echo.
pause

