# 🚀 خطوات النشر النهائية - Altayar Backend

## ✅ الحالة الحالية

تم تسجيل الدخول إلى Google Cloud بنجاح:
- ✅ الحساب: altayarvipcom@gmail.com
- ✅ المشروع: altayarback
- ✅ Google Cloud SDK مثبت ويعمل

## 📋 الخطوات التالية (نشر كامل)

### الطريقة 1: النشر التلقائي الكامل (موصى به)

```bash
cd E:\Altayar-app\Altayar-app-final\backend
run-complete-deployment.bat
```

هذا السكريبت سيقوم تلقائياً بـ:
1. ✅ تفعيل APIs المطلوبة
2. ✅ إنشاء/التحقق من Cloud SQL
3. ✅ إنشاء قاعدة البيانات والمستخدم
4. ✅ بناء صورة Docker
5. ✅ رفع الصورة إلى Container Registry
6. ✅ النشر على Cloud Run
7. ✅ تحديث إعدادات الفرونت إند
8. ✅ اختبار النشر

### الطريقة 2: خطوات يدوية (للمزيد من التحكم)

#### الخطوة 1: إعداد قاعدة البيانات
```bash
setup-cloud-sql.bat
```

#### الخطوة 2: تحديث ملف .env
1. انسخ `env.production.example` إلى `.env`
2. املأ القيم التالية:
   ```env
   DB_HOST=/cloudsql/altayarback:us-central1:altayar-db
   DB_PASSWORD=your-database-password
   JWT_SECRET=your-very-long-secret-key-min-32-chars
   SESSION_SECRET=your-very-long-secret-key-min-32-chars
   ```

#### الخطوة 3: النشر
```bash
deploy.bat cloud-run
```

#### الخطوة 4: تحديث الفرونت إند
بعد الحصول على URL من الخطوة 3:
```bash
update-frontend-config.bat https://altayar-backend-xxxxx-uc.a.run.app
```

#### الخطوة 5: التحقق من التوافق
```bash
check-compatibility.bat https://altayar-backend-xxxxx-uc.a.run.app
```

## 🔧 بعد النشر

### 1. تشغيل Migrations

**الطريقة 1: استخدام Cloud SQL Proxy**
```bash
# تحميل Cloud SQL Proxy من:
# https://cloud.google.com/sql/docs/postgres/sql-proxy#install

# تشغيل Proxy
cloud_sql_proxy.exe -instances=altayarback:us-central1:altayar-db=tcp:5432

# في نافذة أخرى، تحديث .env مؤقتاً:
# DB_HOST=127.0.0.1

# تشغيل migrations
npm run migrate:latest
```

**الطريقة 2: استخدام Cloud Run Job**
```bash
# بعد النشر، أنشئ job
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

### 2. تحديث متغيرات البيئة في Cloud Run

```bash
# الحصول على URL أولاً
gcloud run services describe altayar-backend --region us-central1 --format "value(status.url)"

# تحديث متغيرات البيئة
gcloud run services update altayar-backend \
    --region us-central1 \
    --set-env-vars BACKEND_URL=https://YOUR-SERVICE-URL,FRONTEND_URL=https://your-frontend-domain.com
```

### 3. اختبار API

```bash
# Health Check
curl https://YOUR-SERVICE-URL/api/health

# API Root
curl https://YOUR-SERVICE-URL/api
```

## 🐛 استكشاف الأخطاء

### خطأ: "gcloud: command not found"
- تأكد من تثبيت Google Cloud SDK
- أعد تشغيل Terminal

### خطأ: "Docker is not running"
- شغّل Docker Desktop
- انتظر حتى يبدأ بالكامل

### خطأ: "Permission denied" في Cloud SQL
- تأكد من تفعيل SQL Admin API
- تحقق من صلاحيات الحساب

### خطأ: "Database connection failed"
- تحقق من connection name في .env
- تأكد من أن Cloud SQL instance يعمل
- تحقق من كلمة المرور

### خطأ: "CORS error" في الفرونت إند
- حدّث `FRONTEND_URL` في .env
- أعد نشر الخدمة
- تحقق من أن URL الفرونت إند صحيح

## 📊 مراقبة النشر

### عرض السجلات
```bash
gcloud run services logs read altayar-backend --region us-central1 --limit 50
```

### عرض معلومات الخدمة
```bash
gcloud run services describe altayar-backend --region us-central1
```

### عرض الإحصائيات
```bash
gcloud run services describe altayar-backend --region us-central1 --format="value(status.url,status.conditions)"
```

## ✅ قائمة التحقق النهائية

- [ ] تم تسجيل الدخول إلى Google Cloud ✅
- [ ] تم تفعيل APIs المطلوبة
- [ ] تم إنشاء/التحقق من Cloud SQL
- [ ] تم تحديث ملف .env
- [ ] تم بناء صورة Docker
- [ ] تم رفع الصورة
- [ ] تم النشر على Cloud Run
- [ ] تم تحديث إعدادات الفرونت إند
- [ ] تم تشغيل Migrations
- [ ] تم اختبار API
- [ ] تم التحقق من التوافق

## 🎉 النجاح!

بعد اكتمال جميع الخطوات، ستحصل على:
- ✅ URL عام للباك إند: `https://altayar-backend-xxxxx-uc.a.run.app`
- ✅ API متاح: `https://altayar-backend-xxxxx-uc.a.run.app/api`
- ✅ قاعدة بيانات على Cloud SQL
- ✅ خدمة قابلة للتوسع تلقائياً
- ✅ HTTPS مفعّل تلقائياً
- ✅ CORS مُعد بشكل صحيح
- ✅ الفرونت إند محدّث ومتصل

---

**ابدأ الآن:**
```bash
cd E:\Altayar-app\Altayar-app-final\backend
run-complete-deployment.bat
```

