# دليل النشر على Google Cloud Platform

هذا الدليل يشرح كيفية نشر الباك إند على Google Cloud Platform بحيث يكون متاحاً للجميع.

## المتطلبات الأساسية

1. **حساب Google Cloud Platform**
   - المشروع: `altayarback`
   - الإيميل: `altayarvipcom@gmail.com`

2. **أدوات مطلوبة:**
   - Google Cloud SDK (gcloud CLI)
   - Docker Desktop (للنشر على Cloud Run)
   - Node.js 20+

## الخطوة 1: إعداد Google Cloud SDK

### تثبيت Google Cloud SDK

**Windows:**
```bash
# تحميل من: https://cloud.google.com/sdk/docs/install
# أو استخدام Chocolatey:
choco install gcloudsdk
```

**Linux/Mac:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### تسجيل الدخول
```bash
gcloud auth login
gcloud config set project altayarback
```

## الخطوة 2: إعداد قاعدة البيانات (Cloud SQL)

### إنشاء قاعدة بيانات PostgreSQL على Cloud SQL

```bash
# إنشاء قاعدة بيانات PostgreSQL
gcloud sql instances create altayar-db \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --root-password=YOUR_SECURE_PASSWORD

# إنشاء قاعدة البيانات
gcloud sql databases create tourist_app_db --instance=altayar-db

# إنشاء مستخدم
gcloud sql users create postgres \
    --instance=altayar-db \
    --password=YOUR_SECURE_PASSWORD
```

### الحصول على معلومات الاتصال

```bash
# الحصول على connection name
gcloud sql instances describe altayar-db --format="value(connectionName)"
# النتيجة ستكون: altayarback:us-central1:altayar-db
```

## الخطوة 3: إعداد متغيرات البيئة

1. انسخ ملف `env.production.example` إلى `.env`
2. املأ القيم التالية:

```env
DB_HOST=/cloudsql/altayarback:us-central1:altayar-db
DB_PASSWORD=YOUR_SECURE_PASSWORD
BACKEND_URL=https://altayar-backend-xxxxx-uc.a.run.app  # سيتم تحديثه بعد النشر
FRONTEND_URL=https://your-frontend-domain.com
```

## الخطوة 4: تشغيل Migrations

### الطريقة 1: استخدام Cloud SQL Proxy محلياً

```bash
# تحميل Cloud SQL Proxy
# Windows: https://cloud.google.com/sql/docs/postgres/sql-proxy#install
# Linux/Mac: 
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# تشغيل Proxy
./cloud_sql_proxy -instances=altayarback:us-central1:altayar-db=tcp:5432

# في نافذة أخرى، قم بتشغيل migrations
npm run migrate:latest
```

### الطريقة 2: استخدام Cloud Build Job

```bash
# إنشاء job للتشغيل مرة واحدة
gcloud run jobs create migrate-db \
    --image gcr.io/altayarback/altayar-backend:latest \
    --region us-central1 \
    --add-cloudsql-instances altayarback:us-central1:altayar-db \
    --set-env-vars NODE_ENV=production \
    --command npx \
    --args knex,migrate:latest

# تشغيل Job
gcloud run jobs execute migrate-db --region us-central1
```

## الخطوة 5: النشر على Cloud Run

### الطريقة 1: استخدام سكريبت النشر (موصى به)

**Windows:**
```bash
deploy.bat cloud-run
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh cloud-run
```

### الطريقة 2: النشر يدوياً

```bash
# بناء الصورة
docker build -t gcr.io/altayarback/altayar-backend:latest .

# رفع الصورة
docker push gcr.io/altayarback/altayar-backend:latest

# النشر
gcloud run deploy altayar-backend \
    --image gcr.io/altayarback/altayar-backend:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 1 \
    --add-cloudsql-instances altayarback:us-central1:altayar-db \
    --set-env-vars NODE_ENV=production,PORT=8080 \
    --set-secrets DB_PASSWORD=db-password:latest,JWT_SECRET=jwt-secret:latest
```

### الطريقة 3: استخدام Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

## الخطوة 6: إعداد Secrets (موصى به للأمان)

```bash
# إنشاء secrets
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# منح Cloud Run صلاحية الوصول
gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## الخطوة 7: تحديث متغيرات البيئة بعد النشر

بعد النشر، ستحصل على URL مثل:
```
https://altayar-backend-xxxxx-uc.a.run.app
```

قم بتحديث:
1. `.env` في الباك إند: `BACKEND_URL`
2. `app_config.dart` في الفرونت إند: `API_BASE_URL`

## الخطوة 8: اختبار النشر

```bash
# الحصول على URL
SERVICE_URL=$(gcloud run services describe altayar-backend --region us-central1 --format 'value(status.url)')

# اختبار Health Check
curl $SERVICE_URL/api/health

# اختبار API
curl $SERVICE_URL/api
```

## الخطوة 9: تحديث الفرونت إند

### تحديث app_config.dart

```dart
// في lib/core/config/app_config.dart
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://altayar-backend-xxxxx-uc.a.run.app/api',
);
```

### أو استخدام --dart-define عند البناء

```bash
flutter build apk --dart-define=API_BASE_URL=https://altayar-backend-xxxxx-uc.a.run.app/api
```

## إدارة النشر

### عرض السجلات
```bash
gcloud run services logs read altayar-backend --region us-central1
```

### تحديث الخدمة
```bash
# إعادة النشر بنفس الطريقة
deploy.bat cloud-run
```

### حذف الخدمة
```bash
gcloud run services delete altayar-backend --region us-central1
```

## استكشاف الأخطاء

### مشكلة الاتصال بقاعدة البيانات
- تأكد من أن Cloud SQL instance يعمل
- تحقق من أن connection name صحيح
- تأكد من أن Cloud Run service لديه صلاحية الوصول

### مشكلة CORS
- تأكد من تحديث `FRONTEND_URL` في متغيرات البيئة
- تحقق من أن الـ origin صحيح في الطلبات

### مشكلة الملفات المرفوعة
- Cloud Run لا يحتفظ بالملفات بعد إعادة التشغيل
- استخدم Cloud Storage للملفات الدائمة

## التكلفة المتوقعة

- Cloud Run: ~$0.40/مليون طلب + $0.0000025/GB-second
- Cloud SQL (db-f1-micro): ~$7.67/شهر
- Cloud Storage: ~$0.020/GB/شهر

## الأمان

1. استخدم Secrets Manager للمعلومات الحساسة
2. قم بتفعيل HTTPS فقط
3. استخدم CORS بشكل صحيح
4. قم بتحديث JWT_SECRET بشكل دوري

## الدعم

للمساعدة، راجع:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Google Cloud Support](https://cloud.google.com/support)

