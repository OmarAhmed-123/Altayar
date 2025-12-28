@echo off
REM Fix package-lock.json synchronization

echo ========================================
echo Fixing package-lock.json
echo ========================================
echo.
echo This will update package-lock.json to match package.json
echo.

cd /d "%~dp0"

echo Running npm install...
call npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo package-lock.json updated successfully!
    echo ========================================
    echo.
    echo You can now run: DEPLOY_NOW.bat
) else (
    echo.
    echo ========================================
    echo Failed to update package-lock.json
    echo ========================================
)

pause

