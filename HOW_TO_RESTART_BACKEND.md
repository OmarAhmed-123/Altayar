# ✅ كيفية إعادة تشغيل الباك إند على Google Cloud

## 🎯 متى تحتاج إعادة تشغيل الباك إند؟

- ✅ قمت بتعديلات على الكود في الباك إند
- ✅ تريد تحديث السيرفر بالكود الجديد
- ✅ تريد إعادة تشغيل السيرفر مع الحفاظ على جميع الإعدادات

## 🚀 الطريقة السريعة (موصى به)

### استخدام Script:
```bash
restart-backend.bat
```

**هذا الـ script يقوم بـ:**
1. ✅ حفظ جميع الإعدادات الموجودة
2. ✅ بناء Docker image جديد من الكود المحدث
3. ✅ رفع الصورة إلى Container Registry
4. ✅ نشر الصورة إلى Cloud Run
5. ✅ إعادة تشغيل السيرفر تلقائياً
6. ✅ التحقق من أن السيرفر يعمل

## 📋 الطريقة اليدوية

### 1. Build Docker Image
```bash
docker build -t gcr.io/altayar-46d6f/altayar-backend:latest .
```

### 2. Push إلى Container Registry
```bash
docker push gcr.io/altayar-46d6f/altayar-backend:latest
```

### 3. Deploy إلى Cloud Run
```bash
gcloud run deploy altayar-backend `
    --image gcr.io/altayar-46d6f/altayar-backend:latest `
    --region us-central1 `
    --platform managed
```

**ملاحظة:** عند استخدام `gcloud run deploy`، سيتم تلقائياً:
- ✅ إعادة تشغيل السيرفر
- ✅ الحفاظ على جميع environment variables
- ✅ الحفاظ على Cloud SQL connection
- ✅ الحفاظ على جميع الإعدادات

## 🔧 حول PORT

**مهم جداً:** PORT لا يجب تعيينه - Cloud Run يضبطه تلقائياً إلى 8080

- ✅ Cloud Run يضبط PORT=8080 تلقائياً
- ✅ server.js يستخدم `process.env.PORT || 5000` - هذا صحيح
- ✅ السيرفر يعمل على PORT 8080 تلقائياً
- ❌ لا تحاول تعيين PORT في environment variables

## ✅ النتيجة

بعد التنفيذ:
- ✅ السيرفر يعمل بالكود الجديد
- ✅ جميع الإعدادات محفوظة
- ✅ Service URL يبقى كما هو
- ✅ قاعدة البيانات متصلة بشكل صحيح
- ✅ لا تأثير على باقي أجزاء الكود

## 🚀 ابدأ الآن!

**شغل:**
```bash
restart-backend.bat
```

**كل شيء جاهز!** ✅

