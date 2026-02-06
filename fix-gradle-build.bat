@echo off
chcp 65001 >nul
echo ========================================
echo 🔧 إصلاح مشاكل Gradle Build
echo ========================================
echo.

echo [1/6] إيقاف جميع عمليات Gradle daemon...
cd android
call gradlew.bat --stop 2>nul
timeout /t 2 /nobreak >nul
echo ✅ تم إيقاف Gradle daemons
echo.

echo [2/6] إيقاف عمليات Java المعلقة...
taskkill /F /IM java.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ تم إيقاف عمليات Java
) else (
    echo ℹ️  لا توجد عمليات Java قيد التشغيل
)
timeout /t 2 /nobreak >nul
echo.

echo [3/6] تنظيف مجلدات البناء...
if exist "build" (
    rmdir /s /q "build" 2>nul
    echo ✅ تم حذف build
)
if exist "app\build" (
    rmdir /s /q "app\build" 2>nul
    echo ✅ تم حذف app\build
)
if exist ".gradle" (
    rmdir /s /q ".gradle" 2>nul
    echo ✅ تم حذف .gradle
)
echo.

echo [4/6] تنظيف Gradle cache (اختياري - قد يستغرق وقتاً)...
set /p CLEAN_CACHE="هل تريد تنظيف Gradle cache؟ (Y/N): "
if /i "%CLEAN_CACHE%"=="Y" (
    if exist "%USERPROFILE%\.gradle\caches" (
        rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
        echo ✅ تم تنظيف Gradle cache
    )
)
echo.

echo [5/6] التحقق من إعدادات Java...
java -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ خطأ: Java غير مثبت أو غير موجود في PATH
    pause
    exit /b 1
) else (
    echo ✅ Java مثبت بشكل صحيح
    java -version
)
echo.

echo [6/6] التحقق من Gradle...
call gradlew.bat --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  تحذير: قد تكون هناك مشكلة في Gradle
) else (
    echo ✅ Gradle يعمل بشكل صحيح
)
echo.

cd ..
echo ========================================
echo ✅ تم الانتهاء من الإصلاح!
echo ========================================
echo.
echo يمكنك الآن محاولة البناء مرة أخرى:
echo   npx react-native run-android
echo.
echo إذا استمرت المشكلة، جرب:
echo   1. إعادة تشغيل الكمبيوتر
echo   2. تعطيل Gradle daemon في gradle.properties
echo   3. التحقق من عدم وجود Android Studio مفتوح
echo.
pause

