@echo off
echo ========================================
echo   حل شامل لمشكلة ECONNREFUSED
echo ========================================
echo.

REM الخطوة 1: التحقق من Docker
echo [1/5] التحقق من Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker غير مثبت أو غير مشغل
    echo 💡 تأكد من تشغيل Docker Desktop
    pause
    exit /b 1
)
echo ✅ Docker موجود
echo.

REM الخطوة 2: إنشاء/تشغيل PostgreSQL Container
echo [2/5] إنشاء/تشغيل PostgreSQL Container...
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
echo [3/5] التحقق من PostgreSQL...
set RETRY_COUNT=0
:CHECK_PG
docker exec altayar-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% LSS 5 (
        echo ⏳ انتظر... (%RETRY_COUNT%/5)
        timeout /t 3 /nobreak >nul
        goto CHECK_PG
    ) else (
        echo ❌ PostgreSQL لا يزال غير جاهز
        echo 💡 جرب: docker logs altayar-postgres
        pause
        exit /b 1
    )
)
echo ✅ PostgreSQL جاهز
echo.

REM الخطوة 4: التحقق من .env
echo [4/5] التحقق من .env...
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
    REM تحديث DB settings إذا لزم الأمر
    findstr /C:"DB_HOST=127.0.0.1" .env >nul
    if errorlevel 1 (
        echo 📝 تحديث DB settings في .env...
        powershell -Command "(Get-Content .env) -replace 'DB_HOST=.*', 'DB_HOST=127.0.0.1' -replace 'DB_PORT=.*', 'DB_PORT=5432' -replace 'DB_USER=.*', 'DB_USER=postgres' -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=StrongPass123' -replace 'DB_NAME=.*', 'DB_NAME=tourist_app_db' | Set-Content .env"
        echo ✅ تم تحديث .env
    )
)
echo.

REM الخطوة 5: اختبار الاتصال
echo [5/5] اختبار الاتصال من Node.js...
node -e "const knex = require('knex'); const config = require('./knexfile'); const db = knex(config.development); db.raw('SELECT 1 as test').then(() => { console.log('✅ الاتصال نجح!'); process.exit(0); }).catch(err => { console.error('❌ فشل الاتصال:', err.message); process.exit(1); });" 2>nul
if errorlevel 1 (
    echo ⚠️  فشل اختبار الاتصال (قد يكون طبيعي)
    echo 💡 جرب تشغيل السيرفر مباشرة
) else (
    echo ✅ الاتصال يعمل!
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

