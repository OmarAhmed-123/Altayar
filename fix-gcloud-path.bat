@echo off
REM Quick script to add gcloud to PATH for current session
REM This helps if gcloud is not in system PATH

set GCLOUD_BIN=C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin

if exist "%GCLOUD_BIN%\gcloud.cmd" (
    set PATH=%PATH%;%GCLOUD_BIN%
    echo ✅ Added gcloud to PATH: %GCLOUD_BIN%
    echo.
    echo Testing gcloud...
    gcloud --version
    echo.
    echo ✅ gcloud is now available in this session
    echo.
    echo To make this permanent, add this to your system PATH:
    echo %GCLOUD_BIN%
) else (
    echo ❌ gcloud not found at: %GCLOUD_BIN%
    echo Please check your Google Cloud SDK installation
)

