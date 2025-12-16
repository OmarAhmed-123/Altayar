@echo off
echo ========================================
echo Installing Dependencies for Altayar Backend
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing all dependencies...
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Installation failed!
    echo Trying to clean cache and reinstall...
    call npm cache clean --force
    call npm install
)

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Installation completed successfully!
    echo ========================================
    echo.
    echo You can now run: npm start
) else (
    echo.
    echo ========================================
    echo Installation failed!
    echo ========================================
    echo Please check the error messages above.
)

echo.
pause

