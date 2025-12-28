# دليل النشر السريع على Google Cloud

## الخطوات السريعة (Windows)

### 1. تثبيت Google Cloud SDK
```bash
# تحميل من: https://cloud.google.com/sdk/docs/install
# أو:
choco install gcloudsdk
```

### 2. تسجيل الدخول
```bash
gcloud auth login
gcloud config set project altayarback
```

### 3. إعداد قاعدة البيانات
```bash
setup-cloud-sql.bat
```

### 4. تحديث ملف .env
انسخ `env.production.example` إلى `.env` واملأ القيم

### 5. النشر
```bash
deploy.bat cloud-run
```

### 6. تشغيل Migrations
```bash
# بعد النشر، استخدم Cloud SQL Proxy محلياً
# أو استخدم Cloud Run Job
```

### 7. تحديث الفرونت إند
حدّث `API_BASE_URL` في `app_config.dart` بالـ URL الجديد

## الحصول على URL بعد النشر

```bash
gcloud run services describe altayar-backend --region us-central1 --format "value(status.url)"
```

## اختبار النشر

افتح المتصفح واذهب إلى:
```
https://YOUR-SERVICE-URL/api/health
```

يجب أن ترى:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

## استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
- تأكد من أن Cloud SQL instance يعمل
- تحقق من connection name في .env
- تأكد من أن Cloud Run service لديه صلاحية الوصول

### خطأ CORS
- حدّث FRONTEND_URL في .env
- أعد نشر الخدمة

### خطأ في الملفات
- Cloud Run لا يحتفظ بالملفات
- استخدم Cloud Storage للملفات الدائمة

