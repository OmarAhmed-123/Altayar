@echo off
REM Show database information

echo ========================================
echo Database Information
echo ========================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0show-db-info.ps1"

pause

