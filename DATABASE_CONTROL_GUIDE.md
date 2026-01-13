# دليل التحكم في قاعدة البيانات على Google Cloud

## 📋 نظرة عامة

هذا الدليل يشرح كيفية إيقاف وتشغيل قاعدة البيانات على Google Cloud SQL لتوفير التكاليف عندما لا تكون قيد الاستخدام.

## 🛠️ السكربتات المتاحة

### 1. إيقاف قاعدة البيانات (Stop Database)

**Windows Batch:**
```bash
stop-database.bat
```

**PowerShell:**
```powershell
.\stop-database.ps1
```

### 2. تشغيل قاعدة البيانات (Start Database)

**Windows Batch:**
```bash
start-database.bat
```

**PowerShell:**
```powershell
.\start-database.ps1
```

### 3. التحقق من حالة قاعدة البيانات (Check Status)

**Windows Batch:**
```bash
database-status.bat
```

**PowerShell:**
```powershell
.\database-status.ps1
```

## 📝 معلومات الإعداد

- **Project ID:** `altayar-46d6f`
- **Instance Name:** `altayar-db`
- **Region:** `us-central1`

## ⚠️ ملاحظات مهمة

1. **قبل الإيقاف:**
   - تأكد من عدم وجود تطبيقات متصلة بقاعدة البيانات
   - احفظ أي بيانات مهمة

2. **بعد الإيقاف:**
   - لن يتم خصم أي تكاليف على قاعدة البيانات أثناء التوقف
   - قد يستغرق التشغيل عدة دقائق

3. **بعد التشغيل:**
   - انتظر حتى تصبح الحالة `RUNNABLE` قبل محاولة الاتصال
   - قد يستغرق الأمر من 2-5 دقائق

## 🔧 المتطلبات

- Google Cloud SDK (gcloud CLI) مثبت ومُكوّن
- صلاحيات كافية لإدارة Cloud SQL instances
- تسجيل الدخول إلى Google Cloud: `gcloud auth login`

## 💡 نصائح

- استخدم `database-status.bat` للتحقق من الحالة قبل الإيقاف أو التشغيل
- احفظ السكربتات في مكان يسهل الوصول إليه
- يمكنك إضافة هذه السكربتات إلى PATH للوصول السريع

## 🚀 استخدام سريع

### إيقاف قاعدة البيانات عند الانتهاء من العمل:
```bash
stop-database.bat
```

### تشغيل قاعدة البيانات عند بدء العمل:
```bash
start-database.bat
```

### التحقق من الحالة:
```bash
database-status.bat
```

