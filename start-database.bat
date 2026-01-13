@echo off
REM Script to start Cloud SQL database instance
REM Usage: start-database.bat

setlocal enabledelayedexpansion

set PROJECT_ID=altayar-46d6f
set INSTANCE_NAME=altayar-db
set REGION=us-central1

echo ========================================
echo تشغيل قاعدة البيانات على Google Cloud
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

if "%CURRENT_STATE%"=="STOPPED" (
    echo.
    echo ▶️  Starting Cloud SQL instance...
    echo ⏳ This may take a few minutes...
    gcloud sql instances patch %INSTANCE_NAME% --activation-policy=ALWAYS
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Database instance started successfully!
        echo.
        echo ⏳ Waiting for instance to be ready...
        :WAIT_LOOP
        timeout /t 10 /nobreak >nul
        for /f "tokens=*" %%j in ('gcloud sql instances describe %INSTANCE_NAME% --format="value(state)"') do set NEW_STATE=%%j
        if "%NEW_STATE%"=="RUNNABLE" (
            echo ✅ Instance is now RUNNABLE and ready to accept connections!
        ) else (
            echo ⏳ Current state: %NEW_STATE% - waiting...
            goto WAIT_LOOP
        )
    ) else (
        echo ❌ Failed to start instance
        pause
        exit /b 1
    )
) else if "%CURRENT_STATE%"=="RUNNABLE" (
    echo.
    echo ℹ️  Instance is already running
) else (
    echo.
    echo ⚠️  Instance is in state: %CURRENT_STATE%
    echo ⚠️  Please wait for the instance to be in a stable state
)

echo.
pause

endlocal

