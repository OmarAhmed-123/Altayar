@echo off
REM Batch script to reset Cloud SQL postgres user password

echo ========================================
echo Reset Cloud SQL Postgres Password
echo ========================================
echo.

cd /d "%~dp0"

powershell -ExecutionPolicy Bypass -File "%~dp0reset-cloud-sql-password.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Script failed
    echo.
    pause
    exit /b 1
)

echo.
pause

