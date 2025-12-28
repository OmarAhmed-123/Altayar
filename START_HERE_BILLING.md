# 🚨 ابدأ من هنا - تفعيل Billing أولاً!

## 🔴 المشكلة

المشروع يحتاج إلى **تفعيل Billing Account** قبل النشر.

## ✅ الحل السريع (5 دقائق)

### الخطوة 1: افتح رابط Billing

**اضغط هنا:**
```
https://console.cloud.google.com/billing?project=altayarback
```

### الخطوة 2: إنشاء/ربط Billing Account

1. إذا لم يكن لديك حساب:
   - اضغط **"Create billing account"**
   - املأ البيانات
   - أضف بطاقة ائتمان (Google يعطي $300 مجاناً!)

2. إذا كان لديك حساب:
   - اضغط **"Link a billing account"**
   - اختر الحساب

### الخطوة 3: التحقق

بعد الربط، يجب أن ترى:
- ✅ Billing account مرتبط
- ✅ Status: Active

### الخطوة 4: شغّل النشر مرة أخرى

```powershell
.\deploy-fixed.ps1
```

## 💰 التكلفة

- **Google Cloud يعطي $300 مجاناً للبداية!**
- التكلفة المتوقعة: ~$10-20/شهر (حسب الاستخدام)
- يمكنك تفعيل budget alerts لتجنب التكاليف غير المتوقعة

## 📚 للمزيد من التفاصيل

- **BILLING_REQUIRED.md** - دليل شامل
- **ENABLE_BILLING.md** - خطوات مفصلة

---

**بعد تفعيل Billing، شغّل:**
```powershell
.\deploy-fixed.ps1
```

