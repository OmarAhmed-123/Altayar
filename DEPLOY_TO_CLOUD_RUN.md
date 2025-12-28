# دليل النشر على Google Cloud Run

## المتطلبات الأساسية

1. ✅ حساب Google Cloud Platform مع مشروع نشط
2. ✅ تثبيت Google Cloud SDK
3. ✅ تثبيت Docker Desktop
4. ✅ تسجيل الدخول إلى Google Cloud

## الخطوات السريعة

### الطريقة 1: استخدام السكريبت (موصى به)

#### على Windows (PowerShell):
```powershell
.\scripts\deploy.ps1
```

#### على Linux/Mac:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### الطريقة 2: النشر اليدوي

#### 1. التحقق من الإعدادات

```bash
# التحقق من تسجيل الدخول
gcloud auth list

# التحقق من المشروع
gcloud config get-value project

# إذا لم يكن المشروع مضبوطاً:
gcloud config set project YOUR_PROJECT_ID
```

#### 2. تفعيل APIs المطلوبة

```bash
# تفعيل Cloud Run API
gcloud services enable run.googleapis.com

# تفعيل Container Registry API
gcloud services enable containerregistry.googleapis.com

# تفعيل Cloud Build API (إذا كنت تستخدم Cloud Build)
gcloud services enable cloudbuild.googleapis.com
```

#### 3. بناء الصورة

```bash
# تعيين متغيرات
PROJECT_ID=$(gcloud config get-value project)
SERVICE_NAME="altayar-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# بناء الصورة
docker build -t ${IMAGE_NAME}:latest .
```

#### 4. رفع الصورة

```bash
# تسجيل الدخول إلى Container Registry
gcloud auth configure-docker

# رفع الصورة
docker push ${IMAGE_NAME}:latest
```

#### 5. النشر على Cloud Run

```bash
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME}:latest \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 1 \
    --set-env-vars NODE_ENV=production
```

## إعداد متغيرات البيئة

إذا كنت تحتاج إلى إضافة متغيرات بيئة إضافية:

```bash
gcloud run services update altayar-backend \
    --region us-central1 \
    --update-env-vars "DB_HOST=your-db-host,DB_NAME=your-db-name,JWT_SECRET=your-secret"
```

أو استخدم Secret Manager للأمان:

```bash
# إنشاء secret
echo -n "your-secret-value" | gcloud secrets create jwt-secret --data-file=-

# إضافة secret إلى Cloud Run
gcloud run services update altayar-backend \
    --region us-central1 \
    --update-secrets JWT_SECRET=jwt-secret:latest
```

## التحقق من النشر

### 1. التحقق من حالة الخدمة

```bash
gcloud run services describe altayar-backend --region us-central1
```

### 2. اختبار API

```bash
# الحصول على URL الخدمة
SERVICE_URL=$(gcloud run services describe altayar-backend --region us-central1 --format="value(status.url)")

# اختبار health endpoint
curl ${SERVICE_URL}/api/health

# اختبار root endpoint
curl ${SERVICE_URL}/api
```

### 3. عرض السجلات

```bash
# عرض السجلات الحية
gcloud run services logs tail altayar-backend --region us-central1

# عرض آخر 100 سطر
gcloud run services logs read altayar-backend --region us-central1 --limit 100
```

## تحديث التطبيق

بعد إجراء تغييرات:

```bash
# 1. بناء الصورة الجديدة
docker build -t gcr.io/${PROJECT_ID}/altayar-backend:latest .

# 2. رفع الصورة
docker push gcr.io/${PROJECT_ID}/altayar-backend:latest

# 3. تحديث الخدمة
gcloud run deploy altayar-backend \
    --image gcr.io/${PROJECT_ID}/altayar-backend:latest \
    --region us-central1
```

## استكشاف الأخطاء

### مشكلة في البناء

```bash
# تحقق من Dockerfile
docker build -t test-image . --no-cache

# تحقق من السجلات
docker logs <container-id>
```

### مشكلة في النشر

```bash
# عرض تفاصيل الخدمة
gcloud run services describe altayar-backend --region us-central1

# عرض السجلات
gcloud run services logs read altayar-backend --region us-central1 --limit 50
```

### مشكلة في الاتصال بقاعدة البيانات

- تأكد من إعدادات Cloud SQL
- تحقق من أن Cloud Run يمكنه الوصول إلى Cloud SQL
- راجع إعدادات الشبكة والأمان

## ملاحظات مهمة

1. **خطوط Cairo**: تأكد من إضافة خطوط Cairo قبل النشر
2. **متغيرات البيئة**: استخدم Secret Manager للقيم الحساسة
3. **قاعدة البيانات**: تأكد من إعدادات Cloud SQL أو قاعدة البيانات الخارجية
4. **الذاكرة**: الحد الأدنى 2GB مطلوب للتطبيق
5. **المنطقة**: استخدم `us-central1` أو المنطقة الأقرب لك

## التكلفة

- Cloud Run: الدفع حسب الاستخدام
- Container Registry: تخزين مجاني حتى 0.5 GB
- Cloud SQL: حسب الخطة المختارة

## الدعم

- راجع `SOLUTION_SUMMARY.md` للحلول المطبقة
- راجع `README_ARABIC_FIXES.md` لمعلومات دعم العربية
- راجع `QUICK_START_ARABIC.md` للبدء السريع

