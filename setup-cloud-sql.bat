@echo off
REM Script to set up Cloud SQL for Altayar Backend (Windows)
REM Usage: setup-cloud-sql.bat

setlocal enabledelayedexpansion

set PROJECT_ID=altayarback
set REGION=us-central1
set INSTANCE_NAME=altayar-db
set DATABASE_NAME=tourist_app_db
set DB_USER=postgres

echo 🗄️  Setting up Cloud SQL for Altayar Backend...
echo Project: %PROJECT_ID%
echo Region: %REGION%
echo Instance: %INSTANCE_NAME%

REM Check if gcloud is installed
where gcloud >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI is not installed
    exit /b 1
)

REM Set the project
gcloud config set project %PROJECT_ID%

REM Enable SQL Admin API
echo 🔧 Enabling SQL Admin API...
gcloud services enable sqladmin.googleapis.com

REM Check if instance already exists
gcloud sql instances describe %INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Instance %INSTANCE_NAME% already exists. Skipping creation.
) else (
    echo 📦 Creating Cloud SQL instance...
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
        --maintenance-window-hour=4
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to create instance
        exit /b 1
    )
    
    echo ✅ Instance created successfully!
)

REM Get connection name
for /f "tokens=*" %%i in ('gcloud sql instances describe %INSTANCE_NAME% --format "value(connectionName)"') do set CONNECTION_NAME=%%i
echo 🔗 Connection Name: %CONNECTION_NAME%

REM Check if database exists
gcloud sql databases describe %DATABASE_NAME% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Database %DATABASE_NAME% already exists. Skipping creation.
) else (
    echo 📊 Creating database...
    gcloud sql databases create %DATABASE_NAME% --instance=%INSTANCE_NAME%
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to create database
        exit /b 1
    )
    echo ✅ Database created successfully!
)

REM Check if user exists
gcloud sql users describe %DB_USER% --instance=%INSTANCE_NAME% >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  User %DB_USER% already exists.
    set /p UPDATE_PASSWORD="Do you want to update the password? (y/n): "
    if /i "!UPDATE_PASSWORD!"=="y" (
        set /p NEW_PASSWORD="Enter new password: "
        gcloud sql users set-password %DB_USER% ^
            --instance=%INSTANCE_NAME% ^
            --password=%NEW_PASSWORD%
        if %ERRORLEVEL% EQU 0 (
            echo ✅ Password updated!
        )
    )
) else (
    echo 👤 Creating database user...
    set /p USER_PASSWORD="Enter password for user %DB_USER%: "
    gcloud sql users create %DB_USER% ^
        --instance=%INSTANCE_NAME% ^
        --password=%USER_PASSWORD%
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to create user
        exit /b 1
    )
    echo ✅ User created successfully!
)

echo.
echo ✅ Cloud SQL setup complete!
echo.
echo 📝 Connection details:
echo    Connection Name: %CONNECTION_NAME%
echo    Host: /cloudsql/%CONNECTION_NAME%
echo    Database: %DATABASE_NAME%
echo    User: %DB_USER%
echo.
echo 📋 Update your .env file with:
echo    DB_HOST=/cloudsql/%CONNECTION_NAME%
echo    DB_NAME=%DATABASE_NAME%
echo    DB_USER=%DB_USER%
echo    DB_PASSWORD=^<your-password^>
echo.
echo 🔧 To connect locally, use Cloud SQL Proxy:
echo    cloud_sql_proxy.exe -instances=%CONNECTION_NAME%=tcp:5432

endlocal

