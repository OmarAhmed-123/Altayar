@echo off
REM Batch script to deploy built image to Cloud Run
REM This script should be run after build-and-deploy.bat completes

echo ========================================
echo Deploying to Cloud Run
echo ========================================
echo.

cd /d "%~dp0"

REM Configuration
set PROJECT_ID=altayar-46d6f
set SERVICE_NAME=altayar-backend
set REGION=us-central1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/altayar-backend

REM Get latest image tag (use BUILD_ID from latest build)
echo Getting latest image tag...
for /f "tokens=*" %%i in ('gcloud builds list --limit=1 --format="value(id)" --sort-by=~createTime') do set BUILD_ID=%%i

if "%BUILD_ID%"=="" (
    echo ERROR: No build found. Please run build-and-deploy.bat first.
    pause
    exit /b 1
)

set LATEST_TAG=%BUILD_ID%
echo Using image: %IMAGE_NAME%:%LATEST_TAG%
echo.

REM Deploy to Cloud Run with basic environment variables
echo Deploying to Cloud Run...
echo This may take 2-3 minutes...
echo.

gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME%:%LATEST_TAG% ^
    --region %REGION% ^
    --platform managed ^
    --allow-unauthenticated ^
    --port 8080 ^
    --memory 2Gi ^
    --cpu 2 ^
    --timeout 300 ^
    --max-instances 10 ^
    --min-instances 1 ^
    --set-env-vars NODE_ENV=production ^
    --project %PROJECT_ID%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Deployment failed
    echo.
    echo Next steps:
    echo 1. Check Cloud Run logs for errors
    echo 2. Run: fix-database-connection-now.bat to set environment variables
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS: Deployment completed!
echo ========================================
echo.
echo Next Steps:
echo 1. Run: fix-database-connection-now.bat
echo    This will set database credentials and Cloud SQL connection
echo.
echo 2. Test the service:
echo    https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
echo.
pause

