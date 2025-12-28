@echo off
chcp 65001 >nul
echo ========================================
echo Complete Deployment - All Fixes Applied
echo ========================================
echo.

set PROJECT_ID=altayar-46d6f
set SERVICE_NAME=altayar-backend
set REGION=us-central1
set SERVICE_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app

echo [1/5] Setting project...
gcloud config set project %PROJECT_ID%
echo.

echo [2/5] Generating secrets and creating YAML file...
powershell -ExecutionPolicy Bypass -Command "$JWT = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $SESSION = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $content = 'NODE_ENV: production`nDB_HOST: /cloudsql/altayar-46d6f:us-central1:altayar-db`nDB_PORT: \"5432\"`nDB_USER: postgres`nDB_PASSWORD: \"AAIOH2040%%\"`nDB_NAME: tourist_app_db`nJWT_SECRET: \"' + $JWT + '\"`nSESSION_SECRET: \"' + $SESSION + '\"`nFRONTEND_URL: \"https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com\"`nBACKEND_URL: \"%SERVICE_URL%\"'; $content | Out-File -FilePath 'env-vars-deploy.yaml' -Encoding UTF8"
echo OK
echo.

echo [3/5] Deploying (3-5 minutes)...
gcloud run deploy %SERVICE_NAME% --source . --region %REGION% --env-vars-file env-vars-deploy.yaml --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project %PROJECT_ID%
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo [4/5] Waiting 60 seconds...
timeout /t 60 /nobreak >nul
echo.

echo [5/5] Testing endpoints...
powershell -Command "try { $h = Invoke-WebRequest -Uri '%SERVICE_URL%/api/health' -UseBasicParsing -TimeoutSec 20; Write-Host 'Health: OK - Status' $h.StatusCode } catch { Write-Host 'Health: ERROR -' $_.Exception.Message }"
powershell -Command "try { $o = Invoke-WebRequest -Uri '%SERVICE_URL%/api/oauth/config' -UseBasicParsing -TimeoutSec 20; Write-Host 'OAuth: SUCCESS - Status' $o.StatusCode; Write-Host 'Response:' $o.Content } catch { Write-Host 'OAuth: ERROR -' $_.Exception.Message }"
echo.

echo ========================================
echo Complete!
echo ========================================
pause

