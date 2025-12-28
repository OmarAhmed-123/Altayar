@echo off
REM Altayar Backend Deployment Script for Google Cloud (Windows)
REM Usage: deploy.bat [cloud-run|app-engine]

setlocal enabledelayedexpansion

set PROJECT_ID=altayarback
set REGION=us-central1
set SERVICE_NAME=altayar-backend
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo 🚀 Starting deployment to Google Cloud Platform...
echo Project: %PROJECT_ID%
echo Region: %REGION%

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI is not installed
    echo Install it from: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

REM Set the project
echo 📋 Setting GCP project...
gcloud config set project %PROJECT_ID%

REM Check if user is authenticated
echo 🔐 Checking authentication...
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr /R "." >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Not authenticated. Please run: gcloud auth login
    exit /b 1
)

REM Enable required APIs
echo 🔧 Enabling required APIs...
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable containerregistry.googleapis.com

set DEPLOYMENT_TYPE=%1
if "%DEPLOYMENT_TYPE%"=="" set DEPLOYMENT_TYPE=cloud-run

if "%DEPLOYMENT_TYPE%"=="cloud-run" (
    echo 🐳 Building Docker image...
    docker build -t %IMAGE_NAME%:latest .
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Docker build failed
        exit /b 1
    )
    
    echo 📤 Pushing image to Container Registry...
    docker push %IMAGE_NAME%:latest
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Docker push failed
        exit /b 1
    )
    
    echo 🚀 Deploying to Cloud Run...
    gcloud run deploy %SERVICE_NAME% ^
        --image %IMAGE_NAME%:latest ^
        --platform managed ^
        --region %REGION% ^
        --allow-unauthenticated ^
        --port 8080 ^
        --memory 2Gi ^
        --cpu 2 ^
        --timeout 300 ^
        --max-instances 10 ^
        --min-instances 1 ^
        --set-env-vars NODE_ENV=production,PORT=8080 ^
        --project %PROJECT_ID%
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Deployment failed
        exit /b 1
    )
    
    echo ✅ Deployment complete!
    echo 🌐 Getting service URL...
    for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i
    echo 📍 Service URL: %SERVICE_URL%
    echo 🔗 API URL: %SERVICE_URL%/api
    echo ❤️  Health Check: %SERVICE_URL%/api/health
    
) else if "%DEPLOYMENT_TYPE%"=="app-engine" (
    echo 📦 Deploying to App Engine...
    gcloud app deploy app.yaml --project %PROJECT_ID%
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Deployment failed
        exit /b 1
    )
    
    echo ✅ Deployment complete!
    echo 🌐 Getting service URL...
    for /f "tokens=*" %%i in ('gcloud app describe --format "value(defaultHostname)"') do set SERVICE_URL=%%i
    echo 📍 Service URL: https://%SERVICE_URL%
    echo 🔗 API URL: https://%SERVICE_URL%/api
    echo ❤️  Health Check: https://%SERVICE_URL%/api/health
) else (
    echo ❌ Invalid deployment type: %DEPLOYMENT_TYPE%
    echo Usage: deploy.bat [cloud-run^|app-engine]
    exit /b 1
)

echo.
echo 🎉 Deployment successful!
echo 📝 Next steps:
echo 1. Update your .env file with production database credentials
echo 2. Run migrations on the deployed service
echo 3. Update frontend API_BASE_URL to: %SERVICE_URL%/api

endlocal

