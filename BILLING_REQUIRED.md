# 🔴 تفعيل Billing Account - مطلوب للنشر

## المشكلة

Google Cloud يتطلب تفعيل **Billing Account** لاستخدام:
- Cloud Run
- Cloud SQL
- Container Registry
- Cloud Build

## ✅ الحل (5 دقائق)

### الخطوة 1: افتح رابط Billing

```
https://console.cloud.google.com/billing?project=altayarback
```

أو من Google Cloud Console:
1. اذهب إلى: https://console.cloud.google.com/home/dashboard?project=altayarback
2. من القائمة الجانبية: **Billing**

### الخطوة 2: إنشاء/ربط Billing Account

#### إذا لم يكن لديك Billing Account:

1. اضغط **"Create billing account"**
2. املأ البيانات:
   - Account name: `Altayar Billing`
   - Country: اختر بلدك
   - Currency: اختر العملة
3. أضف بطاقة ائتمان:
   - Google Cloud يعطي **$300 مجاناً** للبداية
   - لن يتم خصم أي شيء حتى تستخدم الخدمات
4. اضغط **"Submit and enable billing"**

#### إذا كان لديك Billing Account:

1. اضغط **"Link a billing account"**
2. اختر الحساب الموجود
3. اضغط **"Set account"**

### الخطوة 3: التحقق

بعد الربط، يجب أن ترى:
- ✅ Billing account مرتبط
- ✅ Status: Active

## 💰 التكلفة المتوقعة

### Free Tier (شهرياً):
- Cloud Run: أول مليون طلب مجاني
- Cloud SQL: لا يوجد free tier (لكن db-f1-micro رخيص)
- Container Registry: أول 0.5GB مجاني

### التكلفة الفعلية المتوقعة:
- **Cloud Run:** ~$0.40/مليون طلب
- **Cloud SQL (db-f1-micro):** ~$7.67/شهر
- **Container Registry:** ~$0.026/GB/شهر

**ملاحظة:** Google Cloud يعطي $300 مجاناً للبداية!

## ⚠️ نصائح لتوفير التكلفة

1. **استخدم Free Tier** قدر الإمكان
2. **فعّل Budget Alerts:**
   - اذهب إلى: https://console.cloud.google.com/billing/budgets
   - أنشئ budget limit
   - فعّل alerts
3. **راقب الاستخدام:**
   - https://console.cloud.google.com/billing

## ✅ بعد تفعيل Billing

### تحقق من Billing:

```powershell
.\check-billing.ps1
```

### ثم شغّل النشر:

```powershell
.\deploy-fixed.ps1
```

أو:

```powershell
.\deploy-with-source.ps1
```

## 🔗 روابط مفيدة

- **Billing Console:** https://console.cloud.google.com/billing?project=altayarback
- **Free Tier:** https://cloud.google.com/free
- **Pricing Calculator:** https://cloud.google.com/products/calculator

---

**بعد تفعيل Billing، ارجع وشغّل السكريبت مرة أخرى!** ✅

