@echo off
echo ========================================
echo   تشغيل السيرفر
echo ========================================
echo.

REM التحقق من Docker
echo [1/3] التحقق من PostgreSQL...
docker ps --filter "name=altayar-postgres" --format "{{.Names}}" | findstr /C:"altayar-postgres" >nul
if errorlevel 1 (
    echo ❌ PostgreSQL container غير موجود
    echo 💡 شغّل: FIX_ECONNREFUSED_FINAL.bat
    pause
    exit /b 1
)

docker ps --filter "name=altayar-postgres" --format "{{.Status}}" | findstr /C:"Up" >nul
if errorlevel 1 (
    echo 🔄 بدء تشغيل container...
    docker start altayar-postgres
    timeout /t 10 /nobreak >nul
)

echo ✅ PostgreSQL جاهز
echo.

REM التحقق من .env
echo [2/3] التحقق من .env...
if not exist .env (
    echo ❌ ملف .env غير موجود
    echo 💡 شغّل: FIX_ECONNREFUSED_FINAL.bat
    pause
    exit /b 1
)
echo ✅ ملف .env موجود
echo.

REM تشغيل السيرفر
echo [3/3] تشغيل السيرفر...
echo.
npm start

