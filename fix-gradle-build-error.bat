@echo off
echo ========================================
echo Fixing Gradle Build Error
echo ========================================
echo.

echo [1/5] Stopping all Gradle daemons...
cd android
call gradlew.bat --stop
cd ..
echo Done.
echo.

echo [2/5] Killing Java processes (if any)...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM javaw.exe 2>nul
echo Done.
echo.

echo [3/5] Cleaning Gradle cache...
cd android
if exist .gradle (
    echo Removing .gradle directory...
    rmdir /s /q .gradle 2>nul
)
cd ..
echo Done.
echo.

echo [4/5] Cleaning build directories...
cd android
if exist app\build (
    echo Removing app\build directory...
    rmdir /s /q app\build 2>nul
)
if exist build (
    echo Removing build directory...
    rmdir /s /q build 2>nul
)
cd ..
echo Done.
echo.

echo [5/5] Cleaning React Native cache...
if exist node_modules\.cache (
    echo Removing node_modules\.cache...
    rmdir /s /q node_modules\.cache 2>nul
)
echo Done.
echo.

echo ========================================
echo Fix completed!
echo ========================================
echo.
echo Now try running:
echo   npx react-native run-android
echo.
pause

