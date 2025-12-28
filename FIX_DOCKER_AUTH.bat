@echo off
REM Fix Docker authentication for Google Container Registry

echo ========================================
echo Fixing Docker Authentication
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0fix-docker-auth.ps1"

pause

