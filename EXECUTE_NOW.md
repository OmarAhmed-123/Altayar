# 🚀 تنفيذ الآن - خطوات سريعة

## ✅ الخطوة 1: إعداد قاعدة البيانات محلياً

```powershell
.\scripts\setup-local-db-complete.ps1
```

هذا سيقوم بـ:
- ✅ إنشاء PostgreSQL في Docker
- ✅ إنشاء ملف `.env`
- ✅ تشغيل migrations

## ✅ الخطوة 2: تشغيل الخادم

```powershell
npm start
```

يجب أن ترى:
```
✅ PostgreSQL connected successfully.
✅ Database: Connected and operational
```

## ✅ الخطوة 3: إعداد قاعدة البيانات على Cloud Run

```powershell
.\scripts\setup-cloud-db.ps1
```

هذا سيقوم بـ:
- ✅ إعداد Cloud SQL connection
- ✅ إضافة Environment Variables
- ✅ ربط قاعدة البيانات بـ Cloud Run

## ✅ الخطوة 4: النشر

```powershell
.\scripts\deploy.ps1
```

## ✅ التحقق

```powershell
# محلياً
curl http://localhost:5000/api/health

# على Cloud Run
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

---

**اتبع هذه الخطوات بالترتيب وستكون كل شيء يعمل!** ✅

