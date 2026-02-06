@echo off
echo ========================================
echo Fixing Gradle Build Issues
echo ========================================
echo.

echo [1/5] Stopping all Gradle daemons...
call gradlew.bat --stop
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Could not stop Gradle daemons
)
echo.

echo [2/5] Cleaning Gradle cache...
if exist "%USERPROFILE%\.gradle\caches" (
    echo Cleaning user Gradle cache...
    rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
)
echo.

echo [3/5] Cleaning project build directories...
if exist "build" (
    rmdir /s /q "build" 2>nul
)
if exist "app\build" (
    rmdir /s /q "app\build" 2>nul
)
echo.

echo [4/5] Cleaning .gradle directory...
if exist ".gradle" (
    rmdir /s /q ".gradle" 2>nul
)
echo.

echo [5/5] Verifying Java installation...
java -version
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java is not installed or not in PATH
    pause
    exit /b 1
)
echo.

echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo You can now try building again with:
echo   npx react-native run-android
echo.
pause

