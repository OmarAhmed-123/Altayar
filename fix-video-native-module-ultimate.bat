@echo off
echo ========================================
echo ULTIMATE FIX for react-native-video
echo ========================================
echo.

echo [1/6] Cleaning node_modules cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist node_modules\react-native-video\.cache rmdir /s /q node_modules\react-native-video\.cache

echo [2/6] Reinstalling react-native-video...
call npm uninstall react-native-video
call npm install react-native-video@^5.2.1 --save --legacy-peer-deps

echo [3/6] Cleaning Android build...
cd android
call gradlew.bat clean
if exist app\build rmdir /s /q app\build
if exist build rmdir /s /q build
cd ..

echo [4/6] Cleaning Metro bundler cache...
call npx react-native start --reset-cache --host 0.0.0.0 &
timeout /t 3 /nobreak >nul
taskkill /F /IM node.exe /T >nul 2>&1

echo [5/6] Rebuilding Android project...
cd android
call gradlew.bat clean
call gradlew.bat assembleDebug
cd ..

echo [6/6] Done! Now run: npx react-native run-android
echo.
echo ========================================
echo Fix complete!
echo ========================================
pause

