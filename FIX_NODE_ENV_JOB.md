# ✅ إصلاح NODE_ENV في Migration Job

## 🔍 المشكلة

من الـ logs:
```
[MIGRATIONS] ERROR: Migration config not found for environment: ^|p^|r^|o^|d^|u^|c^|t^|i^|o^|n^|...
```

**السبب:** `NODE_ENV` في Job يحتوي على كل environment variables كسلسلة واحدة مع `^|` بين كل حرف!

من الـ YAML:
```yaml
- name: NODE_ENV
  value: ^|p^|r^|o^|d^|u^|c^|t^|i^|o^|n^| ^|P^|O^|R^|T^|=^|8^|0^|8^|0^|...
```

## ✅ الحل

### 1. حذف Job الموجود
```bash
gcloud run jobs delete run-migrations --region us-central1 --quiet
```

### 2. إنشاء Job جديد مع NODE_ENV=production فقط
```bash
execute-all-fixes.bat
```

**الـ script الآن:**
- ✅ يحذف Job الموجود إذا كان موجوداً
- ✅ ينشئ Job جديد مع NODE_ENV=production فقط
- ✅ يضمن أن كل environment variable منفصل

## 📋 التغييرات

### في `execute-all-fixes.ps1`:
1. ✅ حذف Job الموجود قبل إنشاء جديد
2. ✅ تعيين NODE_ENV=production فقط (بدون قيم إضافية)
3. ✅ استبعاد FRONTEND_URL و BACKEND_URL

## 🚀 التنفيذ

```bash
execute-all-fixes.bat
```

**سيقوم بـ:**
1. ✅ حذف Job الموجود (إذا كان موجوداً)
2. ✅ إنشاء Job جديد بشكل صحيح
3. ✅ تنفيذ migrations

## ✅ النتيجة المتوقعة

بعد التنفيذ:
- ✅ NODE_ENV = "production" فقط
- ✅ كل environment variable منفصل
- ✅ Migrations تعمل بشكل صحيح

