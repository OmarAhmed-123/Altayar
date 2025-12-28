@echo off
REM Direct deployment script with proper path handling
setlocal enabledelayedexpansion

set "GCLOUD_CMD=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
set PROJECT_ID=altayar-46d6f
set BILLING_ACCOUNT_ID=01A9EE-92CE19-7CF271
set REGION=us-central1
set SERVICE_NAME=altayar-backend
set INSTANCE_NAME=altayar-db
set DATABASE_NAME=tourist_app_db
set DB_USER=postgres
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo ========================================
echo 🚀 Altayar Backend Deployment
echo ========================================
echo.

REM Verify gcloud exists
if not exist "%GCLOUD_CMD%" (
    echo ❌ gcloud not found at: %GCLOUD_CMD%
    pause
    exit /b 1
)

echo ✅ Using gcloud at: %GCLOUD_CMD%
echo.

REM Step 1: Enable APIs
echo [1/7] Enabling APIs...
"%GCLOUD_CMD%" services enable cloudbuild.googleapis.com --quiet
"%GCLOUD_CMD%" services enable run.googleapis.com --quiet
"%GCLOUD_CMD%" services enable sqladmin.googleapis.com --quiet
"%GCLOUD_CMD%" services enable containerregistry.googleapis.com --quiet
echo ✅ APIs enabled
echo.

REM Step 2: Check/Create Cloud SQL
echo [2/7] Setting up Cloud SQL...
"%GCLOUD_CMD%" sql instances describe %INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Creating Cloud SQL instance...
    set /p DB_PASSWORD="Enter database root password: "
    "%GCLOUD_CMD%" sql instances create %INSTANCE_NAME% --database-version=POSTGRES_15 --tier=db-f1-micro --region=%REGION% --root-password=%DB_PASSWORD% --quiet
    timeout /t 30 /nobreak >nul
) else (
    echo ✅ Instance exists
)

for /f "tokens=*" %%i in ('"%GCLOUD_CMD%" sql instances describe %INSTANCE_NAME% --format "value(connectionName)"') do set CONNECTION_NAME=%%i

"%GCLOUD_CMD%" sql databases describe %DATABASE_NAME% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    "%GCLOUD_CMD%" sql databases create %DATABASE_NAME% --instance=%INSTANCE_NAME% --quiet
)

"%GCLOUD_CMD%" sql users describe %DB_USER% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /p USER_PASSWORD="Enter password for user '%DB_USER%': "
    "%GCLOUD_CMD%" sql users create %DB_USER% --instance=%INSTANCE_NAME% --password=%USER_PASSWORD% --quiet
)
echo ✅ Cloud SQL ready
echo.

REM Step 3: Build Docker
echo [3/7] Building Docker image...
docker build -t %IMAGE_NAME%:latest .
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ Image built
echo.

REM Step 4: Push
echo [4/7] Pushing image...
docker push %IMAGE_NAME%:latest
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ Image pushed
echo.

REM Step 5: Deploy
echo [5/7] Deploying to Cloud Run...
"%GCLOUD_CMD%" run deploy %SERVICE_NAME% --image %IMAGE_NAME%:latest --platform managed --region %REGION% --allow-unauthenticated --port 8080 --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --add-cloudsql-instances %CONNECTION_NAME% --set-env-vars NODE_ENV=production,PORT=8080 --project %PROJECT_ID%
if %ERRORLEVEL% NEQ 0 exit /b 1
echo ✅ Deployed
echo.

REM Step 6: Get URL
echo [6/7] Getting service URL...
for /f "tokens=*" %%i in ('"%GCLOUD_CMD%" run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i
echo.
echo ========================================
echo 🎉 Deployment Complete!
echo ========================================
echo Service URL: %SERVICE_URL%
echo API URL: %SERVICE_URL%/api
echo Health: %SERVICE_URL%/api/health
echo.

REM Step 7: Update frontend
echo [7/7] Updating frontend...
set "FRONTEND_CONFIG=E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart"
if exist "%FRONTEND_CONFIG%" (
    node update-frontend-config.js %SERVICE_URL% 2>nul
    echo ✅ Frontend updated
)
echo.

echo 📋 Next: Run migrations and test API
pause

