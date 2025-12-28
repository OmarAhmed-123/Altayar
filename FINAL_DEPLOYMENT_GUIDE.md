# 🚀 دليل النشر النهائي - Google Cloud Run

## نظرة سريعة

هذا الدليل يوضح كيفية رفع التعديلات الجديدة (دعم اللغة العربية في PDF) إلى Google Cloud Run.

**URL الحالي**: https://altayar-backend-kuwjte4rda-uc.a.run.app/api

## ⚡ النشر السريع (3 خطوات)

### الخطوة 1: تثبيت خطوط Cairo (مهم جداً!)

```bash
# قم بتحميل الخطوط من:
# https://fonts.google.com/specimen/Cairo
# ثم انسخها إلى:
# E:\Altayar-app\Altayar-app-final\backend\assets\fonts\
```

**الملفات المطلوبة:**
- `Cairo-Regular.ttf`
- `Cairo-Bold.ttf`

### الخطوة 2: النشر باستخدام السكريبت

#### على Windows (PowerShell):
```powershell
cd E:\Altayar-app\Altayar-app-final\backend
.\scripts\deploy.ps1
```

#### على Linux/Mac:
```bash
cd /path/to/backend
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### الخطوة 3: التحقق من النشر

```bash
# اختبار API
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health

# عرض السجلات
gcloud run services logs tail altayar-backend --region us-central1
```

## 📋 النشر اليدوي (خطوة بخطوة)

### 1. التحقق من الإعدادات

```bash
# التحقق من تسجيل الدخول
gcloud auth list

# التحقق من المشروع
gcloud config get-value project

# إذا لم يكن مضبوطاً:
gcloud config set project YOUR_PROJECT_ID
```

### 2. تفعيل APIs المطلوبة

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. بناء الصورة

```bash
# تعيين المتغيرات
$PROJECT_ID = gcloud config get-value project
$SERVICE_NAME = "altayar-backend"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# بناء الصورة
docker build -t $IMAGE_NAME:latest .
```

### 4. رفع الصورة

```bash
# تسجيل الدخول
gcloud auth configure-docker

# رفع الصورة
docker push $IMAGE_NAME:latest
```

### 5. النشر على Cloud Run

```bash
# PORT is automatically set by Cloud Run, don't set it manually
# --concurrency 80 allows handling multiple requests per instance
gcloud run deploy $SERVICE_NAME `
    --image $IMAGE_NAME:latest `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --concurrency 80 `
    --set-env-vars "NODE_ENV=production"
```

## 🔍 التحقق من النشر

### 1. اختبار Health Endpoint

```bash
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

**النتيجة المتوقعة:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "..."
}
```

### 2. اختبار Root Endpoint

```bash
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api
```

### 3. اختبار PDF Generation

1. سجل دخول كعميل
2. افتح كارت العضوية
3. قم بتحميل PDF
4. تحقق من ظهور النصوص العربية بشكل صحيح

### 4. عرض السجلات

```bash
# عرض السجلات الحية
gcloud run services logs tail altayar-backend --region us-central1

# البحث عن رسائل الخطوط
gcloud run services logs read altayar-backend --region us-central1 | grep "PDF Font"
```

**النتيجة المتوقعة:**
```
✅ [PDF Font] Cairo Regular registered: ...
✅ [PDF Font] Cairo Bold registered: ...
```

## ⚙️ إعداد متغيرات البيئة

إذا كنت تحتاج إلى إضافة متغيرات بيئة:

```bash
gcloud run services update altayar-backend `
    --region us-central1 `
    --update-env-vars "DB_HOST=your-host,DB_NAME=your-db"
```

**للأمان (استخدم Secret Manager):**

```bash
# إنشاء secret
echo -n "your-secret" | gcloud secrets create jwt-secret --data-file=-

# إضافة secret إلى Cloud Run
gcloud run services update altayar-backend `
    --region us-central1 `
    --update-secrets JWT_SECRET=jwt-secret:latest
```

## 🔄 تحديث التطبيق (بعد تغييرات جديدة)

```bash
# 1. بناء الصورة الجديدة
docker build -t gcr.io/$PROJECT_ID/altayar-backend:latest .

# 2. رفع الصورة
docker push gcr.io/$PROJECT_ID/altayar-backend:latest

# 3. تحديث الخدمة
gcloud run deploy altayar-backend `
    --image gcr.io/$PROJECT_ID/altayar-backend:latest `
    --region us-central1
```

## 🐛 استكشاف الأخطاء

### مشكلة: البناء فشل

```bash
# بناء مع عرض السجلات الكاملة
docker build --no-cache -t test-image . 2>&1 | tee build.log

# تحقق من الأخطاء
cat build.log | grep -i error
```

### مشكلة: النشر فشل

```bash
# عرض تفاصيل الخدمة
gcloud run services describe altayar-backend --region us-central1

# عرض السجلات
gcloud run services logs read altayar-backend --region us-central1 --limit 100
```

### مشكلة: PDFs لا تعمل

1. تحقق من وجود خطوط Cairo في السجلات
2. تحقق من السجلات للبحث عن أخطاء
3. تأكد من أن الخطوط موجودة في `assets/fonts/`

### مشكلة: النصوص العربية تظهر كرموز

- تأكد من وجود خطوط Cairo في `assets/fonts/`
- تحقق من السجلات: يجب أن ترى `✅ [PDF Font] Cairo Regular registered`
- إذا لم تراها، أعد بناء الصورة بعد إضافة الخطوط

## 📊 مراقبة التطبيق

### عرض الإحصائيات

```bash
# عرض معلومات الخدمة
gcloud run services describe altayar-backend --region us-central1

# عرض الاستخدام
gcloud run services list --region us-central1
```

### عرض السجلات في الوقت الفعلي

```bash
gcloud run services logs tail altayar-backend --region us-central1 --follow
```

## ✅ قائمة التحقق النهائية

- [ ] خطوط Cairo موجودة في `assets/fonts/`
- [ ] تم بناء الصورة بنجاح
- [ ] تم رفع الصورة بنجاح
- [ ] تم النشر بنجاح
- [ ] Health endpoint يعمل
- [ ] PDFs تعمل بشكل صحيح
- [ ] النصوص العربية تظهر بشكل صحيح

## 📚 ملفات مرجعية

- `DEPLOY_TO_CLOUD_RUN.md` - دليل مفصل
- `DEPLOYMENT_CHECKLIST.md` - قائمة التحقق
- `SOLUTION_SUMMARY.md` - ملخص الحلول
- `README_ARABIC_FIXES.md` - معلومات دعم العربية

## 🎉 بعد النشر

بعد النشر الناجح:

1. ✅ اختبر جميع الوظائف
2. ✅ تحقق من PDFs
3. ✅ تحقق من النصوص العربية
4. ✅ راقب السجلات للتأكد من عدم وجود أخطاء

---

**جاهز للنشر! اتبع الخطوات أعلاه وستكون كل شيء يعمل بشكل صحيح.** 🚀
