@echo off
REM ========================================
REM Altayar Backend - Complete Deployment (Fixed)
REM This script handles all path issues automatically
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Altayar Backend - Complete Deployment
echo ========================================
echo.

REM Step 1: Configure gcloud path
echo [1/8] Configuring gcloud path...
set "GCLOUD_BIN=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin"
if exist "!GCLOUD_BIN!\gcloud.cmd" (
    set "PATH=!PATH!;!GCLOUD_BIN!"
    echo ✅ gcloud path configured
) else (
    echo ❌ gcloud not found. Please install Google Cloud SDK.
    pause
    exit /b 1
)

REM Verify gcloud
gcloud --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ gcloud is not working. Please check installation.
    pause
    exit /b 1
)

REM Step 2: Set variables
set PROJECT_ID=altayar-46d6f
set BILLING_ACCOUNT_ID=01A9EE-92CE19-7CF271
set REGION=us-central1
set SERVICE_NAME=altayar-backend
set INSTANCE_NAME=altayar-db
set DATABASE_NAME=tourist_app_db
set DB_USER=postgres
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo [2/8] Verifying project configuration...
gcloud config get-value project | findstr /C:"%PROJECT_ID%" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Setting project to %PROJECT_ID%...
    gcloud config set project %PROJECT_ID%
)
echo ✅ Project: %PROJECT_ID%
echo.

REM Step 3: Enable APIs
echo [3/8] Enabling required APIs...
gcloud services enable cloudbuild.googleapis.com --quiet
gcloud services enable run.googleapis.com --quiet
gcloud services enable sqladmin.googleapis.com --quiet
gcloud services enable containerregistry.googleapis.com --quiet
gcloud services enable compute.googleapis.com --quiet
echo ✅ APIs enabled
echo.

REM Step 4: Setup Cloud SQL
echo [4/8] Setting up Cloud SQL database...
gcloud sql instances describe %INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📦 Creating Cloud SQL instance...
    echo ⚠️  You will be prompted for database password (use strong password, 12+ chars)
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
        pause
        exit /b 1
    )
    
    echo ✅ Cloud SQL instance created
    timeout /t 30 /nobreak >nul
) else (
    echo ✅ Cloud SQL instance already exists
)

REM Get connection name
for /f "tokens=*" %%i in ('gcloud sql instances describe %INSTANCE_NAME% --format "value(connectionName)"') do set CONNECTION_NAME=%%i
echo 🔗 Connection: %CONNECTION_NAME%

REM Create database
gcloud sql databases describe %DATABASE_NAME% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 📊 Creating database...
    gcloud sql databases create %DATABASE_NAME% --instance=%INSTANCE_NAME% --quiet
    echo ✅ Database created
) else (
    echo ✅ Database already exists
)

REM Create user
gcloud sql users describe %DB_USER% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 👤 Creating database user...
    set /p USER_PASSWORD="Enter password for user '%DB_USER%': "
    gcloud sql users create %DB_USER% --instance=%INSTANCE_NAME% --password=%USER_PASSWORD% --quiet
    echo ✅ User created
) else (
    echo ✅ User already exists
)
echo.

REM Step 5: Check .env
echo [5/8] Checking environment configuration...
if not exist .env (
    echo ⚠️  Creating .env from template...
    copy env.production.example .env >nul
    echo.
    echo ⚠️  IMPORTANT: Please edit .env and set:
    echo    DB_HOST=/cloudsql/%CONNECTION_NAME%
    echo    DB_PASSWORD=your-password
    echo    JWT_SECRET=your-secret-key
    echo    SESSION_SECRET=your-secret-key
    echo.
    pause
)
echo ✅ .env file ready
echo.

REM Step 6: Build Docker image
echo [6/8] Building Docker image...
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker not found. Please install Docker Desktop.
    pause
    exit /b 1
)

docker build -t %IMAGE_NAME%:latest .
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker build failed
    pause
    exit /b 1
)
echo ✅ Image built
echo.

REM Step 7: Push image
echo [7/8] Pushing image to Container Registry...
docker push %IMAGE_NAME%:latest
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker push failed
    pause
    exit /b 1
)
echo ✅ Image pushed
echo.

REM Step 8: Deploy to Cloud Run
echo [8/8] Deploying to Cloud Run...
gcloud run services describe %SERVICE_NAME% --region %REGION% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Service exists. Updating...
) else (
    echo 📦 Creating new service...
)

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
    --add-cloudsql-instances %CONNECTION_NAME% ^
    --set-env-vars NODE_ENV=production,PORT=8080 ^
    --project %PROJECT_ID%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Deployment failed
    pause
    exit /b 1
)

echo ✅ Service deployed
echo.

REM Get service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format "value(status.url)"') do set SERVICE_URL=%%i

echo ========================================
echo 🎉 Deployment Complete!
echo ========================================
echo.
echo 📍 Service URL: %SERVICE_URL%
echo 🔗 API URL: %SERVICE_URL%/api
echo ❤️  Health: %SERVICE_URL%/api/health
echo.

REM Update .env
if exist .env (
    powershell -Command "(Get-Content .env) -replace 'BACKEND_URL=.*', 'BACKEND_URL=%SERVICE_URL%' | Set-Content .env" 2>nul
    echo ✅ Updated .env with BACKEND_URL
)

REM Update frontend
set FRONTEND_CONFIG=E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart
if exist "%FRONTEND_CONFIG%" (
    echo 📝 Updating frontend config...
    node update-frontend-config.js %SERVICE_URL% 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Frontend config updated
    )
)

echo.
echo 📋 Next Steps:
echo    1. Run migrations (see FINAL_DEPLOYMENT_STEPS.md)
echo    2. Test API: curl %SERVICE_URL%/api/health
echo    3. Update FRONTEND_URL in .env if needed
echo.

pause

endlocal

