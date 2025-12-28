# ✅ إعداد Billing Account الكامل - خطوة بخطوة

## 🔴 المشكلة الحالية

- جميع Billing Accounts مغلقة (closed)
- المشروع غير مرتبط بأي billing account
- لا يمكن تفعيل APIs بدون billing

## ✅ الحل الكامل

### الخطوة 1: إنشاء Billing Account جديد

#### 1.1 افتح رابط إنشاء الحساب:

```
https://console.cloud.google.com/billing/create
```

أو:
1. اذهب إلى: https://console.cloud.google.com/billing
2. اضغط **"Create account"** (الزر الأزرق)

#### 1.2 املأ بيانات الحساب:

- **Account name:** `Altayar Production Billing`
- **Country/Region:** اختر بلدك
- **Currency:** USD (أو العملة المناسبة)
- اضغط **"Continue"**

#### 1.3 أضف بطاقة ائتمان:

- **Card number:** رقم البطاقة
- **Expiration date:** تاريخ الانتهاء
- **CVV:** الرمز الأمني
- **Name on card:** الاسم على البطاقة
- **Billing address:** عنوان الفوترة

**ملاحظات مهمة:**
- ✅ Google Cloud يعطي **$300 مجاناً** للبداية
- ✅ لن يتم خصم أي شيء حتى تستخدم الخدمات فعلياً
- ✅ يمكنك إلغاء في أي وقت

#### 1.4 أكمل العملية:

- اضغط **"Submit and enable billing"**
- انتظر حتى يتم إنشاء الحساب

### الخطوة 2: ربط Billing Account بالمشروع

#### 2.1 افتح رابط ربط المشروع:

```
https://console.cloud.google.com/billing?project=altayarback
```

#### 2.2 ربط الحساب:

1. اضغط **"Link a billing account"**
2. اختر الحساب الجديد الذي أنشأته
3. اضغط **"Set account"**

#### 2.3 التحقق:

يجب أن ترى:
- ✅ Billing account name
- ✅ Status: Active
- ✅ Project: altayarback

### الخطوة 3: التحقق من Billing (اختياري)

شغّل السكريبت:

```powershell
.\check-billing.ps1
```

أو:

```powershell
.\link-billing-account.ps1
```

### الخطوة 4: النشر

بعد ربط Billing Account، شغّل:

```powershell
.\deploy-fixed.ps1
```

أو:

```powershell
.\deploy-with-source.ps1
```

## 🔄 طريقة بديلة: استخدام Command Line

### 1. عرض Billing Accounts:

```powershell
"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" billing accounts list
```

### 2. ربط حساب موجود:

```powershell
"C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" billing projects link altayarback --billing-account=BILLING_ACCOUNT_ID
```

استبدل `BILLING_ACCOUNT_ID` بـ ID الحساب من الخطوة 1.

## 💰 معلومات التكلفة

### Free Tier (شهرياً):
- **$300 credit** من Google Cloud
- Cloud Run: أول مليون طلب مجاني
- Container Registry: أول 0.5GB مجاني
- Cloud Build: 120 build-minutes مجانية

### التكلفة المتوقعة:
- **Cloud SQL (db-f1-micro):** ~$7.67/شهر
- **Cloud Run:** ~$0.40/مليون طلب (بعد Free Tier)
- **Container Registry:** ~$0.026/GB/شهر

**إجمالي متوقع: ~$10-20/شهر** (حسب الاستخدام)

## ⚠️ نصائح مهمة

### 1. تفعيل Budget Alerts:

1. اذهب إلى: https://console.cloud.google.com/billing/budgets
2. اضغط **"Create budget"**
3. حدد:
   - Budget amount: $20 (أو المبلغ المناسب)
   - Alert threshold: 50%, 90%, 100%
4. اضغط **"Create"**

### 2. مراقبة الاستخدام:

- Dashboard: https://console.cloud.google.com/billing
- Reports: https://console.cloud.google.com/billing/reports

### 3. إعدادات الأمان:

- يمكنك تفعيل "Require approval" للمشتريات الكبيرة
- يمكنك إعداد "Spending limits"

## 🔗 روابط مباشرة

- **إنشاء Billing Account:** https://console.cloud.google.com/billing/create
- **ربط بالمشروع:** https://console.cloud.google.com/billing?project=altayarback
- **إدارة Billing:** https://console.cloud.google.com/billing
- **Budgets:** https://console.cloud.google.com/billing/budgets

## ✅ قائمة التحقق

- [ ] إنشاء Billing Account جديد
- [ ] إضافة بطاقة ائتمان
- [ ] ربط الحساب بالمشروع
- [ ] التحقق من الربط
- [ ] تفعيل Budget Alerts (اختياري)
- [ ] شغّل النشر: `.\deploy-fixed.ps1`

---

**بعد إكمال جميع الخطوات، شغّل:**
```powershell
.\deploy-fixed.ps1
```

**كل شيء سيعمل تلقائياً!** 🎉

