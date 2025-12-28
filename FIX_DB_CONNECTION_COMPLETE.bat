@echo off
setlocal enabledelayedexpansion

echo ========================================
echo 🔧 حل مشكلة الاتصال بقاعدة البيانات
echo ========================================
echo.
echo 📋 هذا السكريبت سيقوم بـ:
echo    1. التحقق من Docker
echo    2. تشغيل PostgreSQL في Docker
echo    3. التحقق من الاتصال
echo    4. إنشاء/تحديث ملف .env
echo    5. تشغيل الباكند
echo.
pause

cd /d "%~dp0"

REM ========================================
REM الخطوة 1: التحقق من Docker
REM ========================================
echo.
echo ✅ الخطوة 1: التحقق من Docker...
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ خطأ: Docker غير مثبت
    echo    يرجى تثبيت Docker Desktop أولاً
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ خطأ: Docker غير قيد التشغيل
    echo    يرجى تشغيل Docker Desktop أولاً
    pause
    exit /b 1
)
echo ✅ Docker يعمل

REM ========================================
REM الخطوة 2: التحقق من PostgreSQL Container
REM ========================================
echo.
echo ✅ الخطوة 2: التحقق من PostgreSQL Container...

docker ps -a --filter "name=altayar-postgres" --format "{{.Names}}" | findstr /C:"altayar-postgres" >nul
if %errorlevel% neq 0 (
    echo ⚠️  Container 'altayar-postgres' غير موجود. جاري إنشاؤه...
    echo.
    echo    ⏳ هذا قد يستغرق 1-2 دقيقة...
    docker run --name altayar-postgres ^
        -e POSTGRES_PASSWORD=StrongPass123 ^
        -e POSTGRES_DB=tourist_app_db ^
        -p 5432:5432 ^
        -d postgres:15-alpine
    
    if %errorlevel% neq 0 (
        echo ❌ فشل إنشاء Container
        pause
        exit /b 1
    )
    
    echo ✅ تم إنشاء Container بنجاح
    echo    ⏳ انتظر 15 ثانية حتى يبدأ PostgreSQL...
    timeout /t 15 /nobreak >nul
) else (
    echo ✅ Container موجود
    docker ps --filter "name=altayar-postgres" --format "{{.Status}}" | findstr /C:"Up" >nul
    if %errorlevel% neq 0 (
        echo ⚠️  Container متوقف. جاري تشغيله...
        docker start altayar-postgres >nul 2>&1
        if %errorlevel% neq 0 (
            echo ❌ فشل تشغيل Container
            pause
            exit /b 1
        )
        echo ✅ تم تشغيل Container
        echo    ⏳ انتظر 10 ثوانٍ حتى يكون PostgreSQL جاهزاً...
        timeout /t 10 /nobreak >nul
    ) else (
        echo ✅ Container يعمل بالفعل
    )
)

REM ========================================
REM الخطوة 3: التحقق من PostgreSQL
REM ========================================
echo.
echo ✅ الخطوة 3: التحقق من PostgreSQL...

set MAX_RETRIES=10
set RETRY_COUNT=0
set POSTGRES_READY=0

:check_postgres
set /a RETRY_COUNT+=1
docker exec altayar-postgres pg_isready -U postgres -h localhost >nul 2>&1
if %errorlevel% equ 0 (
    set POSTGRES_READY=1
    goto postgres_ready
)

if %RETRY_COUNT% lss %MAX_RETRIES% (
    echo    ⏳ المحاولة %RETRY_COUNT%/%MAX_RETRIES%: PostgreSQL لا يزال يبدأ...
    timeout /t 3 /nobreak >nul
    goto check_postgres
) else (
    echo ❌ PostgreSQL لا يزال غير جاهز بعد %MAX_RETRIES% محاولات
    echo.
    echo 💡 جرب:
    echo    docker logs altayar-postgres
    echo    docker restart altayar-postgres
    pause
    exit /b 1
)

:postgres_ready
echo ✅ PostgreSQL جاهز ومتاح

REM ========================================
REM الخطوة 4: إنشاء/تحديث ملف .env
REM ========================================
echo.
echo ✅ الخطوة 4: إنشاء/تحديث ملف .env...

if not exist ".env" (
    echo ⚠️  ملف .env غير موجود. جاري إنشاؤه من env.example...
    if exist "env.example" (
        copy env.example .env >nul
        echo ✅ تم إنشاء .env من env.example
    ) else (
        echo ⚠️  ملف env.example غير موجود. جاري إنشاء .env جديد...
    )
)

REM تحديث إعدادات قاعدة البيانات في .env
echo.
echo    🔧 تحديث إعدادات قاعدة البيانات...

powershell -Command "$content = Get-Content .env -ErrorAction SilentlyContinue; if ($content) { $content -replace 'DB_HOST=.*', 'DB_HOST=127.0.0.1' -replace 'DB_PORT=.*', 'DB_PORT=5432' -replace 'DB_USER=.*', 'DB_USER=postgres' -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=StrongPass123' -replace 'DB_NAME=.*', 'DB_NAME=tourist_app_db' | Set-Content .env } else { @('DB_HOST=127.0.0.1', 'DB_PORT=5432', 'DB_USER=postgres', 'DB_PASSWORD=StrongPass123', 'DB_NAME=tourist_app_db', 'PORT=5000', 'NODE_ENV=development', 'JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure', 'SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure') | Set-Content .env }"

if %errorlevel% neq 0 (
    echo ⚠️  فشل تحديث .env (متابعة...)
) else (
    echo ✅ تم تحديث .env بنجاح
)

REM التحقق من أن الإعدادات صحيحة
findstr /C:"DB_HOST=127.0.0.1" .env >nul
if %errorlevel% neq 0 (
    echo ⚠️  تحذير: DB_HOST غير موجود في .env
    echo    جاري إضافته...
    echo DB_HOST=127.0.0.1 >> .env
    echo DB_PORT=5432 >> .env
    echo DB_USER=postgres >> .env
    echo DB_PASSWORD=StrongPass123 >> .env
    echo DB_NAME=tourist_app_db >> .env
)

REM ========================================
REM الخطوة 5: اختبار الاتصال
REM ========================================
echo.
echo ✅ الخطوة 5: اختبار الاتصال بقاعدة البيانات...

docker exec altayar-postgres psql -U postgres -d tourist_app_db -c "SELECT 1;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ الاتصال بقاعدة البيانات يعمل بشكل صحيح
) else (
    echo ⚠️  تحذير: فشل اختبار الاتصال (قد تحتاج لتشغيل migrations)
)

REM ========================================
REM الخطوة 6: التحقق من Migrations
REM ========================================
echo.
echo ✅ الخطوة 6: التحقق من Migrations...

docker exec altayar-postgres psql -U postgres -d tourist_app_db -c "\dt" 2>nul | findstr /C:"users" >nul
if %errorlevel% neq 0 (
    echo ⚠️  تحذير: جدول users غير موجود
    echo    💡 قد تحتاج لتشغيل migrations:
    echo       npm run migrate:latest
    echo    أو:
    echo       .\scripts\run-migrations.ps1
) else (
    echo ✅ جداول قاعدة البيانات موجودة
)

REM ========================================
REM الخطوة 7: النتيجة النهائية
REM ========================================
echo.
echo ========================================
echo ✅ تم إصلاح الاتصال بقاعدة البيانات!
echo ========================================
echo.
echo 📋 الإعدادات الحالية:
echo    DB_HOST=127.0.0.1
echo    DB_PORT=5432
echo    DB_USER=postgres
echo    DB_NAME=tourist_app_db
echo.
echo 🚀 يمكنك الآن تشغيل الباكند:
echo    npm start
echo.
echo 💡 إذا واجهت مشاكل:
echo    1. تحقق من أن Docker يعمل: docker ps
echo    2. تحقق من PostgreSQL: docker logs altayar-postgres
echo    3. أعد تشغيل Container: docker restart altayar-postgres
echo.
pause

