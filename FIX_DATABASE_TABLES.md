# 🔧 إصلاح مشكلة الجداول غير الموجودة

## المشكلة

```
relation "users" does not exist
```

هذا يعني أن قاعدة البيانات متصلة لكن الجداول غير موجودة (migrations لم يتم تشغيلها).

## ✅ الحل السريع

### الطريقة 1: استخدام السكريبت (موصى به)

```powershell
.\scripts\run-migrations.ps1
```

### الطريقة 2: يدوياً

```powershell
npm run migrate:latest
```

## ✅ التحقق من النجاح

بعد تشغيل migrations، أعد تشغيل الخادم:

```powershell
npm start
```

يجب أن ترى:
```
✅ PostgreSQL connected successfully.
✅ [DB] Migrations completed successfully
```

**بدون أخطاء "relation does not exist"**

## 🔍 إذا استمرت المشكلة

### 1. تحقق من أن قاعدة البيانات موجودة:

```powershell
# إذا كنت تستخدم Docker
docker exec -it altayar-postgres psql -U postgres -c "\l"
```

يجب أن ترى `tourist_app_db` في القائمة.

### 2. تحقق من ملف .env:

```powershell
cat .env
```

يجب أن يحتوي على:
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=tourist_app_db
```

### 3. تحقق من migrations:

```powershell
# عرض migrations المتاحة
dir db\migrations

# تشغيل migrations يدوياً
npm run migrate:latest
```

### 4. إذا فشلت migrations:

```powershell
# إعادة تعيين قاعدة البيانات (يحذف جميع البيانات!)
npm run db:reset

# أو يدوياً
npm run migrate:rollback
npm run migrate:latest
```

## 📋 Checklist

- [ ] قاعدة البيانات متصلة
- [ ] ملف `.env` موجود وصحيح
- [ ] Migrations تم تشغيلها
- [ ] لا توجد أخطاء "relation does not exist"

---

**بعد تطبيق الحل، أعد تشغيل الخادم وستكون كل شيء يعمل!** ✅

