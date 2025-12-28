# 🔧 إصلاح سريع لمشكلة قاعدة البيانات

## المشكلة
```
Connection to localhost:5432 refused
Error connecting to PostgreSQL: connect ECONNREFUSED 127.0.0.1:5432
```

## ✅ الحل السريع (3 خيارات)

### الخيار 1: العمل بدون قاعدة بيانات (للتطوير فقط)

الخادم الآن يمكنه العمل بدون قاعدة بيانات في development mode:

```powershell
npm start
```

**ملاحظة:** 
- ✅ الخادم سيعمل
- ⚠️ ميزات قاعدة البيانات لن تعمل
- ✅ مفيد لاختبار API structure
- ✅ على Cloud Run، قاعدة البيانات ستكون متاحة تلقائياً

### الخيار 2: تثبيت PostgreSQL محلياً

```powershell
# 1. تشغيل سكريبت المساعدة
.\scripts\setup-local-db.ps1

# 2. إنشاء ملف .env في مجلد backend
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=tourist_app_db
NODE_ENV=development

# 3. إنشاء قاعدة البيانات
createdb -U postgres tourist_app_db

# 4. تشغيل migrations
npm run migrate:latest

# 5. إعادة تشغيل الخادم
npm start
```

### الخيار 3: استخدام Docker (أسهل)

```powershell
# تشغيل PostgreSQL في Docker
docker run --name altayar-postgres `
    -e POSTGRES_PASSWORD=StrongPass123 `
    -e POSTGRES_DB=tourist_app_db `
    -p 5432:5432 `
    -d postgres

# إنشاء ملف .env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db
NODE_ENV=development

# تشغيل migrations
npm run migrate:latest

# إعادة تشغيل الخادم
npm start
```

## ✅ التحقق من الحل

بعد إعادة تشغيل الخادم، يجب أن ترى:

```
✅ Server running in development mode
✅ Database: Connected and operational
```

أو إذا لم تكن قاعدة البيانات متاحة:

```
⚠️  Database: Not connected (server running without DB)
💡 To connect database: ...
```

## 📚 للمزيد من التفاصيل

راجع `DATABASE_SETUP.md` للدليل الكامل.

---

**الخادم الآن يعمل حتى بدون قاعدة البيانات في development mode!** ✅

