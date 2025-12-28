@echo off
echo ========================================
echo   حل مشكلة ECONNREFUSED النهائي
echo ========================================
echo.

REM الخطوة 1: التحقق من Docker
echo [1/4] التحقق من Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker غير مثبت أو غير مشغل
    echo 💡 تأكد من تشغيل Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker موجود
echo.

REM الخطوة 2: تشغيل PostgreSQL Container
echo [2/4] تشغيل PostgreSQL Container...
docker ps -a --filter "name=altayar-postgres" --format "{{.Names}}" | findstr /C:"altayar-postgres" >nul
if errorlevel 1 (
    echo 📦 إنشاء container جديد...
    docker run --name altayar-postgres -e POSTGRES_PASSWORD=StrongPass123 -e POSTGRES_DB=tourist_app_db -p 5432:5432 -d postgres:15-alpine
    if errorlevel 1 (
        echo ❌ فشل إنشاء container
        pause
        exit /b 1
    )
    echo ✅ تم إنشاء container
    echo ⏳ انتظر 15 ثانية حتى يبدأ PostgreSQL...
    timeout /t 15 /nobreak >nul
) else (
    echo 📦 Container موجود
    docker start altayar-postgres >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  Container يعمل بالفعل
    ) else (
        echo ✅ تم بدء تشغيل container
        echo ⏳ انتظر 10 ثواني...
        timeout /t 10 /nobreak >nul
    )
)
echo.

REM الخطوة 3: التحقق من PostgreSQL
echo [3/4] التحقق من PostgreSQL...
docker exec altayar-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo ⚠️  PostgreSQL لا يزال يبدأ...
    echo 💡 انتظر 10 ثواني أخرى
    timeout /t 10 /nobreak >nul
    docker exec altayar-postgres pg_isready -U postgres >nul 2>&1
    if errorlevel 1 (
        echo ❌ PostgreSQL لا يزال غير جاهز
        echo 💡 جرب: docker logs altayar-postgres
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL جاهز
echo.

REM الخطوة 4: التحقق من .env
echo [4/4] التحقق من .env...
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
    ) > .env
    echo ✅ تم إنشاء ملف .env
) else (
    echo ✅ ملف .env موجود
)
echo.

echo ========================================
echo   ✅ كل شيء جاهز!
echo ========================================
echo.
echo الخطوات التالية:
echo 1. شغّل: npm start
echo 2. في terminal آخر: npm run migrate:latest
echo 3. جرب register في التطبيق
echo.
echo ========================================
pause

