@echo off
echo ========================================
echo Fixing Android Dependencies Issue
echo ========================================
echo.

echo [1/6] Stopping all Gradle daemons...
cd android
call gradlew.bat --stop
cd ..
echo Done.
echo.

echo [2/6] Killing Java processes (if any)...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM javaw.exe 2>nul
echo Done.
echo.

echo [3/6] Cleaning Gradle cache...
cd android
if exist .gradle (
    echo Removing .gradle directory...
    rmdir /s /q .gradle 2>nul
)
cd ..
echo Done.
echo.

echo [4/6] Cleaning build directories...
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

echo [5/6] Cleaning React Native cache...
if exist node_modules\.cache (
    echo Removing node_modules\.cache...
    rmdir /s /q node_modules\.cache 2>nul
)
echo Done.
echo.

echo [6/6] Invalidating Gradle cache...
cd android
call gradlew.bat clean --refresh-dependencies
cd ..
echo Done.
echo.

echo ========================================
echo Fix completed!
echo ========================================
echo.
echo Changes applied:
echo   - android.enableJetifier=true (converts com.android.support to androidx)
echo   - Dependency resolution strategy (replaces old support libraries)
echo   - Added maven repositories
echo.
echo Now try running:
echo   npx react-native run-android
echo.
pause

