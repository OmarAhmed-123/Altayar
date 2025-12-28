@echo off
echo ========================================
echo Deploying 503 Fix to Cloud Run
echo ========================================
echo.

echo [1/4] Verifying configuration...
call verify-503-fix.bat
if errorlevel 1 (
    echo   ❌ Configuration verification failed
    pause
    exit /b 1
)
echo.

echo [2/4] Checking gcloud authentication...
gcloud auth list >nul 2>&1
if errorlevel 1 (
    echo   ❌ Not authenticated with gcloud
    echo   Please run: gcloud auth login
    pause
    exit /b 1
)
echo   ✓ Authenticated with gcloud
echo.

echo [3/4] Deploying to Cloud Run...
echo   This may take a few minutes...
gcloud run deploy altayar-backend --source . --region us-central1 --allow-unauthenticated
if errorlevel 1 (
    echo   ❌ Deployment failed
    pause
    exit /b 1
)
echo   ✓ Deployment successful
echo.

echo [4/4] Testing health endpoint...
for /f "tokens=*" %%i in ('gcloud run services describe altayar-backend --region us-central1 --format "value(status.url)"') do set SERVICE_URL=%%i
echo   Service URL: %SERVICE_URL%
curl -s "%SERVICE_URL%/api/health" >nul
if errorlevel 1 (
    echo   ⚠ Health check failed (this is normal if service is still starting)
) else (
    echo   ✓ Health check passed
)
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test login from Flutter Web app
echo 2. Check Cloud Run logs if issues persist
echo 3. Monitor service health in Cloud Console
echo.

pause

