@echo off
echo ========================================
echo   إعداد PostgreSQL في Docker
echo ========================================
echo.

REM التحقق من Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker غير مثبت أو غير مشغل
    echo 💡 قم بتثبيت Docker Desktop من: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker موجود
echo.

REM التحقق من وجود container
docker ps -a --filter "name=altayar-postgres" --format "{{.Names}}" | findstr /C:"altayar-postgres" >nul
if errorlevel 1 (
    echo 📦 إنشاء PostgreSQL container جديد...
    docker run --name altayar-postgres ^
        -e POSTGRES_PASSWORD=StrongPass123 ^
        -e POSTGRES_DB=tourist_app_db ^
        -p 5432:5432 ^
        -d postgres:15-alpine
    
    if errorlevel 1 (
        echo ❌ فشل إنشاء container
        pause
        exit /b 1
    )
    
    echo ✅ تم إنشاء container بنجاح
    echo ⏳ انتظر 10 ثواني حتى يبدأ PostgreSQL...
    timeout /t 10 /nobreak >nul
) else (
    echo 📦 Container موجود بالفعل
    echo 🔄 بدء تشغيل container...
    docker start altayar-postgres >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Container يعمل بالفعل
    ) else (
        echo ✅ تم بدء تشغيل container
        echo ⏳ انتظر 5 ثواني حتى يبدأ PostgreSQL...
        timeout /t 5 /nobreak >nul
    )
)

echo.
echo ========================================
echo   التحقق من PostgreSQL
echo ========================================
echo.

REM التحقق من أن PostgreSQL يعمل
docker exec altayar-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL لا يزال يبدأ...
    echo 💡 انتظر 10-15 ثانية ثم جرب مرة أخرى
) else (
    echo ✅ PostgreSQL يعمل بنجاح!
)

echo.
echo ========================================
echo   معلومات الاتصال
echo ========================================
echo.
echo Host: localhost
echo Port: 5432
echo User: postgres
echo Password: StrongPass123
echo Database: tourist_app_db
echo.

REM إنشاء ملف .env إذا لم يكن موجوداً
if not exist .env (
    echo 📝 إنشاء ملف .env...
    (
        echo DB_HOST=127.0.0.1
        echo DB_PORT=5432
        echo DB_USER=postgres
        echo DB_PASSWORD=StrongPass123
        echo DB_NAME=tourist_app_db
        echo NODE_ENV=development
        echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
        echo SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure
        echo PORT=5000
        echo FRONTEND_URL=http://localhost:3000
        echo BACKEND_URL=http://localhost:5000
    ) > .env
    echo ✅ تم إنشاء ملف .env
) else (
    echo ✅ ملف .env موجود
)

echo.
echo ========================================
echo   الخطوات التالية
echo ========================================
echo.
echo 1. ✅ PostgreSQL يعمل في Docker
echo 2. 📝 ملف .env جاهز
echo 3. 🚀 شغّل: npm start
echo 4. 📊 شغّل migrations: npm run migrate:latest
echo.
echo ========================================
pause

