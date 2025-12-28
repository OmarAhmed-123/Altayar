@echo off
chcp 65001 >nul
echo ========================================
echo Complete Deployment and Testing
echo ========================================
echo.

set PROJECT_ID=altayar-46d6f
set SERVICE_NAME=altayar-backend
set REGION=us-central1
set CONNECTION_NAME=%PROJECT_ID%:%REGION%:altayar-db
set DB_PASSWORD=AAIOH2040%%
set SERVICE_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app

echo [1/5] Setting project...
gcloud config set project %PROJECT_ID%
echo.

echo [2/5] Generating secrets...
for /f "tokens=*" %%i in ('powershell -Command "$JWT = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $SESSION = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); Write-Host $JWT; Write-Host $SESSION"') do (
    if not defined JWT_SECRET (
        set JWT_SECRET=%%i
    ) else (
        set SESSION_SECRET=%%i
    )
)
echo OK
echo.

echo [3/5] Deploying (3-5 minutes)...
set FRONTEND_URLS=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com
gcloud run deploy %SERVICE_NAME% --source . --region %REGION% --set-env-vars "NODE_ENV=production,DB_HOST=/cloudsql/%CONNECTION_NAME%,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=%DB_PASSWORD%,DB_NAME=tourist_app_db,JWT_SECRET=%JWT_SECRET%,SESSION_SECRET=%SESSION_SECRET%,FRONTEND_URL=%FRONTEND_URLS%,BACKEND_URL=%SERVICE_URL%" --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project %PROJECT_ID%
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo [4/5] Waiting 60 seconds...
timeout /t 60 /nobreak >nul
echo.

echo [5/5] Testing OAuth config...
powershell -Command "try { $r = Invoke-WebRequest -Uri '%SERVICE_URL%/api/oauth/config' -UseBasicParsing -TimeoutSec 20; Write-Host 'SUCCESS: Status' $r.StatusCode; Write-Host 'Response:' $r.Content } catch { Write-Host 'ERROR:' $_.Exception.Message }"
echo.

echo ========================================
echo Complete!
echo ========================================
pause

