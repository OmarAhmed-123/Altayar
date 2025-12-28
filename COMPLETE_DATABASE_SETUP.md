# 🗄️ إعداد قاعدة البيانات - الحل الكامل

## 🎯 المشكلة

الخادم لا يستطيع الاتصال بقاعدة البيانات PostgreSQL على:
- **محلياً**: `localhost:5432` (PostgreSQL غير مثبت أو غير مشغل)
- **على Cloud Run**: قاعدة البيانات غير متصلة (يحتاج إعداد Cloud SQL)

## ✅ الحل الكامل

### الجزء 1: إعداد قاعدة البيانات محلياً (للتطوير)

#### الطريقة السريعة - Docker (موصى به):

```powershell
# تشغيل السكريبت الكامل
.\scripts\setup-local-db-complete.ps1
```

هذا السكريبت سيقوم بـ:
1. ✅ إنشاء PostgreSQL container في Docker
2. ✅ إنشاء ملف `.env` تلقائياً
3. ✅ تشغيل migrations تلقائياً

#### أو يدوياً:

```powershell
# 1. إنشاء PostgreSQL container
docker run --name altayar-postgres `
    -e POSTGRES_PASSWORD=StrongPass123 `
    -e POSTGRES_DB=tourist_app_db `
    -p 5432:5432 `
    -d postgres:15-alpine

# 2. انتظر 10 ثواني حتى PostgreSQL يكون جاهز
Start-Sleep -Seconds 10

# 3. إنشاء ملف .env
@"
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db
NODE_ENV=development
PORT=5000
"@ | Out-File -FilePath ".env" -Encoding UTF8

# 4. تشغيل migrations
npm run migrate:latest

# 5. إعادة تشغيل الخادم
npm start
```

### الجزء 2: إعداد قاعدة البيانات على Cloud Run (للإنتاج)

#### الطريقة السريعة:

```powershell
.\scripts\setup-cloud-db.ps1
```

#### أو يدوياً:

##### 1. إنشاء Cloud SQL Instance (إذا لم يكن موجوداً):

```powershell
gcloud sql instances create altayar-db `
    --database-version=POSTGRES_15 `
    --tier=db-f1-micro `
    --region=us-central1 `
    --root-password=YOUR_SECURE_PASSWORD
```

##### 2. إنشاء قاعدة البيانات:

```powershell
gcloud sql databases create tourist_app_db --instance=altayar-db
```

##### 3. الحصول على Connection Name:

```powershell
gcloud sql instances describe altayar-db --format="value(connectionName)"
# النتيجة: altayar-46d6f:us-central1:altayar-db
```

##### 4. تحديث Cloud Run Service:

```powershell
$CONNECTION_NAME = "altayar-46d6f:us-central1:altayar-db"
$DB_PASSWORD = "YOUR_DB_PASSWORD"
$JWT_SECRET = "your-jwt-secret-here"
$SESSION_SECRET = "your-session-secret-here"

gcloud run services update altayar-backend `
    --region us-central1 `
    --add-cloudsql-instances $CONNECTION_NAME `
    --update-env-vars "NODE_ENV=production,DB_HOST=/cloudsql/$CONNECTION_NAME,DB_PORT=5432,DB_USER=postgres,DB_PASSWORD=$DB_PASSWORD,DB_NAME=tourist_app_db,JWT_SECRET=$JWT_SECRET,SESSION_SECRET=$SESSION_SECRET"
```

##### 5. تشغيل Migrations على Cloud Run:

```powershell
# استخدام Cloud SQL Proxy
# تحميل Cloud SQL Proxy
# https://cloud.google.com/sql/docs/postgres/sql-proxy

# في terminal منفصل
cloud_sql_proxy -instances=$CONNECTION_NAME=tcp:5432

# في terminal آخر
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="5432"
$env:DB_USER="postgres"
$env:DB_PASSWORD="YOUR_DB_PASSWORD"
$env:DB_NAME="tourist_app_db"
npm run migrate:latest
```

## ✅ التحقق من الحل

### محلياً:

```powershell
# 1. اختبار الاتصال
npm start

# يجب أن ترى:
# ✅ PostgreSQL connected successfully.
# ✅ Database: Connected and operational

# 2. اختبار Health Endpoint
curl http://localhost:5000/api/health

# يجب أن ترى:
# {
#   "database": {
#     "status": "connected",
#     "message": "Database is connected and operational"
#   }
# }
```

### على Cloud Run:

```powershell
# اختبار Health Endpoint
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health

# يجب أن ترى:
# {
#   "database": {
#     "status": "connected",
#     "message": "Database is connected and operational"
#   }
# }
```

## 🔧 استكشاف الأخطاء

### محلياً:

#### خطأ: "Connection refused"
```powershell
# تحقق من أن container يعمل
docker ps | findstr altayar-postgres

# إذا لم يكن يعمل، ابدأه
docker start altayar-postgres

# تحقق من logs
docker logs altayar-postgres
```

#### خطأ: "Database does not exist"
```powershell
# إنشاء قاعدة البيانات
docker exec -it altayar-postgres psql -U postgres -c "CREATE DATABASE tourist_app_db;"
```

### على Cloud Run:

#### خطأ: "Service Unavailable"
1. تحقق من Logs في Cloud Run Console
2. تأكد من أن Cloud SQL instance يعمل
3. تأكد من أن Connection Name صحيح
4. تأكد من أن Environment Variables مضبوطة

#### خطأ: "Authentication failed"
- تحقق من DB_PASSWORD في Environment Variables
- تأكد من أن المستخدم `postgres` موجود

## 📋 Checklist

### محلياً:
- [ ] Docker Desktop يعمل
- [ ] PostgreSQL container يعمل
- [ ] ملف `.env` موجود وصحيح
- [ ] Migrations تم تشغيلها
- [ ] الخادم يعمل بدون أخطاء

### على Cloud Run:
- [ ] Cloud SQL instance موجود ويعمل
- [ ] Connection Name صحيح
- [ ] Environment Variables مضبوطة
- [ ] Cloud SQL connection مضاف إلى Cloud Run service
- [ ] Migrations تم تشغيلها

## 🎯 النتيجة النهائية

بعد تطبيق الحلول:
- ✅ قاعدة البيانات تعمل محلياً
- ✅ قاعدة البيانات متصلة على Cloud Run
- ✅ الخادم يعمل بدون أخطاء
- ✅ جميع API endpoints تعمل بشكل صحيح

---

**اتبع الخطوات أعلاه وستكون قاعدة البيانات تعمل بشكل صحيح!** ✅

