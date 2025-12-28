# 🔴 مهم جداً: تفعيل Billing Account

## المشكلة

المشروع يحتاج إلى تفعيل **Billing Account** لاستخدام خدمات Google Cloud.

## ✅ الحل السريع

### الخطوة 1: افتح Google Cloud Console

اذهب إلى:
```
https://console.cloud.google.com/billing?project=altayarback
```

أو:
```
https://console.cloud.google.com/home/dashboard?project=altayarback
```

### الخطوة 2: تفعيل Billing

1. في القائمة الجانبية، اختر **"Billing"**
2. إذا لم يكن لديك Billing Account:
   - اضغط **"Link a billing account"**
   - اختر **"Create billing account"**
   - املأ البيانات المطلوبة
   - أضف بطاقة ائتمان (Google Cloud يعطي $300 مجاناً للبداية)
3. إذا كان لديك Billing Account:
   - اضغط **"Link a billing account"**
   - اختر الحساب الموجود

### الخطوة 3: التحقق

بعد تفعيل Billing، تحقق من:
```
https://console.cloud.google.com/billing?project=altayarback
```

يجب أن ترى Billing Account مرتبط بالمشروع.

## 💰 التكلفة المتوقعة

- **Cloud Run:** ~$0.40/مليون طلب (أول مليون مجاني)
- **Cloud SQL (db-f1-micro):** ~$7.67/شهر
- **Container Registry:** ~$0.026/GB/شهر (أول 0.5GB مجاني)

**Google Cloud يعطي $300 مجاناً للبداية!**

## ⚠️ ملاحظات مهمة

1. **Free Tier:** Google Cloud يوفر Free Tier لمعظم الخدمات
2. **Alerts:** يمكنك تفعيل alerts لتجنب التكاليف غير المتوقعة
3. **Budget:** يمكنك تحديد budget limit

## ✅ بعد تفعيل Billing

ارجع إلى السكريبت وشغّله مرة أخرى:

```powershell
.\deploy-fixed.ps1
```

---

**رابط مباشر:**
https://console.cloud.google.com/billing?project=altayarback

