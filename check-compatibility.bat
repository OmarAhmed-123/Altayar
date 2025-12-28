@echo off
REM Script to check compatibility between backend and frontend

if "%~1"=="" (
    echo ❌ Error: Backend URL is required
    echo Usage: check-compatibility.bat ^<BACKEND_URL^>
    echo Example: check-compatibility.bat https://altayar-backend-xxxxx-uc.a.run.app
    exit /b 1
)

node check-compatibility.js %1

