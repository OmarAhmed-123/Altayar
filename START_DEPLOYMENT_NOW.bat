@echo off
REM Quick Start Deployment Script
REM This is the main script to run for complete deployment

echo.
echo ========================================
echo 🚀 Altayar Backend - Quick Deployment
echo ========================================
echo.
echo This will deploy your backend to Google Cloud Run
echo.
echo Prerequisites:
echo   ✅ Google Cloud SDK installed
echo   ✅ Docker Desktop installed and running
echo   ✅ Logged in to Google Cloud (altayarvipcom@gmail.com)
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo Starting deployment...
echo.

call complete-deployment.bat

echo.
echo ========================================
if %ERRORLEVEL% EQU 0 (
    echo ✅ Deployment completed successfully!
    echo.
    echo Next steps:
    echo 1. Run database migrations (see FINAL_DEPLOYMENT_STEPS.md)
    echo 2. Test the API endpoint
    echo 3. Update frontend if needed
    echo.
) else (
    echo ❌ Deployment failed. Please check the errors above.
    echo.
    echo Common issues:
    echo - Docker not running: Start Docker Desktop
    echo - Permission denied: Check gcloud auth
    echo - Database error: Check Cloud SQL instance
    echo.
)

pause

