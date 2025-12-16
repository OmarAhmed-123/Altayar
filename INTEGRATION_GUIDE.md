# دليل التكامل الشامل - ALTAYAR Platform
## Frontend (Flutter) + Backend (Node.js/Express)

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [متطلبات التشغيل](#متطلبات-التشغيل)
3. [إعداد Backend](#إعداد-backend)
4. [إعداد Frontend](#إعداد-frontend)
5. [توثيق APIs](#توثيق-apis)
6. [الأمان والتوثيق](#الأمان-والتوثيق)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## 🎯 نظرة عامة

منصة ALTAYAR هي نظام متكامل لإدارة الولاء والسياحة يتكون من:

- **Backend**: Node.js + Express + PostgreSQL (المسار: `E:\Altayar-app\Altayar-app-final\backend`)
- **Frontend**: Flutter/Dart (المسار: `E:\AltayarFlutter\Altayar`)

### الموديولات المنجزة

| الموديول | الوصف | APIs الرئيسية |
|----------|-------|---------------|
| **Authentication** | تسجيل الدخول والتوثيق | `/auth/login`, `/auth/register`, `/auth/me` |
| **Memberships** | إدارة العضويات والباقات | `/memberships`, `/memberships/subscribe` |
| **User Management** | إدارة المستخدمين والصلاحيات | `/users`, `/rbac` |
| **Bookings** | نظام الحجوزات الشامل | `/bookings`, `/bookings/admin` |
| **Packages** | الباقات والعروض السياحية | `/packages` |
| **Trip Maker** | صانع الرحلات التفاعلي | `/trips` |
| **Activities** | سجل الأنشطة والطلبات | `/bookings/myactivities` |
| **Vouchers** | نظام القسائم والمكافآت | `/vouchers`, `/vouchers/admin` |
| **Sales & CRM** | أدوات المبيعات | `/clients`, `/quotations`, `/notifications` |
| **Accounting** | المحفظة والمعاملات المالية | `/transactions`, `/referrals` |
| **Content** | المدونة والريلز | `/blogs`, `/comments` |
| **Chat** | نظام الدردشة + Chatbot | `/chat`, `/chat/gemini/bot` |
| **Notifications** | مركز الإشعارات | `/notifications` |
| **Ads Manager** | إدارة الإعلانات | `/ads` |
| **Reports** | التقارير والفواتير | `/reports/payment-history`, `/reports/invoice/:id` |
| **Dashboard** | لوحة التحكم | `/dashboard/stats` |

---

## ⚙️ متطلبات التشغيل

### Backend Requirements
```json
{
  "node": ">=18.0.0",
  "postgresql": ">=14.0",
  "npm": ">=9.0.0"
}
```

### Frontend Requirements
```yaml
flutter: ">=3.24.0"
dart: ">=3.4.0"
```

---

## 🚀 إعداد Backend

### 1. تثبيت Dependencies

```bash
cd E:\Altayar-app\Altayar-app-final\backend
npm install
```

### 2. إعداد قاعدة البيانات

```bash
# تشغيل الـ Migrations
npm run migrate

# (اختياري) تشغيل الـ Seeds
npm run seed
```

### 3. ملف البيئة `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/altayar

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRATION=7d

# Fawaterak Payment
FAWATERAK_API_KEY=your-fawaterak-key
FAWATERAK_WEBHOOK_SECRET=your-webhook-secret

# Gemini Chatbot
GEMINI_API_KEY=AIzaSyC6j_T4LqLAqmDTAx2HByxyJRN_yFS6Gjk

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 4. تشغيل السيرفر

```bash
npm start
# أو للتطوير مع Hot Reload:
npm run dev
```

السيرفر سيعمل على: `http://localhost:5000`

---

## 📱 إعداد Frontend

### 1. تثبيت Dependencies

```bash
cd E:\AltayarFlutter\Altayar
flutter pub get
```

### 2. تكوين API Base URL

#### للـ Development (localhost)
```bash
flutter run --dart-define=API_BASE_URL=http://localhost:5000/api
```

#### للـ Android Emulator
```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api
```

#### للـ Production
```bash
flutter run --dart-define=API_BASE_URL=https://api.altayar.com/api
```

### 3. تشغيل التطبيق

```bash
# Android
flutter run -d <device-id>

# iOS
flutter run -d <device-id>

# Web (للاختبار فقط)
flutter run -d chrome
```

---

## 📚 توثيق APIs

### 🔐 Authentication

#### POST `/auth/register`
```json
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "email": "ahmed@example.com",
  "password": "SecurePass123!",
  "phone": "+201234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "ahmed@example.com", ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

#### POST `/auth/login`
```json
{
  "email": "ahmed@example.com",
  "password": "SecurePass123!"
}
```

#### GET `/auth/me`
**Headers:** `Authorization: Bearer <token>`

---

### 💳 Memberships

#### GET `/memberships`
احصل على قائمة جميع الباقات المتاحة.

#### GET `/memberships/card/my`
**Headers:** `Authorization: Bearer <token>`

احصل على بطاقة العضوية الخاصة بالمستخدم الحالي.

#### POST `/memberships/subscribe`
```json
{
  "membershipId": 3,
  "paymentMethod": "fawaterak"
}
```

---

### 📅 Bookings

#### GET `/bookings/admin`
**Role:** Admin/Sales
احصل على جميع الحجوزات (للإدارة).

#### GET `/bookings/myactivities`
**Headers:** `Authorization: Bearer <token>`

احصل على حجوزات المستخدم الحالي فقط.

#### POST `/bookings`
```json
{
  "category": "tour",
  "title": "رحلة القاهرة - الأقصر",
  "participants": 2,
  "travelDate": "2024-01-15",
  "notes": "يُفضل فندق 5 نجوم"
}
```

**مع ملفات (multipart/form-data):**
```
POST /bookings
Content-Type: multipart/form-data

category=tour
title=رحلة القاهرة
participants=2
files=<image1.jpg>
files=<image2.jpg>
```

#### PUT `/bookings/:id/status`
```json
{
  "status": "confirmed"
}
```

---

### 🎁 Vouchers

#### GET `/vouchers/my`
**Headers:** `Authorization: Bearer <token>`

#### GET `/vouchers/admin`
**Role:** Admin/Sales

#### POST `/vouchers/create`
**Role:** Admin/Sales
```json
{
  "userId": 5,
  "type": "spa",
  "value": 500,
  "expiresAt": "2024-12-31"
}
```

#### POST `/vouchers/:id/redeem`
**Headers:** `Authorization: Bearer <token>`

---

### 💬 Chat & Notifications

#### GET `/chat`
**Headers:** `Authorization: Bearer <token>`

احصل على قائمة المحادثات.

#### GET `/chat/message/:chatId`
احصل على الرسائل داخل محادثة معينة.

#### POST `/chat/message`
```json
{
  "chatId": 12,
  "content": "مرحباً، كيف يمكنني المساعدة؟"
}
```

**مع ملف:**
```
POST /chat/message
Content-Type: multipart/form-data

chatId=12
content=هنا الملف
file=<document.pdf>
```

#### POST `/chat/bot`
إنشاء محادثة جديدة مع الشات بوت.

#### POST `/chat/gemini/bot`
```json
{
  "chatId": 15,
  "message": "ما هي أفضل الباقات السياحية؟"
}
```

#### GET `/notifications`
**Headers:** `Authorization: Bearer <token>`

#### GET `/notifications/unread-count`
```json
{ "unreadCount": 5 }
```

#### PUT `/notifications/:id/read`

---

### 📊 Reports

#### GET `/reports/payment-history`
**Role:** Admin/Accountant

#### GET `/reports/invoice/:bookingId`
**Role:** Admin/Accountant

يعيد رابط PDF للفاتورة.

#### GET `/reports/user-pdf`
**Headers:** `Authorization: Bearer <token>`

تقرير مالي شامل.

---

### 🎯 Sales & CRM

#### GET `/clients`
**Role:** Sales/Admin

قائمة العملاء مع بياناتهم.

#### GET `/clients/:id/profile`
بروفايل العميل الكامل (عضوية، نقاط، حجوزات).

#### POST `/quotations`
```json
{
  "customerId": 10,
  "items": [
    { "description": "جولة القاهرة", "quantity": 2, "unitPrice": 500 }
  ],
  "discount": 50,
  "validityDays": 7,
  "notes": "عرض خاص"
}
```

---

## 🔒 الأمان والتوثيق

### JWT Token Flow

1. المستخدم يسجل الدخول عبر `/auth/login`
2. Backend يرجع `token`
3. Frontend يحفظ الـ Token في `SharedPreferences`
4. Frontend يرسل الـ Token في كل طلب:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
   ```
5. Backend Middleware يتحقق من الـ Token ويستخرج `userId` و `role`

### Role-Based Access Control (RBAC)

| الدور | الصلاحيات |
|-------|-----------|
| **customer** | الوصول للحجوزات الخاصة، العضويات، المحفظة |
| **sales** | إدارة العملاء، إنشاء عروض أسعار، منح قسائم |
| **admin** | الوصول لجميع الموديولات، التقارير، الإعدادات |
| **super_admin** | كامل الصلاحيات + إدارة المستخدمين |

### في Frontend (Flutter)

```dart
final authProvider = context.read<AuthProvider>();
final isAdmin = authProvider.currentUser?.isAdmin ?? false;

if (isAdmin) {
  // عرض واجهة الأدمن
}
```

### في Backend (Node.js)

```javascript
// Middleware للتحقق من الصلاحيات
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

// استخدام:
router.get('/admin/users', authenticate, requireRole(['admin', 'super_admin']), ...)
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: لا يمكن الاتصال بالـ Backend من Android Emulator

**الحل:**
```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5000/api
```

### مشكلة: 401 Unauthorized

**السبب:** Token منتهي أو غير صحيح.

**الحل:**
1. تحقق من أن الـ Token محفوظ في `SharedPreferences`
2. تأكد من إرسال الـ Header بشكل صحيح
3. جرب تسجيل الدخول مرة أخرى

### مشكلة: CORS Error

**الحل:** تأكد من إضافة CORS Middleware في Backend:

```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:3000', 'http://10.0.2.2:5000'],
  credentials: true
}));
```

### مشكلة: File Upload يفشل

**تحقق من:**
1. استخدام `multipart/form-data` في Frontend
2. حجم الملف لا يتجاوز الحد المسموح (10MB عادةً)
3. Backend Middleware `multer` مفعّل بشكل صحيح

---

## 📞 الدعم

في حالة وجود مشاكل تقنية:

1. تحقق من Logs السيرفر: `npm run dev` (Backend)
2. تحقق من Console التطبيق في Flutter
3. استخدم Postman لاختبار APIs مباشرة
4. راجع ملف `.env` وتأكد من جميع المتغيرات

---

## ✅ Checklist قبل الإطلاق

- [ ] جميع Environment Variables محددة بشكل صحيح
- [ ] قاعدة البيانات تحتوي على البيانات الأساسية (Seeds)
- [ ] تم اختبار جميع APIs باستخدام Postman/Thunder Client
- [ ] Flutter app يتصل بالـ Backend بنجاح
- [ ] تم اختبار Login/Logout
- [ ] تم اختبار رفع الملفات والصور
- [ ] Notifications تعمل بشكل صحيح
- [ ] Payment Gateway (Fawaterak) متكامل ويعمل
- [ ] Chatbot (Gemini) يستجيب بشكل صحيح
- [ ] التقارير والفواتير تُولّد بدون أخطاء

---

**تم تطوير هذا النظام بمعايير عالية من الأمان والاحترافية.**  
**جميع الموديولات جاهزة للإنتاج والتشغيل الفعلي. ✨**

