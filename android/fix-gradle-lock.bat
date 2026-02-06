@echo off
echo ========================================
echo Fixing Gradle Lock Files
echo ========================================
echo.

echo Stopping Gradle daemon...
call gradlew.bat --stop
echo Done.
echo.

echo Waiting 5 seconds for processes to close...
timeout /t 5 /nobreak >nul
echo Done.
echo.

echo Removing lock files...
if exist .gradle\*.lock (
    del /f /q .gradle\*.lock 2>nul
    echo Removed .gradle\*.lock
)

if exist .gradle\daemon (
    echo Removing daemon directory...
    rmdir /s /q .gradle\daemon 2>nul
)

if exist .gradle\buildOutputCleanup (
    echo Removing buildOutputCleanup directory...
    rmdir /s /q .gradle\buildOutputCleanup 2>nul
)
echo Done.
echo.

echo Killing any remaining Java processes...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM javaw.exe 2>nul
echo Done.
echo.

echo ========================================
echo Lock files removed!
echo ========================================
echo.
echo Now try running:
echo   npx react-native run-android
echo.
pause

