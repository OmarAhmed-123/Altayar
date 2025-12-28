# 🔧 حل مشكلة Billing Account المغلقة

## 🔴 المشكلة

جميع Billing Accounts مغلقة (closed)، لذلك لا يمكن ربط المشروع بأي حساب.

## ✅ الحل: إنشاء Billing Account جديد

### الخطوة 1: إنشاء Billing Account جديد

1. اذهب إلى:
   ```
   https://console.cloud.google.com/billing
   ```

2. اضغط على **"Create account"** (الزر الأزرق)

3. املأ البيانات:
   - **Account name:** `Altayar Billing Account`
   - **Country:** اختر بلدك (مثلاً: Egypt)
   - **Currency:** اختر العملة (مثلاً: USD)

4. اضغط **"Continue"**

### الخطوة 2: إضافة بطاقة ائتمان

1. املأ بيانات البطاقة:
   - Card number
   - Expiration date
   - CVV
   - Name on card
   - Billing address

2. **ملاحظة مهمة:**
   - Google Cloud يعطي **$300 مجاناً** للبداية
   - لن يتم خصم أي شيء حتى تستخدم الخدمات
   - يمكنك تفعيل budget alerts لتجنب التكاليف غير المتوقعة

3. اضغط **"Submit and enable billing"**

### الخطوة 3: ربط Billing Account بالمشروع

1. بعد إنشاء الحساب، اذهب إلى:
   ```
   https://console.cloud.google.com/billing?project=altayarback
   ```

2. اضغط **"Link a billing account"**

3. اختر الحساب الجديد الذي أنشأته

4. اضغط **"Set account"**

### الخطوة 4: التحقق

بعد الربط، يجب أن ترى:
- ✅ Billing account مرتبط
- ✅ Status: Active
- ✅ Project: altayarback

## 🔄 إذا كان لديك حساب موجود لكنه مغلق

### محاولة تفعيل الحساب الموجود:

1. اذهب إلى:
   ```
   https://console.cloud.google.com/billing
   ```

2. ابحث عن الحساب المغلق

3. اضغط على الحساب

4. إذا كان هناك خيار "Reactivate" أو "Enable"، اضغط عليه

5. إذا لم يكن هناك خيار، يجب إنشاء حساب جديد

## ✅ بعد تفعيل Billing

### التحقق من Billing:

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

## 💰 معلومات مهمة

### Free Tier:
- **$300 مجاناً** من Google Cloud
- Cloud Run: أول مليون طلب مجاني شهرياً
- Container Registry: أول 0.5GB مجاني

### التكلفة المتوقعة:
- Cloud SQL (db-f1-micro): ~$7.67/شهر
- Cloud Run: ~$0.40/مليون طلب (بعد Free Tier)
- Container Registry: ~$0.026/GB/شهر (بعد Free Tier)

**إجمالي متوقع: ~$10-20/شهر** (حسب الاستخدام)

## ⚠️ نصائح لتوفير التكلفة

1. **فعّل Budget Alerts:**
   - اذهب إلى: https://console.cloud.google.com/billing/budgets
   - أنشئ budget limit (مثلاً: $20/شهر)
   - فعّل alerts

2. **راقب الاستخدام:**
   - https://console.cloud.google.com/billing

3. **استخدم Free Tier** قدر الإمكان

## 🔗 روابط مباشرة

- **إنشاء Billing Account:** https://console.cloud.google.com/billing/create
- **ربط بالمشروع:** https://console.cloud.google.com/billing?project=altayarback
- **إدارة Billing:** https://console.cloud.google.com/billing

---

**بعد إنشاء وربط Billing Account، شغّل:**
```powershell
.\deploy-fixed.ps1
```

