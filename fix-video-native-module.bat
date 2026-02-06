@echo off
echo ========================================
echo Fixing react-native-video Native Module
echo ========================================
echo.

echo [1/7] Cleaning node_modules...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json
echo Done.
echo.

echo [2/7] Reinstalling dependencies...
call npm install
echo Done.
echo.

echo [3/7] Installing react-native-video...
call npm run install:video
echo Done.
echo.

echo [4/7] Cleaning Android build...
cd android
call gradlew.bat clean
cd ..
echo Done.
echo.

echo [5/7] Cleaning Gradle cache...
cd android
if exist .gradle rmdir /s /q .gradle
if exist app\build rmdir /s /q app\build
if exist build rmdir /s /q build
cd ..
echo Done.
echo.

echo [6/7] Rebuilding Android project...
cd android
call gradlew.bat assembleDebug
cd ..
echo Done.
echo.

echo [7/7] Starting Metro bundler with reset cache...
start /B npx metro start --reset-cache --host 0.0.0.0
echo Done.
echo.

echo ========================================
echo Fix complete! Please run:
echo   npx react-native run-android
echo ========================================
pause

