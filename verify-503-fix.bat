@echo off
echo ========================================
echo Verifying 503 Fix Configuration
echo ========================================
echo.

echo [1/6] Checking PORT configuration...
if defined PORT (
    echo   ✓ PORT environment variable is set: %PORT%
) else (
    echo   ⚠ PORT not set - will use default 5000
)
echo.

echo [2/6] Checking Node.js version...
node --version
if errorlevel 1 (
    echo   ❌ Node.js is not installed or not in PATH
    exit /b 1
)
echo   ✓ Node.js is available
echo.

echo [3/6] Checking server.js PORT configuration...
findstr /C:"const PORT" server.js >nul
if errorlevel 1 (
    echo   ❌ PORT configuration not found in server.js
) else (
    echo   ✓ PORT configuration found in server.js
)
echo.

echo [4/6] Checking CORS configuration...
findstr /C:"isFirebaseHosting" server.js >nul
if errorlevel 1 (
    echo   ⚠ Firebase Hosting CORS pattern not found
) else (
    echo   ✓ Firebase Hosting CORS pattern found
)
echo.

echo [5/6] Checking login error handling...
findstr /C:"retryable" controllers\authController.js >nul
if errorlevel 1 (
    echo   ⚠ Retryable error handling not found
) else (
    echo   ✓ Retryable error handling found in login controller
)
echo.

echo [6/6] Checking environment variables...
if defined NODE_ENV (
    echo   ✓ NODE_ENV is set: %NODE_ENV%
) else (
    echo   ⚠ NODE_ENV not set - will use development mode
)
if defined DB_HOST (
    echo   ✓ DB_HOST is set
) else (
    echo   ⚠ DB_HOST not set
)
if defined FRONTEND_URL (
    echo   ✓ FRONTEND_URL is set: %FRONTEND_URL%
) else (
    echo   ⚠ FRONTEND_URL not set - will use default Firebase URLs
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Next steps:
echo 1. Deploy the backend to Cloud Run
echo 2. Test login from Flutter Web app
echo 3. Check Cloud Run logs if issues persist
echo.

pause

