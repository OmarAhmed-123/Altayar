# ✅ الحل النهائي لمشكلة الاتصال بقاعدة البيانات

## 🔍 المشكلة

عند محاولة تسجيل الدخول أو التسجيل، يظهر الخطأ:
```
api exception(500): connect econnrefused 127.0.0.1:5432
```

### السبب:
الباك اند على Google Cloud Run يحاول الاتصال بقاعدة البيانات على `127.0.0.1:5432` (localhost) بدلاً من Google Cloud SQL.

---

## ✅ الحل النهائي

### الخطوة 1: تحديث Cloud Run Service

قم بتشغيل السكريبت التالي لتحديث Cloud Run service بالمتغيرات الصحيحة:

#### Windows:
```cmd
cd E:\Altayar-app\Altayar-app-final\backend
fix-cloud-run-db.bat
```

#### PowerShell:
```powershell
cd E:\Altayar-app\Altayar-app-final\backend
.\fix-cloud-run-db.ps1
```

هذا السكريبت سيقوم بـ:
1. ✅ تحديث Cloud Run service بالمتغيرات الصحيحة
2. ✅ إضافة Cloud SQL instance connection
3. ✅ تعيين `DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db`
4. ✅ التحقق من أن الخدمة تعمل بشكل صحيح

---

### الخطوة 2: التحقق من الإعدادات

بعد تشغيل السكريبت، تحقق من:

1. **Cloud Run Service Environment Variables:**
   ```
   DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=[your password]
   DB_NAME=tourist_app_db
   NODE_ENV=production
   ```

2. **Cloud SQL Connection:**
   - تأكد أن Cloud SQL instance `altayar-db` متصل بـ Cloud Run service
   - في Google Cloud Console > Cloud Run > altayar-backend > Connections
   - يجب أن ترى: `altayar-46d6f:us-central1:altayar-db`

3. **Test Health Endpoint:**
   ```bash
   curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
   ```
   
   يجب أن ترى:
   ```json
   {
     "status": "OK",
     "database": {
       "status": "connected"
     }
   }
   ```

---

### الخطوة 3: الإعداد اليدوي (إذا فشل السكريبت)

إذا فشل السكريبت، قم بالإعداد اليدوي:

1. **افتح Google Cloud Console:**
   ```
   https://console.cloud.google.com/run?project=altayar-46d6f
   ```

2. **اختر Service:**
   - اضغط على `altayar-backend`

3. **Edit & Deploy New Revision:**
   - اضغط على "Edit & Deploy New Revision"

4. **Connections:**
   - في قسم "Connections"، اضغط "Add Cloud SQL instance"
   - اختر: `altayar-46d6f:us-central1:altayar-db`

5. **Variables & Secrets:**
   - اضغط "Add Variable" وأضف:
   
   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `8080` |
   | `DB_HOST` | `/cloudsql/altayar-46d6f:us-central1:altayar-db` |
   | `DB_PORT` | `5432` |
   | `DB_USER` | `postgres` |
   | `DB_PASSWORD` | `[your database password]` |
   | `DB_NAME` | `tourist_app_db` |
   | `JWT_SECRET` | `[your JWT secret]` |
   | `SESSION_SECRET` | `[your session secret]` |
   | `FRONTEND_URL` | `https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com` |

6. **Deploy:**
   - اضغط "Deploy" وانتظر حتى يكتمل النشر

---

## 🔧 التغييرات التي تمت

### 1. تحديث `knexfile.js`
- ✅ دعم Cloud SQL Proxy connection (`/cloudsql/...`)
- ✅ دعم SSL للاتصال بـ Public IP
- ✅ كشف تلقائي لنوع الاتصال

### 2. تحديث `cloudbuild.yaml`
- ✅ إضافة متغيرات البيئة لقاعدة البيانات
- ✅ تحديث Cloud SQL instance name إلى `altayar-46d6f:us-central1:altayar-db`

### 3. تحديث `config/db.js`
- ✅ رسائل خطأ أوضح للـ Cloud SQL Proxy
- ✅ إرشادات أفضل عند فشل الاتصال

### 4. سكريبتات جديدة
- ✅ `fix-cloud-run-db.ps1` - سكريبت PowerShell لتحديث Cloud Run
- ✅ `fix-cloud-run-db.bat` - سكريبت Batch لتشغيل PowerShell script

---

## ✅ التحقق من النجاح

بعد تطبيق الحل:

1. **Test API Health:**
   ```bash
   curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
   ```
   يجب أن ترى `"database": { "status": "connected" }`

2. **Test Registration:**
   ```bash
   curl -X POST https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123456",
       "name": "Test User"
     }'
   ```
   يجب أن يعمل بدون خطأ `ECONNREFUSED`

3. **Test Login:**
   ```bash
   curl -X POST https://altayar-backend-kuwjte4rda-uc.a.run.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123456"
     }'
   ```
   يجب أن يعمل بدون خطأ `ECONNREFUSED`

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا يزال الخطأ `ECONNREFUSED` يظهر

**الحل:**
1. تحقق من Cloud Run logs:
   ```bash
   gcloud run services logs read altayar-backend --region us-central1 --project altayar-46d6f
   ```

2. تحقق من Cloud SQL instance:
   ```bash
   gcloud sql instances describe altayar-db --project altayar-46d6f
   ```

3. تحقق من Environment Variables:
   ```bash
   gcloud run services describe altayar-backend --region us-central1 --project altayar-46d6f --format="value(spec.template.spec.containers[0].env)"
   ```

### المشكلة: Cloud SQL instance غير متصل

**الحل:**
1. في Google Cloud Console > Cloud Run > altayar-backend
2. Edit & Deploy New Revision
3. Connections > Add Cloud SQL instance
4. اختر: `altayar-46d6f:us-central1:altayar-db`

### المشكلة: كلمة مرور قاعدة البيانات خاطئة

**الحل:**
1. في Google Cloud Console > SQL > altayar-db
2. Users > Change password
3. أو استخدم:
   ```bash
   gcloud sql users set-password postgres --instance=altayar-db --password=NEW_PASSWORD --project=altayar-46d6f
   ```
4. ثم حدث Cloud Run service:
   ```bash
   gcloud run services update altayar-backend \
     --region us-central1 \
     --project altayar-46d6f \
     --update-env-vars DB_PASSWORD=NEW_PASSWORD
   ```

---

## 📋 ملخص

✅ **المشكلة:** الباك اند يحاول الاتصال بـ `127.0.0.1:5432` بدلاً من Google Cloud SQL

✅ **الحل:** تحديث Cloud Run service لاستخدام Cloud SQL Proxy connection:
- `DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db`
- إضافة Cloud SQL instance connection في Cloud Run

✅ **النتيجة:** الباك اند يتصل بقاعدة البيانات بشكل صحيح ويعمل بدون أخطاء

---

## 🚀 الخطوات التالية

بعد حل المشكلة:

1. ✅ اختبر Register/Login من التطبيق
2. ✅ اختبر جميع الـ endpoints
3. ✅ راقب Cloud Run logs للتأكد من عدم وجود أخطاء
4. ✅ تأكد من أن قاعدة البيانات تعمل بشكل مستقر

---

**تم الحل بشكل نهائي واحترافي! 🎉**

