# دليل النشر على Google Cloud Platform - Altayar Backend

## 🎯 الهدف

نشر الباك إند على Google Cloud Platform بحيث يكون متاحاً للجميع عبر الإنترنت.

## 📋 المتطلبات

1. **حساب Google Cloud Platform**
   - المشروع: `altayarback`
   - الإيميل: `altayarvipcom@gmail.com`

2. **أدوات مطلوبة:**
   - Google Cloud SDK (gcloud CLI)
   - Docker Desktop
   - Node.js 20+

## 🚀 النشر السريع (5 خطوات)

### 1. تسجيل الدخول
```bash
gcloud auth login
gcloud config set project altayarback
```

### 2. إعداد قاعدة البيانات
```bash
setup-cloud-sql.bat
```

### 3. تحديث ملف .env
انسخ `env.production.example` إلى `.env` واملأ القيم

### 4. النشر
```bash
deploy.bat cloud-run
```

### 5. تحديث الفرونت إند
```bash
# بعد الحصول على URL
update-frontend-config.bat https://altayar-backend-xxxxx-uc.a.run.app
```

## 📁 الملفات المهمة

### ملفات النشر
- `Dockerfile` - لبناء صورة Docker
- `deploy.bat` / `deploy.sh` - سكريبت النشر
- `setup-cloud-sql.bat` / `setup-cloud-sql.sh` - إعداد قاعدة البيانات
- `cloudbuild.yaml` - إعداد Cloud Build
- `app.yaml` - إعداد App Engine (بديل)

### ملفات التكوين
- `env.production.example` - مثال لمتغيرات البيئة
- `.env` - ملف البيئة الفعلي (لا يتم رفعه)

### سكريبتات مساعدة
- `update-frontend-config.bat` - تحديث إعدادات الفرونت إند
- `verify-deployment.bat` - التحقق من النشر

## 📖 الأدلة المتوفرة

1. **QUICK_DEPLOY.md** - دليل سريع
2. **GOOGLE_CLOUD_DEPLOYMENT.md** - دليل شامل
3. **DEPLOYMENT_COMPLETE_GUIDE.md** - دليل كامل خطوة بخطوة
4. **FINAL_DEPLOYMENT_SUMMARY.md** - ملخص نهائي

## ⚙️ الإعدادات المهمة

### متغيرات البيئة (.env)

```env
# قاعدة البيانات
DB_HOST=/cloudsql/altayarback:us-central1:altayar-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=tourist_app_db

# السيرفر
NODE_ENV=production
PORT=8080

# URLs
BACKEND_URL=https://altayar-backend-xxxxx-uc.a.run.app
FRONTEND_URL=https://your-frontend-domain.com

# Secrets
JWT_SECRET=your-very-long-secret-key
SESSION_SECRET=your-very-long-secret-key
```

### إعدادات الفرونت إند (app_config.dart)

```dart
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://altayar-backend-xxxxx-uc.a.run.app/api',
);
```

## 🔧 الأوامر المفيدة

### عرض السجلات
```bash
gcloud run services logs read altayar-backend --region us-central1
```

### تحديث الخدمة
```bash
deploy.bat cloud-run
```

### التحقق من النشر
```bash
verify-deployment.bat
```

### حذف الخدمة
```bash
gcloud run services delete altayar-backend --region us-central1
```

## ⚠️ ملاحظات مهمة

### 1. الملفات المرفوعة
- Cloud Run لا يحتفظ بالملفات بعد إعادة التشغيل
- استخدم Cloud Storage للملفات الدائمة (اختياري)

### 2. قاعدة البيانات
- تأكد من أن Cloud SQL instance يعمل
- استخدم Cloud SQL Proxy للاتصال المحلي

### 3. CORS
- حدّث `FRONTEND_URL` في .env
- أعد نشر الخدمة بعد التحديث

### 4. Secrets
- استخدم Secrets Manager للمعلومات الحساسة
- لا تضع كلمات المرور في .env مباشرة

## 🐛 استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
```bash
# تحقق من حالة Cloud SQL
gcloud sql instances describe altayar-db
```

### خطأ CORS
- حدّث `FRONTEND_URL` في .env
- أعد نشر الخدمة

### خطأ في Timeout
- زد timeout في إعدادات Cloud Run
- تحقق من حجم الملفات المرفوعة

## 💰 التكلفة المتوقعة

- **Cloud Run:** ~$0.40/مليون طلب
- **Cloud SQL:** ~$7.67/شهر (db-f1-micro)
- **Cloud Storage:** ~$0.020/GB/شهر

## 📞 الدعم

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Google Cloud Support](https://cloud.google.com/support)

## ✅ قائمة التحقق

- [ ] تثبيت Google Cloud SDK
- [ ] تسجيل الدخول (`gcloud auth login`)
- [ ] إعداد قاعدة البيانات (`setup-cloud-sql.bat`)
- [ ] تحديث ملف .env
- [ ] النشر (`deploy.bat cloud-run`)
- [ ] تحديث الفرونت إند (`update-frontend-config.bat`)
- [ ] التحقق من النشر (`verify-deployment.bat`)
- [ ] اختبار API من الفرونت إند

## 🎉 النجاح!

بعد اكتمال النشر، ستحصل على:
- ✅ URL عام للباك إند
- ✅ قاعدة بيانات على Cloud SQL
- ✅ خدمة قابلة للتوسع تلقائياً
- ✅ HTTPS مفعّل تلقائياً
- ✅ سجلات مركزية

---

**المشروع:** altayarback  
**المنطقة:** us-central1  
**الخدمة:** altayar-backend

