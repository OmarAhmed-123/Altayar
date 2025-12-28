# قائمة التحقق قبل النشر

## ✅ التحقق من الملفات المطلوبة

### 1. خطوط Cairo (مهم جداً!)
- [ ] `assets/fonts/Cairo-Regular.ttf` موجود
- [ ] `assets/fonts/Cairo-Bold.ttf` موجود
- [ ] إذا لم تكن موجودة، قم بتحميلها من: https://fonts.google.com/specimen/Cairo

### 2. ملفات الإعداد
- [x] `Dockerfile` محدث
- [x] `.gcloudignore` موجود
- [x] `cloudbuild.yaml` موجود (إذا كنت تستخدم Cloud Build)
- [x] `scripts/deploy.ps1` موجود (لـ Windows)
- [x] `scripts/deploy.sh` موجود (لـ Linux/Mac)

### 3. ملفات الكود
- [x] `utils/pdfFontHelper.js` محدث
- [x] `utils/pdfGenerator.js` محدث
- [x] `controllers/reportController.js` محدث
- [x] جميع التعديلات تمت

## ✅ التحقق من Google Cloud

### 1. الإعدادات الأساسية
```bash
# التحقق من تسجيل الدخول
gcloud auth list

# التحقق من المشروع
gcloud config get-value project

# إذا لم يكن مضبوطاً:
gcloud config set project YOUR_PROJECT_ID
```

### 2. تفعيل APIs
```bash
# تفعيل Cloud Run API
gcloud services enable run.googleapis.com

# تفعيل Container Registry API
gcloud services enable containerregistry.googleapis.com
```

### 3. التحقق من Docker
```bash
# التحقق من تثبيت Docker
docker --version

# تسجيل الدخول إلى Container Registry
gcloud auth configure-docker
```

## ✅ التحقق من متغيرات البيئة

تأكد من إعداد المتغيرات التالية في Cloud Run:

- `NODE_ENV=production`
- `PORT=8080`
- `DB_HOST` (إذا كنت تستخدم قاعدة بيانات)
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD` (استخدم Secret Manager)
- `JWT_SECRET` (استخدم Secret Manager)
- أي متغيرات بيئة أخرى مطلوبة

## ✅ اختبار محلي (اختياري لكن موصى به)

```bash
# بناء الصورة محلياً
docker build -t altayar-backend-test .

# تشغيل الحاوية
docker run -p 8080:8080 -e NODE_ENV=production -e PORT=8080 altayar-backend-test

# اختبار في متصفح
# http://localhost:8080/api/health
```

## ✅ عملية النشر

### الطريقة السريعة (موصى به):
```powershell
# على Windows
.\scripts\deploy.ps1
```

```bash
# على Linux/Mac
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### الطريقة اليدوية:
راجع `DEPLOY_TO_CLOUD_RUN.md` للتفاصيل الكاملة

## ✅ بعد النشر

### 1. التحقق من النشر
```bash
# الحصول على URL
gcloud run services describe altayar-backend --region us-central1 --format="value(status.url)"

# اختبار health endpoint
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

### 2. اختبار PDF
- [ ] اختبار كارت العضوية PDF
- [ ] اختبار التقرير الشخصي PDF
- [ ] التحقق من ظهور النصوص العربية بشكل صحيح

### 3. عرض السجلات
```bash
gcloud run services logs tail altayar-backend --region us-central1
```

## ⚠️ ملاحظات مهمة

1. **خطوط Cairo**: بدونها، النصوص العربية قد تظهر كرموز
2. **الذاكرة**: تأكد من أن Cloud Run لديه 2GB على الأقل
3. **قاعدة البيانات**: تأكد من إعدادات الاتصال
4. **CORS**: تأكد من إعدادات CORS للفرونت إند

## 🆘 استكشاف الأخطاء

### إذا فشل البناء:
- تحقق من `Dockerfile`
- تحقق من السجلات: `docker build --no-cache .`

### إذا فشل النشر:
- تحقق من السجلات: `gcloud run services logs read altayar-backend --region us-central1`
- تحقق من الصلاحيات: `gcloud projects get-iam-policy YOUR_PROJECT_ID`

### إذا لم تعمل PDFs:
- تحقق من وجود خطوط Cairo في الحاوية
- تحقق من السجلات للبحث عن أخطاء الخطوط

---

**بعد إكمال جميع العناصر أعلاه، التطبيق جاهز للنشر!** ✅
