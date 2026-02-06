@echo off
echo ========================================
echo Fix react-native-video for Android
echo ========================================
echo.

cd /d E:\Altayar82

echo Step 1: Installing react-native-video...
call npm run install:video

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install react-native-video
    pause
    exit /b 1
)

echo.
echo Step 2: Cleaning Android build...
cd android
call gradlew.bat clean

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to clean Android build
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo Step 3: Rebuilding Android app...
echo This may take a few minutes...
call npx react-native run-android

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! react-native-video is now fixed.
    echo ========================================
    echo.
    echo The app should now work without Video errors.
    echo.
) else (
    echo.
    echo ========================================
    echo WARNING: Build completed with errors.
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo If the error persists, try:
    echo   1. Delete node_modules and reinstall: rm -rf node_modules && npm install
    echo   2. Delete android/build and android/app/build folders
    echo   3. Run this script again
    echo.
)

pause

