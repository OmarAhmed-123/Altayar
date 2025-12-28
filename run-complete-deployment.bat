@echo off
REM Complete Automated Deployment Script
REM This script will handle everything automatically

echo ========================================
echo 🚀 Altayar Backend - Complete Deployment
echo ========================================
echo.
echo This script will:
echo 1. Set up Cloud SQL database
echo 2. Build and push Docker image
echo 3. Deploy to Cloud Run
echo 4. Update frontend configuration
echo 5. Test the deployment
echo.
pause

call complete-deployment.bat

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Deployment completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ❌ Deployment failed. Please check the errors above.
    echo ========================================
)

pause

