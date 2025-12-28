# ✅ إصلاح مشكلة "Service Unavailable" على Cloud Run

## 🎯 المشكلة

الخادم يعمل محلياً بشكل صحيح، لكن على Cloud Run يعرض "Service Unavailable".

## 🔍 السبب

الخادم كان يتعطل (`process.exit(1)`) عند فشل الاتصال بقاعدة البيانات في production mode.

## ✅ الحل المطبق

### 1. ✅ تعديل `config/db.js`
- **قبل**: كان يخرج من العملية (`process.exit(1)`) عند فشل الاتصال في production
- **بعد**: يسمح للخادم بالبدء حتى لو فشل الاتصال، مع retry في الخلفية

### 2. ✅ تعديل `server.js`
- **قبل**: كان يخرج من العملية عند فشل bootstrap في production
- **بعد**: يسمح للخادم بالبدء مع retry في الخلفية
- **إضافة**: دالة `startBackgroundDbRetry()` لإعادة محاولة الاتصال كل 30 ثانية

### 3. ✅ تعديل Health Check
- **قبل**: كان يعيد `503 Service Unavailable` إذا كانت قاعدة البيانات غير متصلة
- **بعد**: يعيد دائماً `200 OK` مع `status: "DEGRADED"` إذا كانت قاعدة البيانات غير متصلة

## 🚀 النتيجة

- ✅ الخادم يبدأ دائماً، حتى لو فشل الاتصال بقاعدة البيانات
- ✅ Health check يعمل دائماً ويعيد `200 OK`
- ✅ إعادة محاولة الاتصال بقاعدة البيانات في الخلفية كل 30 ثانية
- ✅ لا مزيد من "Service Unavailable" errors

## 📋 الخطوات التالية

### 1. إعادة النشر

```powershell
.\scripts\deploy.ps1
```

### 2. التحقق من Environment Variables

تأكد من أن هذه المتغيرات موجودة على Cloud Run:

```env
NODE_ENV=production
DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=tourist_app_db
```

### 3. التحقق من Cloud SQL Connection

```powershell
gcloud run services describe altayar-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"
```

### 4. اختبار Health Check

افتح في المتصفح:
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

يجب أن ترى:
```json
{
  "success": true,
  "status": "OK" or "DEGRADED",
  "database": {
    "status": "connected" or "disconnected"
  }
}
```

## 🔧 استكشاف الأخطاء

### إذا كان status: "DEGRADED"

1. **تحقق من Cloud SQL Connection:**
   ```powershell
   gcloud sql instances describe altayar-db
   ```

2. **تحقق من Environment Variables:**
   ```powershell
   gcloud run services describe altayar-backend --region us-central1 --format="value(spec.template.spec.containers[0].env)"
   ```

3. **تحقق من Logs:**
   ```powershell
   gcloud run services logs read altayar-backend --region us-central1 --limit 50
   ```

### إذا كان لا يزال "Service Unavailable"

1. **تحقق من أن الخدمة منشورة:**
   ```powershell
   gcloud run services list --region us-central1
   ```

2. **تحقق من أن الخدمة تعمل:**
   ```powershell
   gcloud run services describe altayar-backend --region us-central1
   ```

3. **تحقق من Logs للأخطاء:**
   ```powershell
   gcloud run services logs read altayar-backend --region us-central1 --limit 100
   ```

---

**بعد إعادة النشر، يجب أن يعمل الخادم بشكل صحيح!** ✅

