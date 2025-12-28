# دليل النشر الكامل على Google Cloud Platform

## نظرة عامة

هذا الدليل يشرح كيفية نشر الباك إند على Google Cloud Platform بحيث يكون متاحاً للجميع عبر الإنترنت.

## المتطلبات

1. **حساب Google Cloud Platform**
   - المشروع: `altayarback`
   - الإيميل: `altayarvipcom@gmail.com`

2. **أدوات مطلوبة:**
   - Google Cloud SDK (gcloud CLI)
   - Docker Desktop
   - Node.js 20+

## الخطوة 1: إعداد البيئة المحلية

### تثبيت Google Cloud SDK

**Windows:**
```bash
# تحميل من: https://cloud.google.com/sdk/docs/install
# أو:
choco install gcloudsdk
```

### تسجيل الدخول
```bash
gcloud auth login
gcloud config set project altayarback
```

## الخطوة 2: إعداد قاعدة البيانات (Cloud SQL)

### استخدام السكريبت التلقائي (موصى به)

**Windows:**
```bash
setup-cloud-sql.bat
```

**Linux/Mac:**
```bash
chmod +x setup-cloud-sql.sh
./setup-cloud-sql.sh
```

### أو يدوياً:

```bash
# إنشاء Cloud SQL instance
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

### الحصول على Connection Name

```bash
gcloud sql instances describe altayar-db --format="value(connectionName)"
# النتيجة: altayarback:us-central1:altayar-db
```

## الخطوة 3: إعداد متغيرات البيئة

1. انسخ `env.production.example` إلى `.env`
2. املأ القيم التالية:

```env
# Database
DB_HOST=/cloudsql/altayarback:us-central1:altayar-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_NAME=tourist_app_db

# Server
NODE_ENV=production
PORT=8080

# Frontend (سيتم تحديثه بعد النشر)
FRONTEND_URL=https://your-frontend-domain.com

# Backend URL (سيتم تحديثه بعد النشر)
BACKEND_URL=https://altayar-backend-xxxxx-uc.a.run.app

# JWT Secrets (استخدم قيم قوية)
JWT_SECRET=your-very-long-and-secure-jwt-secret-key
SESSION_SECRET=your-very-long-and-secure-session-secret-key
```

## الخطوة 4: تشغيل Migrations

### الطريقة 1: استخدام Cloud SQL Proxy محلياً

```bash
# تحميل Cloud SQL Proxy
# Windows: https://cloud.google.com/sql/docs/postgres/sql-proxy#install
# Linux: 
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy

# تشغيل Proxy (في نافذة منفصلة)
cloud_sql_proxy -instances=altayarback:us-central1:altayar-db=tcp:5432

# في نافذة أخرى، قم بتحديث .env لاستخدام localhost
# DB_HOST=127.0.0.1

# تشغيل migrations
npm run migrate:latest
```

### الطريقة 2: استخدام Cloud Run Job (بعد النشر)

```bash
# بعد النشر، أنشئ job للتشغيل مرة واحدة
gcloud run jobs create migrate-db \
    --image gcr.io/altayarback/altayar-backend:latest \
    --region us-central1 \
    --add-cloudsql-instances altayarback:us-central1:altayar-db \
    --set-env-vars NODE_ENV=production,DB_HOST=/cloudsql/altayarback:us-central1:altayar-db,DB_NAME=tourist_app_db,DB_USER=postgres \
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
    --set-env-vars NODE_ENV=production,PORT=8080
```

### الطريقة 3: استخدام Cloud Build

```bash
gcloud builds submit --config cloudbuild.yaml
```

## الخطوة 6: الحصول على URL وتحديث الإعدادات

بعد النشر، احصل على URL:

```bash
gcloud run services describe altayar-backend --region us-central1 --format "value(status.url)"
```

ثم قم بتحديث:

1. **Backend .env:**
   ```env
   BACKEND_URL=https://altayar-backend-xxxxx-uc.a.run.app
   ```

2. **Frontend Configuration:**
   ```bash
   # استخدام السكريبت
   update-frontend-config.bat https://altayar-backend-xxxxx-uc.a.run.app
   
   # أو يدوياً في app_config.dart
   # defaultValue: 'https://altayar-backend-xxxxx-uc.a.run.app/api'
   ```

3. **إعادة النشر مع المتغيرات المحدثة:**
   ```bash
   gcloud run services update altayar-backend \
       --region us-central1 \
       --set-env-vars BACKEND_URL=https://altayar-backend-xxxxx-uc.a.run.app
   ```

## الخطوة 7: اختبار النشر

```bash
# الحصول على URL
SERVICE_URL=$(gcloud run services describe altayar-backend --region us-central1 --format "value(status.url)")

# اختبار Health Check
curl $SERVICE_URL/api/health

# يجب أن ترى:
# {"status":"OK","message":"Server is running",...}
```

## الخطوة 8: إعداد Cloud Storage للملفات (موصى به)

Cloud Run لا يحتفظ بالملفات بعد إعادة التشغيل. استخدم Cloud Storage:

```bash
# إنشاء bucket
gsutil mb -p altayarback -l us-central1 gs://altayar-uploads

# جعل الملفات قابلة للقراءة
gsutil iam ch allUsers:objectViewer gs://altayar-uploads
```

**ملاحظة:** ستحتاج لتحديث الكود لاستخدام Cloud Storage بدلاً من الملفات المحلية.

## الخطوة 9: إعداد Secrets (للأمان)

```bash
# إنشاء secrets
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-
echo -n "YOUR_JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# منح Cloud Run صلاحية الوصول
PROJECT_NUMBER=$(gcloud projects describe altayarback --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding db-password \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## إدارة النشر

### عرض السجلات
```bash
gcloud run services logs read altayar-backend --region us-central1 --limit 50
```

### تحديث الخدمة
```bash
# إعادة النشر
deploy.bat cloud-run
```

### حذف الخدمة
```bash
gcloud run services delete altayar-backend --region us-central1
```

## استكشاف الأخطاء

### خطأ في الاتصال بقاعدة البيانات
- تأكد من أن Cloud SQL instance يعمل: `gcloud sql instances describe altayar-db`
- تحقق من connection name في .env
- تأكد من أن Cloud Run service لديه صلاحية الوصول

### خطأ CORS
- حدّث `FRONTEND_URL` في متغيرات البيئة
- أعد نشر الخدمة

### خطأ في الملفات
- Cloud Run لا يحتفظ بالملفات
- استخدم Cloud Storage للملفات الدائمة

### خطأ في Timeout
- زد timeout في إعدادات Cloud Run: `--timeout 300`

## التكلفة المتوقعة

- **Cloud Run:** ~$0.40/مليون طلب + $0.0000025/GB-second
- **Cloud SQL (db-f1-micro):** ~$7.67/شهر
- **Cloud Storage:** ~$0.020/GB/شهر
- **Network Egress:** ~$0.12/GB (أول 10GB مجاناً)

## الأمان

1. ✅ استخدم Secrets Manager للمعلومات الحساسة
2. ✅ قم بتفعيل HTTPS فقط
3. ✅ استخدم CORS بشكل صحيح
4. ✅ قم بتحديث JWT_SECRET بشكل دوري
5. ✅ استخدم كلمات مرور قوية لقاعدة البيانات

## الدعم

للمساعدة، راجع:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Google Cloud Support](https://cloud.google.com/support)

---

## ملخص الخطوات السريعة

```bash
# 1. تسجيل الدخول
gcloud auth login
gcloud config set project altayarback

# 2. إعداد قاعدة البيانات
setup-cloud-sql.bat

# 3. تحديث .env

# 4. النشر
deploy.bat cloud-run

# 5. تحديث الفرونت إند
update-frontend-config.bat <BACKEND_URL>
```

