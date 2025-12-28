@echo off
REM Batch script to verify and fix database password
REM This script will help identify the correct password format

echo ========================================
echo Verify Database Password and Fix
echo ========================================
echo.

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0verify-password-and-fix.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed
    echo.
    pause
    exit /b 1
)

echo.
pause

