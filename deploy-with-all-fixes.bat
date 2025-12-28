@echo off
REM ========================================
REM نشر شامل مع جميع الإصلاحات
REM ========================================

echo.
echo ========================================
echo نشر شامل مع جميع الإصلاحات
echo ========================================
echo.

echo [1/1] تشغيل السكريبت PowerShell...
powershell -ExecutionPolicy Bypass -File "%~dp0deploy-with-all-fixes.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ فشل النشر
    pause
    exit /b 1
)

echo.
echo ✅ تم النشر بنجاح!
pause

