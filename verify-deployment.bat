@echo off
REM Script to verify deployment on Google Cloud
REM Usage: verify-deployment.bat [SERVICE_URL]

setlocal enabledelayedexpansion

set SERVICE_NAME=altayar-backend
set REGION=us-central1

if not "%~1"=="" (
    set SERVICE_URL=%~1
) else (
    echo 🔍 Getting service URL...
    for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i
)

if "%SERVICE_URL%"=="" (
    echo ❌ Error: Could not get service URL
    echo Please provide the service URL as an argument or ensure the service is deployed
    exit /b 1
)

echo.
echo ✅ Service URL: %SERVICE_URL%
echo.

echo 🧪 Testing endpoints...
echo.

echo 1. Testing root endpoint...
curl -s "%SERVICE_URL%" | findstr /C:"success" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Root endpoint is working
) else (
    echo    ❌ Root endpoint failed
)

echo.
echo 2. Testing health check...
curl -s "%SERVICE_URL%/api/health" | findstr /C:"OK" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Health check is working
) else (
    echo    ❌ Health check failed
)

echo.
echo 3. Testing API endpoint...
curl -s "%SERVICE_URL%/api" | findstr /C:"success" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ API endpoint is working
) else (
    echo    ❌ API endpoint failed
)

echo.
echo 4. Testing CORS...
curl -s -H "Origin: https://example.com" -H "Access-Control-Request-Method: GET" -X OPTIONS "%SERVICE_URL%/api/health" -v 2>&1 | findstr /C:"Access-Control-Allow-Origin" >nul
if %ERRORLEVEL% EQU 0 (
    echo    ✅ CORS is configured
) else (
    echo    ⚠️  CORS might not be configured correctly
)

echo.
echo 📋 Summary:
echo    Service URL: %SERVICE_URL%
echo    API URL: %SERVICE_URL%/api
echo    Health Check: %SERVICE_URL%/api/health
echo.
echo 📝 Next steps:
echo    1. Update frontend API_BASE_URL to: %SERVICE_URL%/api
echo    2. Test the frontend connection
echo    3. Monitor logs: gcloud run services logs read %SERVICE_NAME% --region %REGION%

endlocal

