@echo off
chcp 65001 >nul
echo ========================================
echo Fix All Issues - Direct Execution
echo ========================================
echo.

set PROJECT_ID=altayar-46d6f
set SERVICE_NAME=altayar-backend
set REGION=us-central1
set CONNECTION_NAME=%PROJECT_ID%:%REGION%:altayar-db
set DB_PASSWORD=AAIOH2040%%

echo [1/9] Setting project...
gcloud config set project %PROJECT_ID%
echo.

echo [2/9] Getting service URL...
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region %REGION% --format="value(status.url)" --project %PROJECT_ID% 2^>^&1') do set SERVICE_URL=%%i
if "%SERVICE_URL%"=="" (
    echo ERROR: Could not get service URL
    pause
    exit /b 1
)
echo Service URL: %SERVICE_URL%
echo.

echo [3/9] Enabling APIs...
gcloud services enable run.googleapis.com --project %PROJECT_ID% >nul 2>&1
gcloud services enable sqladmin.googleapis.com --project %PROJECT_ID% >nul 2>&1
gcloud services enable cloudbuild.googleapis.com --project %PROJECT_ID% >nul 2>&1
gcloud services enable containerregistry.googleapis.com --project %PROJECT_ID% >nul 2>&1
echo APIs enabled
echo.

echo [4/9] Generating secrets...
powershell -Command "$JWT = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $SESSION = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); [System.Environment]::SetEnvironmentVariable('JWT_SECRET', $JWT, 'Process'); [System.Environment]::SetEnvironmentVariable('SESSION_SECRET', $SESSION, 'Process')"
for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable('JWT_SECRET', 'Process')"') do set JWT_SECRET=%%i
for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable('SESSION_SECRET', 'Process')"') do set SESSION_SECRET=%%i
echo Secrets generated
echo.

echo [5/9] Building environment variables...
set ENV_VARS=NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/%CONNECTION_NAME%,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=%DB_PASSWORD%,DB_NAME=tourist_app_db,JWT_SECRET=%JWT_SECRET%,SESSION_SECRET=%SESSION_SECRET%,FRONTEND_URL=https://altayar-46d6f.web.app^ https://altayar-46d6f.firebaseapp.com,BACKEND_URL=%SERVICE_URL%
echo.

echo [6/9] Updating Cloud Run service (this may take 2-3 minutes)...
gcloud run services update %SERVICE_NAME% --region %REGION% --set-env-vars "%ENV_VARS%" --add-cloudsql-instances %CONNECTION_NAME% --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project %PROJECT_ID%
if %ERRORLEVEL% NEQ 0 (
    echo Retrying without --add-cloudsql-instances...
    gcloud run services update %SERVICE_NAME% --region %REGION% --set-env-vars "%ENV_VARS%" --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project %PROJECT_ID%
)
echo.

echo [7/9] Waiting 30 seconds for service to be ready...
timeout /t 30 /nobreak >nul
echo.

echo [8/9] Testing endpoints...
curl -s -o nul -w "Health Check: %%{http_code}\n" "%SERVICE_URL%/api/health"
curl -s -o nul -w "OAuth Config: %%{http_code}\n" "%SERVICE_URL%/api/oauth/config"
echo.

echo [9/9] Updating frontend...
if exist "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart" (
    node update-frontend-config.js %SERVICE_URL% >nul 2>&1
    echo Frontend updated
) else (
    echo Frontend config not found
)
echo.

echo ========================================
echo COMPLETE!
echo ========================================
echo Service URL: %SERVICE_URL%
echo API URL: %SERVICE_URL%/api
echo Health: %SERVICE_URL%/api/health
echo OAuth: %SERVICE_URL%/api/oauth/config
echo.
pause

