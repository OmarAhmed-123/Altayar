@echo off
REM Script to check Cloud SQL database instance status
REM Usage: database-status.bat

setlocal enabledelayedexpansion

set PROJECT_ID=altayar-46d6f
set INSTANCE_NAME=altayar-db
set REGION=us-central1

echo ========================================
echo حالة قاعدة البيانات على Google Cloud
echo ========================================
echo.

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI is not installed
    pause
    exit /b 1
)

REM Set the project
gcloud config set project %PROJECT_ID%

REM Get instance information
echo 📊 Instance Information:
echo.
gcloud sql instances describe %INSTANCE_NAME% --format="table(
    name,
    state,
    databaseVersion,
    settings.tier,
    settings.dataDiskSizeGb,
    ipAddresses[0].ipAddress,
    connectionName
)" 2>nul

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to get instance information
    pause
    exit /b 1
)

echo.
echo ========================================
echo.

REM Get detailed status
for /f "tokens=*" %%i in ('gcloud sql instances describe %INSTANCE_NAME% --format="value(state)"') do set STATE=%%i

if "%STATE%"=="RUNNABLE" (
    echo ✅ Status: RUNNABLE - Database is running
) else if "%STATE%"=="STOPPED" (
    echo 🛑 Status: STOPPED - Database is stopped
) else (
    echo ⚠️  Status: %STATE%
)

echo.
pause

endlocal

