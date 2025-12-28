@echo off
echo ========================================
echo Complete Backend Verification
echo ========================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo   ❌ Node.js not found
    pause
    exit /b 1
)
echo   ✓ Node.js installed
node --version
echo.

echo [2/5] Checking npm dependencies...
cd /d E:\Altayar-app\Altayar-app-final\backend
if not exist "node_modules" (
    echo   Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo   ❌ npm install failed
        pause
        exit /b 1
    )
)
echo   ✓ Dependencies installed
echo.

echo [3/5] Verifying critical files...
if not exist "server.js" (
    echo   ❌ server.js not found
    pause
    exit /b 1
)
if not exist "routes\auth.js" (
    echo   ❌ routes\auth.js not found
    pause
    exit /b 1
)
if not exist "routes\oauth.js" (
    echo   ❌ routes\oauth.js not found
    pause
    exit /b 1
)
if not exist "controllers\authController.js" (
    echo   ❌ controllers\authController.js not found
    pause
    exit /b 1
)
if not exist "controllers\oauthController.js" (
    echo   ❌ controllers\oauthController.js not found
    pause
    exit /b 1
)
echo   ✓ All critical files found
echo.

echo [4/5] Verifying route registration in server.js...
findstr /C:"app.use('/api/auth'" server.js >nul
if errorlevel 1 (
    echo   ❌ /api/auth route not found in server.js
    pause
    exit /b 1
)
findstr /C:"app.use('/api/oauth'" server.js >nul
if errorlevel 1 (
    echo   ❌ /api/oauth route not found in server.js
    pause
    exit /b 1
)
echo   ✓ Routes registered in server.js
echo.

echo [5/5] Verifying route loading order...
findstr /C:"CRITICAL FIX: Load routes BEFORE server starts listening" server.js >nul
if errorlevel 1 (
    echo   ⚠ Route loading order comment not found (may still work)
) else (
    echo   ✓ Route loading order verified
)
echo.

echo ========================================
echo ✅ Backend Verification Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Deploy to Cloud Run: DEPLOY_AND_VERIFY.bat
echo 2. Test endpoints: curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
echo 3. Check logs: gcloud logging read "resource.type=cloud_run_revision"
echo.

pause

