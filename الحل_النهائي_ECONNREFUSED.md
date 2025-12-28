# ✅ الحل النهائي لمشكلة ECONNREFUSED 127.0.0.1:5432

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
fix-database-connection-final.bat
```

#### PowerShell:
```powershell
cd E:\Altayar-app\Altayar-app-final\backend
.\fix-database-connection-final.ps1
```

هذا السكريبت سيقوم بـ:
1. ✅ تحديث Cloud Run service بالمتغيرات الصحيحة
2. ✅ إضافة Cloud SQL instance connection
3. ✅ تعيين `DB_HOST` بشكل صحيح (Cloud SQL Proxy أو Public IP)
4. ✅ التحقق من أن الخدمة تعمل بشكل صحيح

---

### الخطوة 2: اختيار طريقة الاتصال

السكريبت سيعرض لك خيارين:

#### الخيار 1: Cloud SQL Proxy (Socket) - **موصى به**
```
DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
```
- ✅ الأكثر أماناً
- ✅ يعمل مباشرة على Cloud Run
- ✅ لا يحتاج Public IP
- ✅ لا يحتاج SSL configuration

#### الخيار 2: Public IP with SSL - **بديل**
```
DB_HOST=34.58.123.127
```
- ✅ يعمل من أي مكان
- ✅ يحتاج SSL enabled
- ✅ يحتاج Public IP enabled على Cloud SQL

---

### الخطوة 3: التحقق من الإعدادات

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

---

## 🔧 التغييرات التي تمت

### 1. تحديث `knexfile.js`
- ✅ دعم أفضل لـ Cloud SQL Proxy (socket)
- ✅ دعم أفضل لـ Public IP مع SSL
- ✅ كشف تلقائي لنوع الاتصال
- ✅ رسائل توضيحية في console

### 2. تحديث `config/db.js`
- ✅ رسائل خطأ أوضح
- ✅ إرشادات أفضل عند فشل الاتصال
- ✅ دعم أفضل لـ Public IP

### 3. سكريبتات جديدة
- ✅ `fix-database-connection-final.ps1` - تحديث Cloud Run service
- ✅ `fix-database-connection-final.bat` - wrapper للـ PowerShell script
- ✅ `test-database-connection.ps1` - اختبار الاتصال

---

## 🚀 الاستخدام

### تحديث Cloud Run Service:

```powershell
# شغّل السكريبت
.\fix-database-connection-final.ps1

# سيطلب منك:
# 1. اختيار طريقة الاتصال (1 أو 2)
# 2. كلمة سر قاعدة البيانات
# 3. JWT_SECRET (يمكن توليده تلقائياً)
# 4. SESSION_SECRET (يمكن توليده تلقائياً)
```

### اختبار الاتصال:

```powershell
# اختبار الاتصال بقاعدة البيانات
.\test-database-connection.ps1
```

---

## ✅ التحقق من الحل

بعد تحديث Cloud Run service:

1. **انتظر 1-2 دقيقة** حتى يتم تحديث الخدمة

2. **اختبر Health Endpoint:**
   ```
   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
   ```

3. **تحقق من Database Status:**
   ```json
   {
     "database": {
       "status": "connected",
       "message": "Database is connected and operational"
     }
   }
   ```

4. **اختبر Register/Login:**
   - يجب أن يعمل بدون خطأ `ECONNREFUSED`

---

## 🔍 استكشاف الأخطاء

### إذا استمرت المشكلة:

#### 1. تحقق من Cloud SQL Instance:
- ✅ Cloud SQL instance يعمل
- ✅ Public IP enabled (إذا كنت تستخدم Public IP)
- ✅ Authorized networks configured (إذا كنت تستخدم Public IP)

#### 2. تحقق من Cloud Run Service:
- ✅ Environment variables صحيحة
- ✅ Cloud SQL instance linked
- ✅ Service logs لا تظهر أخطاء

#### 3. جرب طريقة اتصال مختلفة:
- إذا كان Cloud SQL Proxy لا يعمل، جرب Public IP
- إذا كان Public IP لا يعمل، جرب Cloud SQL Proxy

#### 4. راجع Logs:
```bash
gcloud run services logs read altayar-backend --region us-central1
```

---

## 📋 Environment Variables المطلوبة

### في Cloud Run:

```
NODE_ENV=production
PORT=8080
DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=tourist_app_db
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com
BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app
```

---

## 🎯 الخطوات السريعة

1. ✅ **شغّل:** `fix-database-connection-final.bat`
2. ✅ **اختر:** طريقة الاتصال (1 أو 2)
3. ✅ **أدخل:** كلمة سر قاعدة البيانات
4. ✅ **انتظر:** 1-2 دقيقة
5. ✅ **اختبر:** https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
6. ✅ **تحقق:** Database status = "connected"

---

## ✅ النتيجة المتوقعة

بعد تطبيق الحل:

- ✅ لا مزيد من أخطاء `ECONNREFUSED`
- ✅ Register/Login يعمل بشكل صحيح
- ✅ قاعدة البيانات متصلة بشكل دائم
- ✅ السيرفر يعمل حتى عند إغلاق الجهاز المحلي

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. راجع: Cloud Run logs في Console
2. اختبر: Health endpoint
3. جرب: طريقة اتصال مختلفة
4. راجع: هذا الملف مرة أخرى

---

**الحل النهائي جاهز! 🎉**
