# ✅ دليل إعادة تشغيل الباك إند على Google Cloud

## 🎯 متى تستخدم هذا الـ Script؟

استخدم `restart-backend.bat` عندما:
- ✅ قمت بتعديلات على الكود في الباك إند
- ✅ تريد تحديث السيرفر بالكود الجديد
- ✅ تريد إعادة تشغيل السيرفر مع الحفاظ على جميع الإعدادات

## 🚀 الاستخدام

### الطريقة 1: استخدام Script (موصى به)
```bash
restart-backend.bat
```

### الطريقة 2: تنفيذ يدوي
```bash
restart-backend.ps1
```

## 📋 ما يقوم به الـ Script

### 1. ✅ الحفاظ على الإعدادات
- يحفظ جميع environment variables الموجودة
- يحفظ إعدادات Cloud SQL
- يحفظ إعدادات Memory, CPU, Timeout
- يحفظ إعدادات Min/Max instances

### 2. ✅ Build Docker Image
- يبني صورة Docker جديدة من الكود المحدث
- يحاول مع `--no-cache` إذا فشل البناء الأول

### 3. ✅ Push إلى Container Registry
- يرفع الصورة إلى Google Container Registry
- يستخدم نفس اسم الصورة

### 4. ✅ Deploy إلى Cloud Run
- ينشر الصورة الجديدة إلى Cloud Run
- يحافظ على جميع الإعدادات الموجودة
- يقوم تلقائياً بإعادة تشغيل السيرفر

### 5. ✅ التحقق من النتائج
- ينتظر 30 ثانية لبدء السيرفر
- يختبر health endpoint
- يعرض Service URL

## 🔧 حول PORT

**مهم جداً:** PORT لا يجب تعيينه - Cloud Run يضبطه تلقائياً إلى 8080

- ✅ Cloud Run يضبط PORT=8080 تلقائياً
- ✅ server.js يستخدم `process.env.PORT || 5000` - هذا صحيح
- ✅ السيرفر يعمل على PORT 8080 تلقائياً
- ❌ لا تحاول تعيين PORT في environment variables

## 📝 ملاحظات مهمة

### 1. Environment Variables
- ✅ جميع environment variables الموجودة يتم الحفاظ عليها
- ✅ PORT يتم استبعاده (Cloud Run يضبطه تلقائياً)
- ✅ لا يتم تغيير أي إعدادات

### 2. Cloud SQL
- ✅ Cloud SQL connection يتم الحفاظ عليه
- ✅ لا حاجة لإعادة الربط

### 3. Service Settings
- ✅ Memory, CPU, Timeout يتم الحفاظ عليها
- ✅ Min/Max instances يتم الحفاظ عليها

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

**سيقوم بـ:**
1. ✅ بناء Docker image جديد
2. ✅ رفع الصورة إلى Container Registry
3. ✅ نشر الصورة إلى Cloud Run
4. ✅ إعادة تشغيل السيرفر تلقائياً
5. ✅ التحقق من أن السيرفر يعمل

**كل شيء جاهز!** ✅

