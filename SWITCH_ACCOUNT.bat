@echo off
REM Switch to correct Google Cloud account

echo ========================================
echo Switching Google Cloud Account
echo ========================================
echo.
echo Required: dipencilcom@gmail.com
echo Project: altayar-46d6f
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0switch-account.ps1"

pause

