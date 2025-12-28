@echo off
REM Script to update Flutter frontend configuration with deployed backend URL
REM Usage: update-frontend-config.bat <BACKEND_URL>

if "%~1"=="" (
    echo ❌ Error: Backend URL is required
    echo Usage: update-frontend-config.bat ^<BACKEND_URL^>
    echo Example: update-frontend-config.bat https://altayar-backend-xxxxx-uc.a.run.app
    exit /b 1
)

node update-frontend-config.js %1

