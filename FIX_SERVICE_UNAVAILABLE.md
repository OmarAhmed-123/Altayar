# ✅ إصلاح مشكلة Service Unavailable

## 🔧 المشكلة

السيرفر يعرض "Service Unavailable" بسبب:
1. **Environment Variables مفقودة** - قاعدة البيانات، JWT secrets, etc.
2. **Cloud SQL connection غير صحيح** - يحتاج connection string صحيح

---

## ✅ الحل السريع

### الخطوة 1: إضافة Environment Variables

**شغّل:**
```
ADD_ENV_VARS.bat
```

**سيطلب منك:**
- كلمة سر قاعدة البيانات
- JWT Secret (يمكن توليده تلقائياً)
- Session Secret (يمكن توليده تلقائياً)
- Frontend URL (اختياري)

---

## 📋 Environment Variables المطلوبة

### في Cloud Run Console:

1. اذهب إلى: https://console.cloud.google.com/run?project=altayar-46d6f
2. اختر service: `altayar-backend`
3. Edit & Deploy New Revision
4. Variables & Secrets → Add Variable

**أضف هذه المتغيرات:**

```
NODE_ENV=production
DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=tourist_app_db
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure
FRONTEND_URL=https://your-frontend-url.com
```

---

## 🔍 التحقق من المشكلة

### 1. تحقق من Logs:

في Cloud Run Console:
1. اختر service: `altayar-backend`
2. انقر على "Logs"
3. ابحث عن أخطاء مثل:
   - "Database connection failed"
   - "JWT_SECRET is not defined"
   - "Cannot connect to Cloud SQL"

### 2. اختبر Health Endpoint:

افتح في المتصفح:
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

**إذا كان يعمل:** المشكلة في routes أخرى
**إذا كان لا يعمل:** المشكلة في environment variables أو database connection

---

## 🔧 الحل التفصيلي

### 1. إضافة Environment Variables تلقائياً:

```
ADD_ENV_VARS.bat
```

### 2. أو يدوياً من gcloud:

```bash
gcloud run services update altayar-backend \
  --region us-central1 \
  --update-env-vars "NODE_ENV=production,DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=YOUR_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=your-secret,SESSION_SECRET=your-session-secret" \
  --project altayar-46d6f
```

### 3. التحقق من Cloud SQL Connection:

```bash
gcloud sql instances describe altayar-db --format="value(connectionName)"
```

يجب أن يكون: `altayar-46d6f:us-central1:altayar-db`

---

## 📱 تحديث الفرونت إند

### تم التحديث تلقائياً في:
- `E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart`

### إذا كان لديك فرونت إند آخر:

```bash
node update-frontend-config.js https://altayar-backend-kuwjte4rda-uc.a.run.app
```

---

## 🌐 الرابط للوصول من أي مكان

**الرابط جاهز للاستخدام من أي مكان:**
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api
```

**Cloud Run يوفر:**
- ✅ HTTPS تلقائياً
- ✅ وصول عام من أي مكان
- ✅ لا حاجة لـ VPN أو port forwarding
- ✅ SSL/TLS تلقائياً

---

## ✅ بعد إضافة Environment Variables

1. **السيرفر سيعيد التشغيل تلقائياً**
2. **انتظر 1-2 دقيقة**
3. **اختبر Health endpoint:**
   ```
   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
   ```

---

## 🎯 الخطوات الكاملة

1. ✅ **شغّل:** `ADD_ENV_VARS.bat`
2. ✅ **انتظر:** 1-2 دقيقة لإعادة التشغيل
3. ✅ **اختبر:** Health endpoint
4. ✅ **حدث:** الفرونت إند (تم تلقائياً)
5. ✅ **استخدم:** الرابط في التطبيق

---

## 📞 إذا استمرت المشكلة

1. **راجع Logs** في Cloud Run Console
2. **تحقق من** Cloud SQL instance status
3. **تأكد من** Environment variables صحيحة
4. **اختبر** Database connection

---

**شغّل `ADD_ENV_VARS.bat` الآن!** 🚀

