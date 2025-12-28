# ⚡ حل سريع - تفعيل Billing Account

## 🔴 المشكلة

Billing Accounts موجودة لكنها مغلقة (closed)، والمشروع غير مرتبط.

## ✅ الحل السريع (3 خطوات)

### الخطوة 1: إنشاء Billing Account جديد

**اضغط هنا:**
```
https://console.cloud.google.com/billing/create
```

1. املأ:
   - Account name: `Altayar Billing`
   - Country: اختر بلدك
   - Currency: USD

2. أضف بطاقة ائتمان (Google يعطي $300 مجاناً!)

3. اضغط **"Submit and enable billing"**

### الخطوة 2: ربط الحساب بالمشروع

**اضغط هنا:**
```
https://console.cloud.google.com/billing?project=altayarback
```

1. اضغط **"Link a billing account"**
2. اختر الحساب الجديد
3. اضغط **"Set account"**

### الخطوة 3: شغّل النشر

```powershell
.\deploy-fixed.ps1
```

## 🔄 أو استخدم السكريبتات المساعدة

### التحقق من Billing:

```powershell
.\check-billing.ps1
```

### ربط حساب موجود:

```powershell
.\link-billing-account.ps1
```

## 📚 للمزيد من التفاصيل

- **COMPLETE_BILLING_SETUP.md** - دليل شامل خطوة بخطوة
- **FIX_BILLING_ACCOUNT.md** - حل المشاكل

---

**بعد تفعيل Billing، كل شيء سيعمل!** ✅

