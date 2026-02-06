@echo off
echo ========================================
echo Complete Fix for react-native-video
echo ========================================
echo.
echo This script will:
echo 1. Reinstall react-native-video
echo 2. Clean Android build files
echo 3. Clean Metro bundler cache
echo 4. Rebuild the Android application
echo.
echo CRITICAL: This will take several minutes.
echo.
pause

echo.
echo --- Step 1: Navigate to project directory ---
echo.
cd /d E:\Altayar82
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Cannot navigate to E:\Altayar82
    pause
    exit /b %ERRORLEVEL%
)
echo ✅ Current directory: %CD%
echo.

echo --- Step 2: Reinstall react-native-video ---
echo.
call npm run install:video
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error reinstalling react-native-video. Exiting.
    pause
    exit /b %ERRORLEVEL%
)
echo ✅ react-native-video reinstalled successfully.
echo.

echo --- Step 3: Clean Metro bundler cache ---
echo.
call npx metro start --reset-cache --host 0.0.0.0 &
timeout /t 3 /nobreak >nul
taskkill /F /IM node.exe /T >nul 2>&1
echo ✅ Metro cache cleared.
echo.

echo --- Step 4: Clean Android build files ---
echo.
cd android
call .\gradlew.bat clean
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error cleaning Android build. Exiting.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
echo ✅ Android build cleaned successfully.
echo.

echo --- Step 5: Clean Android app build files ---
echo.
if exist "app\build" (
    rmdir /s /q "app\build"
    echo ✅ Android app build directory removed.
) else (
    echo ℹ️  Android app build directory does not exist.
)
echo.

echo --- Step 6: Rebuild the Android application ---
echo.
cd ..
call npx react-native run-android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error rebuilding Android application.
    echo.
    echo You may need to:
    echo 1. Check if Android device/emulator is connected
    echo 2. Check if Metro bundler is running
    echo 3. Try running manually: npx react-native run-android
    pause
    exit /b %ERRORLEVEL%
)
echo ✅ Android application rebuilt successfully.
echo.

echo ========================================
echo Fix process completed successfully!
echo ========================================
echo.
echo Please test your application:
echo 1. Open the Reels screen
echo 2. Try playing a video reel
echo 3. If you see "مشغل الفيديو غير متاح", the native module is still not linked
echo 4. In that case, try:
echo    - Restart the app completely
echo    - Rebuild the app again
echo    - Check Android logs: adb logcat | grep -i video
echo.
pause

