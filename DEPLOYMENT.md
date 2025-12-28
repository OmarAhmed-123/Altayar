# دليل النشر على Google Cloud Platform

## المتطلبات الأساسية

1. حساب Google Cloud Platform مع مشروع نشط
2. تثبيت Google Cloud SDK
3. إعدادات قاعدة البيانات (PostgreSQL)

## خطوات النشر

### 1. تثبيت Google Cloud SDK

```bash
# Windows
# قم بتحميل وتثبيت Google Cloud SDK من:
# https://cloud.google.com/sdk/docs/install

# بعد التثبيت، قم بتشغيل:
gcloud init
```

### 2. تسجيل الدخول إلى Google Cloud

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. إعداد قاعدة البيانات

- قم بإنشاء Cloud SQL instance (PostgreSQL)
- احفظ معلومات الاتصال (host, database, user, password)
- أضف متغيرات البيئة في `app.yaml` أو استخدم Secret Manager

### 4. إعداد متغيرات البيئة

قم بتحديث `app.yaml` مع متغيرات البيئة الخاصة بك:

```yaml
env_variables:
  NODE_ENV: production
  PORT: 8080
  DB_HOST: YOUR_DB_HOST
  DB_NAME: YOUR_DB_NAME
  DB_USER: YOUR_DB_USER
  DB_PASSWORD: YOUR_DB_PASSWORD
  JWT_SECRET: YOUR_JWT_SECRET
  # ... متغيرات أخرى
```

### 5. تثبيت خطوط Cairo (مهم للغة العربية)

قبل النشر، تأكد من إضافة خطوط Cairo:

```bash
# قم بتحميل الخطوط يدوياً من:
# https://fonts.google.com/specimen/Cairo
# ثم انسخها إلى assets/fonts/

# أو استخدم السكريبت:
node scripts/downloadCairoFonts.js
```

### 6. النشر

```bash
# من مجلد backend
gcloud app deploy
```

### 7. التحقق من النشر

```bash
# عرض URL التطبيق
gcloud app browse

# عرض السجلات
gcloud app logs tail -s default
```

## ملاحظات مهمة

1. **الخطوط العربية**: تأكد من إضافة خطوط Cairo قبل النشر
2. **قاعدة البيانات**: استخدم Cloud SQL أو قاعدة بيانات خارجية
3. **الملفات الثابتة**: الملفات في `uploads/` و `memberships/` لن تُرفع تلقائياً
4. **الذاكرة**: تأكد من أن حجم الذاكرة كافٍ (0.5 GB كحد أدنى)

## استكشاف الأخطاء

### مشكلة في فتح PDF
- تأكد من أن رؤوس HTTP صحيحة
- تحقق من CORS settings
- تأكد من أن Content-Type هو `application/pdf`

### مشكلة في اللغة العربية
- تأكد من وجود خطوط Cairo في `assets/fonts/`
- تحقق من أن الخطوط تم تحميلها بشكل صحيح

### مشكلة في الاتصال بقاعدة البيانات
- تحقق من إعدادات Cloud SQL
- تأكد من أن IP الخاص بالخادم مسموح به
- تحقق من معلومات الاتصال

## التحديثات المستقبلية

بعد إجراء تغييرات:

```bash
# قم بتشغيل الاختبارات محلياً أولاً
npm test

# ثم انشر
gcloud app deploy
```

