@echo off
echo ==============================================
echo   🚀 React Native Package Auto-Updater (Windows)
echo   Project: %cd%
echo ==============================================
echo.

echo ===== 1) Checking outdated packages =====
ncu
if %errorlevel% neq 0 (
    echo.
    echo [⚠ ERROR] npm-check-updates not installed!
    echo Run:  npm install -g npm-check-updates
    pause
    exit /b
)

echo.
echo ===== 2) Updating package.json to latest versions =====
ncu -u

echo.
echo ===== 3) Deleting node_modules and lock files =====
echo Removing node_modules...
rmdir /s /q node_modules 2>nul
echo Removing package-lock.json...
del package-lock.json 2>nul
echo Removing yarn.lock...
del yarn.lock 2>nul

echo.
echo ===== 4) Installing fresh dependencies =====
npm install

echo.
echo ===== ✅ Update Completed Successfully! =====
echo If using iOS, run:  cd ios && pod install
echo Then build normally.
echo ==============================================
echo   🏁 Finished! Press any key to exit...
echo ==============================================
pause >nul
