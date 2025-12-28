@echo off
chcp 65001 >nul
echo ========================================
echo Quick Deploy - Fixed Syntax
echo ========================================
echo.

set PROJECT_ID=altayar-46d6f
set SERVICE_NAME=altayar-backend
set REGION=us-central1
set CONNECTION_NAME=%PROJECT_ID%:%REGION%:altayar-db
set DB_PASSWORD=AAIOH2040%%

echo [1/4] Setting project...
gcloud config set project %PROJECT_ID%
echo.

echo [2/4] Generating secrets and creating YAML file...
powershell -Command "$JWT = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $SESSION = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_}); $content = @\"`nNODE_ENV: production`nDB_HOST: /cloudsql/altayar-46d6f:us-central1:altayar-db`nDB_PORT: `"5432`"`nDB_USER: postgres`nDB_PASSWORD: AAIOH2040%%`nDB_NAME: tourist_app_db`nJWT_SECRET: $JWT`nSESSION_SECRET: $SESSION`nFRONTEND_URL: https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com`nBACKEND_URL: https://altayar-backend-kuwjte4rda-uc.a.run.app`n\"@; $content | Out-File -FilePath 'env-vars-deploy.yaml' -Encoding UTF8"
echo OK
echo.

echo [3/4] Deploying (3-5 minutes)...
gcloud run deploy %SERVICE_NAME% --source . --region %REGION% --env-vars-file env-vars-deploy.yaml --memory 2Gi --cpu 2 --timeout 300 --max-instances 10 --min-instances 1 --project %PROJECT_ID%
echo.

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Deployment failed
    pause
    exit /b 1
)

echo [4/4] Waiting 60 seconds and testing...
timeout /t 60 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://altayar-backend-kuwjte4rda-uc.a.run.app/api/oauth/config' -UseBasicParsing -TimeoutSec 20; Write-Host 'SUCCESS: Status' $r.StatusCode; Write-Host 'Response:' $r.Content } catch { Write-Host 'ERROR:' $_.Exception.Message }"
echo.

echo ========================================
echo Complete!
echo ========================================
pause

