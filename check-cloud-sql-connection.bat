@echo off
REM Batch script to check Cloud SQL connection setup

echo ========================================
echo Checking Cloud SQL Connection Setup
echo ========================================
echo.

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "check-cloud-sql-connection.ps1"

pause

