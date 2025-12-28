@echo off
REM Complete deployment with new billing account

echo ========================================
echo Altayar Backend Deployment
echo ========================================
echo.
echo Project: altayar-46d6f
echo Billing Account: 01A9EE-92CE19-7CF271 (Active)
echo Email: dipencilcom@gmail.com
echo.
echo Checking account...
echo.

REM Check if correct account is being used
powershell.exe -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Continue'; $account = & 'C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd' config get-value account 2>&1 | Where-Object { $_ -and $_ -notmatch 'ERROR' -and $_ -notmatch 'Exception' }; if ($account -notmatch 'dipencilcom@gmail.com') { Write-Host 'WARNING: Wrong account detected!' -ForegroundColor Yellow; Write-Host 'Current: ' $account -ForegroundColor Yellow; Write-Host 'Required: dipencilcom@gmail.com' -ForegroundColor Yellow; Write-Host ''; Write-Host 'Please run SWITCH_ACCOUNT.bat first!' -ForegroundColor Red; pause; exit 1 }"

echo Starting deployment...
echo.

REM Run PowerShell with Continue error action to prevent stopping on stderr
powershell.exe -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Continue'; & '%~dp0deploy-complete.ps1'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Deployment completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Deployment failed. Please check errors above.
    echo ========================================
)

pause

