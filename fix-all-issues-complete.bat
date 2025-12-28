@echo off
REM ========================================
REM حل شامل لجميع المشاكل - Fix All Issues Complete
REM ========================================

echo.
echo ========================================
echo حل شامل لجميع المشاكل
echo ========================================
echo.

echo [1/10] تشغيل السكريبت PowerShell...
powershell -ExecutionPolicy Bypass -File "%~dp0fix-all-issues-complete.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ فشل تنفيذ السكريبت
    pause
    exit /b 1
)

echo.
echo ✅ تم إكمال جميع الخطوات بنجاح!
pause

