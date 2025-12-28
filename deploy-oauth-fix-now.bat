@echo off
chcp 65001 >nul
echo ========================================
echo Deploying OAuth 404 Fix
echo ========================================
echo.

set PROJECT_ID=altayar-46d6f
set SERVICE_NAME=altayar-backend
set REGION=us-central1
set DB_PASSWORD=AAIOH2040%%

echo [1/4] Setting project...
gcloud config set project %PROJECT_ID%
echo.

echo [2/4] Generating secrets...
for /f "tokens=*" %%i in ('powershell -Command "$JWT = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $SESSION = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); [System.Environment]::SetEnvironmentVariable('JWT_SECRET', $JWT, 'Process'); [System.Environment]::SetEnvironmentVariable('SESSION_SECRET', $SESSION, 'Process')"') do set JWT_SECRET=%%i
for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable('JWT_SECRET', 'Process')"') do set JWT_SECRET=%%i
for /f "tokens=*" %%i in ('powershell -Command "[System.Environment]::GetEnvironmentVariable('SESSION_SECRET', 'Process')"') do set SESSION_SECRET=%%i
echo.

echo [3/4] Deploying to Cloud Run (this will take 3-5 minutes)...
gcloud run deploy %SERVICE_NAME% --source . --region %REGION% --set-env-vars "NODE_ENV=production,PORT=8080,DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=%DB_PASSWORD%,DB_NAME=tourist_app_db,JWT_SECRET=%JWT_SECRET%,SESSION_SECRET=%SESSION_SECRET%,FRONTEND_URL=https://altayar-46d6f.web.app https://altayar-46d6f.firebaseapp.com,BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app" --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project %PROJECT_ID%
echo.

echo [4/4] Waiting 30 seconds and testing...
timeout /t 30 /nobreak >nul
curl -s -o nul -w "OAuth Config Status: %%{http_code}\n" "https://altayar-backend-kuwjte4rda-uc.a.run.app/api/oauth/config"
echo.

echo ========================================
echo Deployment complete!
echo ========================================
pause

