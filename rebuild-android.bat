@echo off
REM Script to rebuild Android app after installing react-native-webview
REM This ensures native modules are properly linked

echo 🔧 Rebuilding Android app for react-native-webview...

REM Step 1: Clean Gradle
echo 📦 Cleaning Gradle...
cd android
call gradlew.bat clean
cd ..

REM Step 2: Remove build folders
echo 🗑️  Removing build folders...
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build
if exist android\.gradle rmdir /s /q android\.gradle

REM Step 3: Clean Metro bundler cache
echo 🧹 Cleaning Metro bundler cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache

REM Step 4: Rebuild
echo 🔨 Rebuilding app...
cd android
call gradlew.bat assembleDebug
cd ..

echo ✅ Rebuild complete! Now run: npx react-native run-android
pause

