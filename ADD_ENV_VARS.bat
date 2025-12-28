@echo off
REM Add environment variables to Cloud Run service

echo ========================================
echo Adding Environment Variables
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0add-env-vars.ps1"

pause

