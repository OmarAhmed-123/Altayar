@echo off
echo ========================================
echo   اختبار اتصال قاعدة البيانات
echo ========================================
echo.

REM التحقق من Docker Container
echo [1/3] التحقق من Docker Container...
docker ps --filter "name=altayar-postgres" --format "{{.Names}} - {{.Status}}" | findstr /C:"altayar-postgres" >nul
if errorlevel 1 (
    echo ❌ Container غير موجود
    echo 💡 شغّل: FIX_ECONNREFUSED_FINAL.bat
    pause
    exit /b 1
)
echo ✅ Container موجود
echo.

REM التحقق من PostgreSQL
echo [2/3] التحقق من PostgreSQL...
docker exec altayar-postgres pg_isready -U postgres >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL غير جاهز
    echo 💡 انتظر 10 ثواني ثم جرب مرة أخرى
    pause
    exit /b 1
)
echo ✅ PostgreSQL جاهز
echo.

REM اختبار الاتصال من Node.js
echo [3/3] اختبار الاتصال من Node.js...
node -e "const knex = require('knex'); const config = require('./knexfile'); const db = knex(config.development); db.raw('SELECT 1 as test').then(() => { console.log('✅ الاتصال نجح!'); process.exit(0); }).catch(err => { console.error('❌ فشل الاتصال:', err.message); process.exit(1); });"
if errorlevel 1 (
    echo ❌ فشل الاتصال من Node.js
    echo 💡 تحقق من .env
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ كل شيء يعمل!
echo ========================================
echo.
pause

