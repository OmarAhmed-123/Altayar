@echo off
REM Complete Deployment Script for Altayar Backend on Google Cloud
REM This script automates the entire deployment process

setlocal enabledelayedexpansion

REM Add gcloud to PATH if not already there
set GCLOUD_BIN=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin
if exist "%GCLOUD_BIN%\gcloud.cmd" (
    echo %PATH% | findstr /C:"%GCLOUD_BIN%" >nul
    if %ERRORLEVEL% NEQ 0 (
        set PATH=%PATH%;%GCLOUD_BIN%
        echo ✅ Added gcloud bin to PATH
    )
)

set PROJECT_ID=altayar-46d6f
set BILLING_ACCOUNT_ID=01A9EE-92CE19-7CF271
set REGION=us-central1
set SERVICE_NAME=altayar-backend
set INSTANCE_NAME=altayar-db
set DATABASE_NAME=tourist_app_db
set DB_USER=postgres
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo ========================================
echo 🚀 Altayar Backend - Complete Deployment
echo ========================================
echo.

REM Check if gcloud is installed and find it
set GCLOUD_PATH=
set GCLOUD_BIN_PATH=

REM First, try to find gcloud in PATH
where gcloud >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('where gcloud') do set GCLOUD_PATH=%%i
    for /f "tokens=*" %%i in ('where gcloud') do (
        set "FULL_PATH=%%i"
        for %%j in ("!FULL_PATH!") do set GCLOUD_BIN_PATH=%%~dpj
    )
    echo ✅ Found gcloud in PATH: %GCLOUD_PATH%
) else (
    REM Try common installation paths
    if exist "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" (
        set GCLOUD_PATH=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd
        set GCLOUD_BIN_PATH=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin
        set PATH=%PATH%;%GCLOUD_BIN_PATH%
        echo ✅ Found gcloud at: %GCLOUD_PATH%
    ) else if exist "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" (
        set GCLOUD_PATH=C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd
        set GCLOUD_BIN_PATH=C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin
        set PATH=%PATH%;%GCLOUD_BIN_PATH%
        echo ✅ Found gcloud at: %GCLOUD_PATH%
    ) else if exist "%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" (
        set GCLOUD_PATH=%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd
        set GCLOUD_BIN_PATH=%LOCALAPPDATA%\Google\Cloud SDK\google-cloud-sdk\bin
        set PATH=%PATH%;%GCLOUD_BIN_PATH%
        echo ✅ Found gcloud at: %GCLOUD_PATH%
    ) else (
        echo ❌ Error: gcloud CLI is not installed or not in PATH
        echo.
        echo Please do one of the following:
        echo 1. Install Google Cloud SDK from: https://cloud.google.com/sdk/docs/install
        echo 2. Or add gcloud to your PATH manually
        echo 3. Or run this script from: C:\Program Files (x86)\Google\Cloud SDK
        echo.
        exit /b 1
    )
)

REM Verify gcloud works
gcloud --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud found but not working
    echo Path: %GCLOUD_PATH%
    echo Trying to fix PATH...
    if defined GCLOUD_BIN_PATH (
        set PATH=%PATH%;%GCLOUD_BIN_PATH%
        gcloud --version >nul 2>&1
        if %ERRORLEVEL% NEQ 0 (
            echo ❌ Still not working. Please check your installation.
            exit /b 1
        )
    ) else (
        exit /b 1
    )
)

REM Verify project
echo 📋 Verifying project configuration...
gcloud config get-value project | findstr /C:"%PROJECT_ID%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Setting project to %PROJECT_ID%...
    gcloud config set project %PROJECT_ID%
)

echo ✅ Project: %PROJECT_ID%
echo ✅ Region: %REGION%
echo.

REM Step 1: Enable required APIs
echo ========================================
echo Step 1: Enabling required APIs...
echo ========================================
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable sqladmin.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
gcloud services enable compute.googleapis.com --quiet
echo ✅ APIs enabled
echo.

REM Step 2: Check/Create Cloud SQL instance
echo ========================================
echo Step 2: Setting up Cloud SQL database...
echo ========================================
gcloud sql instances describe %INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Cloud SQL instance does not exist. Creating...
    echo.
    echo ⚠️  You will be prompted for database password.
    echo    Please use a strong password (at least 12 characters).
    echo.
    set /p DB_PASSWORD="Enter database root password: "
    
    gcloud sql instances create %INSTANCE_NAME% ^
        --database-version=POSTGRES_15 ^
        --tier=db-f1-micro ^
        --region=%REGION% ^
        --root-password=%DB_PASSWORD% ^
        --storage-type=SSD ^
        --storage-size=10GB ^
        --backup-start-time=03:00 ^
        --enable-bin-log ^
        --maintenance-window-day=SUN ^
        --maintenance-window-hour=4 ^
        --quiet
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to create Cloud SQL instance
        exit /b 1
    )
    
    echo ✅ Cloud SQL instance created
    timeout /t 30 /nobreak >nul
) else (
    echo ✅ Cloud SQL instance already exists
)

REM Get connection name
for /f "tokens=*" %%i in ('gcloud sql instances describe %INSTANCE_NAME% --format "value(connectionName)"') do set CONNECTION_NAME=%%i
echo 🔗 Connection Name: %CONNECTION_NAME%
echo.

REM Check/Create database
gcloud sql databases describe %DATABASE_NAME% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📊 Creating database...
    gcloud sql databases create %DATABASE_NAME% --instance=%INSTANCE_NAME% --quiet
    echo ✅ Database created
) else (
    echo ✅ Database already exists
)

REM Check/Create database user
gcloud sql users describe %DB_USER% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 👤 Creating database user...
    set /p USER_PASSWORD="Enter password for database user '%DB_USER%': "
    gcloud sql users create %DB_USER% --instance=%INSTANCE_NAME% --password=%USER_PASSWORD% --quiet
    echo ✅ Database user created
) else (
    echo ✅ Database user already exists
)

echo.

REM Step 3: Check .env file
echo ========================================
echo Step 3: Checking environment configuration...
echo ========================================
if not exist .env (
    echo ⚠️  .env file not found. Creating from template...
    copy env.production.example .env >nul
    echo.
    echo ⚠️  IMPORTANT: Please edit .env file and update:
    echo    - DB_HOST=/cloudsql/%CONNECTION_NAME%
    echo    - DB_PASSWORD=your-database-password
    echo    - JWT_SECRET=your-very-long-secret-key
    echo    - SESSION_SECRET=your-very-long-secret-key
    echo    - BACKEND_URL=will-be-updated-after-deployment
    echo.
    pause
) else (
    echo ✅ .env file exists
)

echo.

REM Step 4: Build Docker image
echo ========================================
echo Step 4: Building Docker image...
echo ========================================
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Docker is not installed or not running
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    exit /b 1
)

echo 🐳 Building Docker image...
docker build -t %IMAGE_NAME%:latest .
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker build failed
    exit /b 1
)
echo ✅ Docker image built successfully
echo.

REM Step 5: Push image to Container Registry
echo ========================================
echo Step 5: Pushing image to Container Registry...
echo ========================================
echo 📤 Pushing image...
docker push %IMAGE_NAME%:latest
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker push failed
    exit /b 1
)
echo ✅ Image pushed successfully
echo.

REM Step 6: Deploy to Cloud Run
echo ========================================
echo Step 6: Deploying to Cloud Run...
echo ========================================
echo 🚀 Deploying service...

REM Check if service exists
gcloud run services describe %SERVICE_NAME% --region %REGION% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Service already exists. Updating...
    set DEPLOY_CMD=update
) else (
    echo 📦 Creating new service...
    set DEPLOY_CMD=deploy
)

gcloud run %DEPLOY_CMD% %SERVICE_NAME% ^
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
    --add-cloudsql-instances %CONNECTION_NAME% ^
    --set-env-vars NODE_ENV=production,PORT=8080 ^
    --project %PROJECT_ID%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed
    exit /b 1
)

echo ✅ Service deployed successfully
echo.

REM Step 7: Get service URL
echo ========================================
echo Step 7: Getting service URL...
echo ========================================
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i

if "%SERVICE_URL%"=="" (
    echo ❌ Could not get service URL
    exit /b 1
)

echo ✅ Service URL: %SERVICE_URL%
echo ✅ API URL: %SERVICE_URL%/api
echo ✅ Health Check: %SERVICE_URL%/api/health
echo.

REM Step 8: Update .env with backend URL
echo ========================================
echo Step 8: Updating configuration...
echo ========================================
echo 📝 Updating .env file with backend URL...
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'BACKEND_URL=.*', 'BACKEND_URL=%SERVICE_URL%' | Set-Content .env" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ .env updated with BACKEND_URL=%SERVICE_URL%
    ) else (
        echo ⚠️  Could not update .env automatically. Please update manually:
        echo    BACKEND_URL=%SERVICE_URL%
    )
) else (
    echo ⚠️  .env file not found. Please create it and set:
    echo    BACKEND_URL=%SERVICE_URL%
)
echo.

REM Step 9: Test deployment
echo ========================================
echo Step 9: Testing deployment...
echo ========================================
echo 🧪 Testing health endpoint...
timeout /t 5 /nobreak >nul
curl -s "%SERVICE_URL%/api/health" | findstr /C:"OK" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Health check passed
) else (
    echo ⚠️  Health check failed (service might still be starting)
)

echo.

REM Step 10: Update frontend configuration
echo ========================================
echo Step 10: Updating frontend configuration...
echo ========================================
set FRONTEND_CONFIG=E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart
if exist "%FRONTEND_CONFIG%" (
    echo 📝 Updating frontend config...
    node update-frontend-config.js %SERVICE_URL%
    echo ✅ Frontend config updated
) else (
    echo ⚠️  Frontend config not found at: %FRONTEND_CONFIG%
    echo    Please update manually: %SERVICE_URL%/api
)

echo.

REM Final Summary
echo ========================================
echo 🎉 Deployment Complete!
echo ========================================
echo.
echo 📋 Summary:
echo    Project: %PROJECT_ID%
echo    Service: %SERVICE_NAME%
echo    Region: %REGION%
echo    URL: %SERVICE_URL%
echo    API: %SERVICE_URL%/api
echo    Health: %SERVICE_URL%/api/health
echo.
echo 📝 Next Steps:
echo    1. Run database migrations (see instructions below)
echo    2. Update FRONTEND_URL in .env if needed
echo    3. Test the API from your frontend
echo.
echo 🔧 To run migrations:
echo    1. Install Cloud SQL Proxy
echo    2. Run: cloud_sql_proxy -instances=%CONNECTION_NAME%=tcp:5432
echo    3. In another terminal: npm run migrate:latest
echo.
echo 📊 To view logs:
echo    gcloud run services logs read %SERVICE_NAME% --region %REGION%
echo.

pause

endlocal

