@echo off
REM Script to stop/shutdown Cloud SQL database instance
REM Usage: stop-database.bat

setlocal enabledelayedexpansion

set PROJECT_ID=altayar-46d6f
set INSTANCE_NAME=altayar-db
set REGION=us-central1

echo ========================================
echo إيقاف قاعدة البيانات على Google Cloud
echo ========================================
echo.

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI is not installed
    echo Please install Google Cloud SDK first
    pause
    exit /b 1
)

REM Set the project
echo 🔧 Setting project to %PROJECT_ID%...
gcloud config set project %PROJECT_ID%

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to set project
    pause
    exit /b 1
)

REM Check current instance status
echo.
echo 📊 Checking current instance status...
gcloud sql instances describe %INSTANCE_NAME% --format="value(state)" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Instance %INSTANCE_NAME% not found!
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('gcloud sql instances describe %INSTANCE_NAME% --format="value(state)"') do set CURRENT_STATE=%%i
echo Current state: %CURRENT_STATE%

if "%CURRENT_STATE%"=="RUNNABLE" (
    echo.
    echo 🛑 Stopping Cloud SQL instance...
    gcloud sql instances patch %INSTANCE_NAME% --activation-policy=NEVER
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Database instance stopped successfully!
        echo.
        echo ℹ️  The instance is now stopped and will not incur charges.
        echo ℹ️  Use start-database.bat to start it again.
    ) else (
        echo ❌ Failed to stop instance
        pause
        exit /b 1
    )
) else if "%CURRENT_STATE%"=="STOPPED" (
    echo.
    echo ℹ️  Instance is already stopped
) else (
    echo.
    echo ⚠️  Instance is in state: %CURRENT_STATE%
    echo ⚠️  Cannot stop instance in this state
)

echo.
pause

endlocal

