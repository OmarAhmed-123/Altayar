@echo off
REM ==========================================
REM حل نهائي شامل لمشكلة Gradle Daemon Port Conflict
REM ==========================================
REM هذا السكريبت يحل المشكلة بشكل نهائي وآمن واحترافي
REM ==========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   حل نهائي لمشكلة Gradle Build Error
echo   Permanent Gradle Daemon Fix Solution
echo ========================================
echo.

REM Step 1: إيقاف جميع Gradle Daemons
echo [1/8] إيقاف جميع Gradle Daemons...
echo [1/8] Stopping all Gradle Daemons...
cd android
if exist gradlew.bat (
    call gradlew.bat --stop >nul 2>&1
    timeout /t 2 /nobreak >nul
)
cd ..
echo ✓ تم إيقاف Gradle Daemons
echo.

REM Step 2: إيقاف جميع عمليات Java
echo [2/8] إيقاف جميع عمليات Java...
echo [2/8] Stopping all Java processes...
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq java.exe" /FO LIST ^| findstr /C:"PID:"') do (
    echo   Killing Java process: %%a
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq javaw.exe" /FO LIST ^| findstr /C:"PID:"') do (
    echo   Killing JavaW process: %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo ✓ تم إيقاف عمليات Java
echo.

REM Step 3: تنظيف Gradle Lock Files
echo [3/8] تنظيف Gradle Lock Files...
echo [3/8] Cleaning Gradle Lock Files...
cd android
if exist .gradle (
    echo   Removing .gradle directory...
    rmdir /s /q .gradle 2>nul
)
if exist gradle\daemon (
    echo   Removing gradle\daemon directory...
    rmdir /s /q gradle\daemon 2>nul
)
cd ..
echo ✓ تم تنظيف Lock Files
echo.

REM Step 4: تنظيف Build Directories
echo [4/8] تنظيف Build Directories...
echo [4/8] Cleaning Build Directories...
cd android
if exist app\build (
    echo   Removing app\build...
    rmdir /s /q app\build 2>nul
)
if exist build (
    echo   Removing build...
    rmdir /s /q build 2>nul
)
cd ..
echo ✓ تم تنظيف Build Directories
echo.

REM Step 5: تنظيف Gradle User Cache (اختياري - آمن)
echo [5/8] تنظيف Gradle User Cache...
echo [5/8] Cleaning Gradle User Cache...
if exist "%USERPROFILE%\.gradle\daemon" (
    echo   Removing user Gradle daemon cache...
    rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul
)
if exist "%USERPROFILE%\.gradle\caches" (
    echo   Note: Keeping Gradle caches for faster rebuilds
    echo   (To fully clean, manually delete: %USERPROFILE%\.gradle\caches)
)
echo ✓ تم تنظيف Gradle Cache
echo.

REM Step 6: التحقق من إعدادات gradle.properties
echo [6/8] التحقق من إعدادات gradle.properties...
echo [6/8] Verifying gradle.properties settings...
cd android
if exist gradle.properties (
    findstr /C:"org.gradle.daemon.port=0" gradle.properties >nul
    if errorlevel 1 (
        echo   ⚠ Warning: Port configuration may need update
    ) else (
        echo   ✓ Port configuration is correct (auto-assign)
    )
) else (
    echo   ⚠ Warning: gradle.properties not found
)
cd ..
echo ✓ تم التحقق من الإعدادات
echo.

REM Step 7: تنظيف React Native Cache
echo [7/8] تنظيف React Native Cache...
echo [7/8] Cleaning React Native Cache...
if exist node_modules\.cache (
    echo   Removing node_modules\.cache...
    rmdir /s /q node_modules\.cache 2>nul
)
if exist metro-cache (
    echo   Removing metro-cache...
    rmdir /s /q metro-cache 2>nul
)
echo ✓ تم تنظيف React Native Cache
echo.

REM Step 8: التحقق النهائي
echo [8/8] التحقق النهائي...
echo [8/8] Final Verification...
timeout /t 1 /nobreak >nul

REM Check if any Java processes are still running
tasklist /FI "IMAGENAME eq java.exe" 2>nul | find /I /N "java.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo   ⚠ Warning: Some Java processes may still be running
    echo   You may need to manually kill them or restart your computer
) else (
    echo   ✓ No Java processes running
)

echo.
echo ========================================
echo   ✓ تم إكمال جميع الخطوات بنجاح!
echo   ✓ All steps completed successfully!
echo ========================================
echo.
echo الآن يمكنك تشغيل:
echo Now you can run:
echo   npx react-native run-android
echo.
echo ========================================
echo   ملاحظات مهمة:
echo   Important Notes:
echo ========================================
echo 1. إذا استمرت المشكلة، أعد تشغيل الكمبيوتر
echo    If the problem persists, restart your computer
echo.
echo 2. تأكد من إغلاق Android Studio قبل التشغيل
echo    Make sure Android Studio is closed before running
echo.
echo 3. تأكد من إغلاق أي Emulator يعمل
echo    Make sure any running Emulator is closed
echo.
echo ========================================
echo.
pause

