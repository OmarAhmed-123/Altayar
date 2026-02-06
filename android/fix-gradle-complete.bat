@echo off
REM ==========================================
REM حل شامل لمشكلة Gradle في مجلد android
REM ==========================================

echo.
echo ========================================
echo   Gradle Fix Script - Android Folder
echo ========================================
echo.

echo [1/4] Stopping Gradle daemons...
call gradlew.bat --stop
timeout /t 2 /nobreak >nul
echo ✓ Done
echo.

echo [2/4] Cleaning Gradle cache...
if exist .gradle (
    rmdir /s /q .gradle 2>nul
)
echo ✓ Done
echo.

echo [3/4] Cleaning build directories...
if exist app\build (
    rmdir /s /q app\build 2>nul
)
if exist build (
    rmdir /s /q build 2>nul
)
echo ✓ Done
echo.

echo [4/4] Running clean task...
call gradlew.bat clean --no-daemon
echo ✓ Done
echo.

echo ========================================
echo   Fix completed!
echo ========================================
echo.
pause

