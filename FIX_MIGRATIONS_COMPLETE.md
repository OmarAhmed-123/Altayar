# ✅ إصلاح مشاكل Migrations - الحل الكامل

## 🎯 المشاكل التي تم حلها

### 1. ✅ خطأ Syntax: `hasUsersTable` already declared
**المشكلة**: المتغير `hasUsersTable` تم تعريفه مرتين في `config/db.js`

**الحل**: إزالة التكرار واستخدام المتغير الموجود

### 2. ✅ Migration يحاول تعديل جدول غير موجود
**المشكلة**: `20250115000000_add_image_url_to_memberships.js` يحاول تعديل جدول `memberships` قبل إنشائه

**الحل**: إضافة تحقق من وجود الجدول قبل التعديل

## 🚀 الحل السريع

### الطريقة 1: استخدام السكريبت (موصى به)

```powershell
.\scripts\fix-migrations.ps1
```

### الطريقة 2: يدوياً

```powershell
# 1. إعادة تعيين migrations (إذا لزم الأمر)
npm run migrate:rollback

# 2. تشغيل migrations مرة أخرى
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

**بدون أخطاء!**

## 📋 إذا استمرت المشاكل

### 1. تحقق من ترتيب Migrations:

```powershell
dir db\migrations | Sort-Object Name
```

يجب أن تكون migrations التي تنشئ الجداول قبل migrations التي تعدلها.

### 2. إعادة تعيين قاعدة البيانات (إذا لزم الأمر):

```powershell
# تحذير: هذا سيحذف جميع البيانات!
npm run db:reset
```

### 3. تشغيل migrations يدوياً:

```powershell
# Rollback جميع migrations
npm run migrate:rollback

# تشغيل migrations من جديد
npm run migrate:latest
```

## 🎯 النتيجة

بعد تطبيق الحلول:
- ✅ لا توجد أخطاء syntax
- ✅ Migrations تعمل بشكل صحيح
- ✅ الجداول يتم إنشاؤها بالترتيب الصحيح
- ✅ الخادم يعمل بدون أخطاء

---

**اتبع الخطوات أعلاه وستكون المشكلة محلولة!** ✅

