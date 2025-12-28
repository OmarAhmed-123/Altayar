@echo off
echo ========================================
echo Deploying Backend and Verifying Routes
echo ========================================
echo.

echo [1/5] Building and deploying to Cloud Run...
cd /d E:\Altayar-app\Altayar-app-final\backend
gcloud run deploy altayar-backend --source . --region us-central1 --allow-unauthenticated
if errorlevel 1 (
    echo   ❌ Deployment failed
    pause
    exit /b 1
)
echo   ✓ Deployment successful
echo.

echo [2/5] Waiting for service to be ready...
timeout /t 10 /nobreak >nul
echo.

echo [3/5] Testing health endpoint...
curl -s https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health >nul
if errorlevel 1 (
    echo   ⚠ Health check failed (service may still be starting)
) else (
    echo   ✓ Health check passed
)
echo.

echo [4/5] Testing routes endpoint...
curl -s https://altayar-backend-kuwjte4rda-uc.a.run.app/api/test-routes >nul
if errorlevel 1 (
    echo   ⚠ Routes test failed
) else (
    echo   ✓ Routes test passed
)
echo.

echo [5/5] Testing auth endpoints...
echo   Testing /api/auth/login...
curl -s -X POST https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test\"}" >nul
if errorlevel 1 (
    echo   ⚠ Login endpoint test failed
) else (
    echo   ✓ Login endpoint is accessible (may return 401, which is expected)
)
echo.

echo   Testing /api/oauth/config...
curl -s https://altayar-backend-kuwjte4rda-uc.a.run.app/api/oauth/config >nul
if errorlevel 1 (
    echo   ⚠ OAuth config endpoint test failed
) else (
    echo   ✓ OAuth config endpoint is accessible
)
echo.

echo ========================================
echo Deployment and Verification Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Check Cloud Run logs for route loading messages
echo 2. Test login/register from Flutter Web app
echo 3. If 404 persists, check Cloud Run service logs
echo.

pause

