@echo off
REM Run PowerShell deployment script
echo ========================================
echo Altayar Backend Deployment
echo ========================================
echo.
echo Running PowerShell deployment script...
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0deploy-fixed.ps1"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Deployment completed successfully!
) else (
    echo.
    echo ❌ Deployment failed. Please check the errors above.
)
echo.
pause

