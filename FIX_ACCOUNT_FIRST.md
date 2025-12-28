# ⚠️ مهم جداً - تغيير الحساب أولاً!

## 🔴 المشكلة

أنت مسجل دخول بحساب: `altayarvipcom@gmail.com`  
لكن المشروع مملوك لحساب: `dipencilcom@gmail.com`

**لذلك لا يمكنك الوصول للمشروع!**

---

## ✅ الحل - خطوتان فقط

### الخطوة 1: تغيير الحساب

**شغّل هذا الملف أولاً:**
```
SWITCH_ACCOUNT.bat
```

**أو من PowerShell:**
```powershell
.\switch-account.ps1
```

**أو يدوياً:**
```bash
gcloud auth login dipencilcom@gmail.com
gcloud config set project altayar-46d6f
```

---

### الخطوة 2: النشر

**بعد تغيير الحساب، شغّل:**
```
DEPLOY_NOW.bat
```

---

## 📋 ما سيحدث

### عند تشغيل `SWITCH_ACCOUNT.bat`:

1. ✅ فتح نافذة المتصفح
2. ✅ تسجيل الدخول بـ `dipencilcom@gmail.com`
3. ✅ تعيين المشروع: `altayar-46d6f`
4. ✅ التحقق من الإعدادات

### عند تشغيل `DEPLOY_NOW.bat`:

1. ✅ التحقق من الحساب الصحيح
2. ✅ ربط Billing Account
3. ✅ تفعيل APIs
4. ✅ إنشاء قاعدة البيانات
5. ✅ بناء Docker image
6. ✅ النشر على Cloud Run

---

## 🔍 التحقق من الحساب

**للتحقق من الحساب الحالي:**
```bash
gcloud config get-value account
```

**يجب أن يكون:** `dipencilcom@gmail.com`

**للتحقق من المشروع:**
```bash
gcloud config get-value project
```

**يجب أن يكون:** `altayar-46d6f`

---

## 🆘 إذا لم يعمل

### 1. تسجيل الخروج من جميع الحسابات:
```bash
gcloud auth revoke --all
```

### 2. تسجيل الدخول بالحساب الصحيح:
```bash
gcloud auth login dipencilcom@gmail.com
```

### 3. تعيين المشروع:
```bash
gcloud config set project altayar-46d6f
```

### 4. التحقق:
```bash
gcloud projects describe altayar-46d6f
```

---

## ✅ بعد التحقق

**شغّل:**
```
DEPLOY_NOW.bat
```

**كل شيء سيعمل الآن!** 🚀

