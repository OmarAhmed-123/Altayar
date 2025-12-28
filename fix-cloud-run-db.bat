@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Fix Cloud Run Database Connection
echo ========================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: PowerShell is not available
    echo Please install PowerShell or run fix-cloud-run-db.ps1 directly
    exit /b 1
)

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0fix-cloud-run-db.ps1"

if %errorlevel% neq 0 (
    echo.
    echo ❌ Script failed. Please check the errors above.
    pause
    exit /b 1
)

echo.
echo ✅ Done!
pause

