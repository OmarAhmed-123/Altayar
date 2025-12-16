# ALTAYAR API Endpoints Reference
## Quick Reference Guide for All Backend APIs

---

## Base URL
```
Development: http://localhost:5000/api
Production: https://api.altayar.com/api
```

---

## 🔐 Authentication & Users

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | ❌ | - | تسجيل مستخدم جديد |
| POST | `/auth/login` | ❌ | - | تسجيل الدخول |
| GET | `/auth/me` | ✅ | All | معلومات المستخدم الحالي |
| POST | `/auth/logout` | ✅ | All | تسجيل الخروج |
| GET | `/users` | ✅ | Admin | قائمة جميع المستخدمين |
| PUT | `/users/:id/role` | ✅ | Super Admin | تغيير دور المستخدم |
| POST | `/users/manual-gift` | ✅ | Admin/Sales | منح هدايا يدوية |

---

## 💳 Memberships & Subscriptions

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/memberships` | ❌ | - | قائمة الباقات المتاحة |
| GET | `/memberships/:id` | ❌ | - | تفاصيل باقة معينة |
| GET | `/memberships/card/my` | ✅ | Customer | بطاقة عضويتي |
| POST | `/memberships/subscribe` | ✅ | Customer | الاشتراك في باقة |
| GET | `/memberships/:id/download` | ✅ | Customer | تحميل شهادة العضوية PDF |
| PUT | `/memberships/:id` | ✅ | Admin | تعديل باقة |

---

## 📅 Bookings

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/bookings` | ✅ | Customer | حجوزاتي |
| GET | `/bookings/myactivities` | ✅ | Customer | سجل أنشطتي |
| GET | `/bookings/admin` | ✅ | Admin/Sales | جميع الحجوزات |
| POST | `/bookings` | ✅ | Customer | إنشاء حجز جديد |
| GET | `/bookings/:id` | ✅ | All | تفاصيل حجز |
| PUT | `/bookings/:id/status` | ✅ | Admin/Sales | تحديث حالة الحجز |
| DELETE | `/bookings/:id` | ✅ | Admin | حذف حجز |

**Categories:**
- `tour` - جولة سياحية
- `nile_cruise` - رحلة نيلية
- `flight` - حجز طيران
- `hotel` - حجز فندق
- `transfer` - نقل وانتقالات
- `nile_trip` - رحلة نيلية قصيرة
- `general_tour` - جولة عامة
- `custom` - طلب مخصص

**Statuses:**
- `pending` - قيد الانتظار
- `confirmed` - مؤكد
- `paid` - مدفوع
- `completed` - مكتمل
- `cancelled` - ملغي

---

## 🎁 Vouchers & Rewards

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/vouchers/my` | ✅ | Customer | قسائمي |
| GET | `/vouchers/admin` | ✅ | Admin/Sales | جميع القسائم |
| POST | `/vouchers/create` | ✅ | Admin/Sales | منح قسيمة يدوية |
| POST | `/vouchers/:id/redeem` | ✅ | Customer | استخدام قسيمة |

**Voucher Types:**
- `dinner` - عشاء
- `breakfast` - إفطار
- `spa` - سبا
- `gym` - صالة رياضية
- `dental_care` - عناية بالأسنان
- `makeup` - ميكب وتجميل
- `general` - قسيمة عامة

---

## 📦 Packages & Tours

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/packages` | ❌ | - | قائمة الباقات |
| GET | `/packages/:id` | ❌ | - | تفاصيل باقة |
| POST | `/packages` | ✅ | Admin | إضافة باقة |
| PUT | `/packages/:id` | ✅ | Admin | تعديل باقة |

---

## 🗺️ Trip Maker

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/trips` | ✅ | Customer | حفظ رحلة مخصصة |
| GET | `/trips/:id` | ✅ | Customer | تفاصيل الرحلة |
| PUT | `/trips/:id/status` | ✅ | Admin/Sales | تحديث حالة الرحلة |

---

## 💰 Accounting & Wallet

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/transactions` | ✅ | Customer | سجل معاملاتي |
| GET | `/transactions/admin` | ✅ | Admin/Accountant | جميع المعاملات |
| GET | `/wallet/summary` | ✅ | Customer | ملخص المحفظة |
| GET | `/referrals/summary` | ✅ | Customer | ملخص الإحالات |
| POST | `/referrals/invite` | ✅ | Customer | دعوة صديق |

---

## 📝 Content (Blogs & Reels)

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/blogs` | ❌ | - | قائمة المدونات |
| GET | `/blogs/:id` | ❌ | - | تفاصيل مقال |
| POST | `/blogs` | ✅ | Admin | إنشاء مقال |
| POST | `/blogs/:id/like` | ✅ | Customer | إعجاب |
| POST | `/blogs/:id/share` | ✅ | Customer | مشاركة |
| GET | `/comments` | ❌ | - | قائمة التعليقات |
| POST | `/comments` | ✅ | Customer | إضافة تعليق |

**Note:** لجلب الريلز، استخدم `/blogs?isReel=true`

---

## 💬 Chat & Messaging

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/chat` | ✅ | All | قائمة المحادثات |
| GET | `/chat/message/:chatId` | ✅ | All | رسائل محادثة |
| POST | `/chat/message` | ✅ | All | إرسال رسالة |
| POST | `/chat` | ✅ | Customer | بدء محادثة مع موظف دعم |
| POST | `/chat/bot` | ✅ | Customer | بدء محادثة مع شات بوت |
| POST | `/chat/gemini/bot` | ✅ | Customer | إرسال رسالة للشات بوت (Gemini) |
| GET | `/chat/users` | ✅ | Customer | قائمة موظفي الدعم |
| POST | `/chat/message/:chatId/read` | ✅ | All | تعليم الرسائل كمقروءة |

---

## 🔔 Notifications

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/notifications` | ✅ | All | قائمة إشعاراتي |
| GET | `/notifications/unread-count` | ✅ | All | عدد الإشعارات غير المقروءة |
| PUT | `/notifications/:id/read` | ✅ | All | تعليم إشعار كمقروء |
| POST | `/notifications/mark-all-read` | ✅ | All | تعليم الكل كمقروء |
| POST | `/notifications` | ✅ | Admin/Sales | إنشاء إشعار جديد |

---

## 📢 Ads Manager

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/ads` | ❌ | - | الإعلانات النشطة |
| GET | `/ads/admin` | ✅ | Admin/Marketing | جميع الإعلانات |
| POST | `/ads` | ✅ | Admin/Marketing | إنشاء إعلان |
| PUT | `/ads/:id` | ✅ | Admin/Marketing | تعديل إعلان |
| DELETE | `/ads/:id` | ✅ | Admin/Marketing | حذف إعلان |
| POST | `/ads/send/:id` | ✅ | Admin/Marketing | إرسال الإعلان كإشعار |

---

## 💼 Sales & CRM

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/clients` | ✅ | Sales/Admin | قائمة العملاء |
| GET | `/clients/:id/profile` | ✅ | Sales/Admin | بروفايل العميل الكامل |
| GET | `/quotations` | ✅ | Sales/Admin | قائمة عروض الأسعار |
| POST | `/quotations` | ✅ | Sales/Admin | إنشاء عرض سعر |
| PUT | `/quotations/:id` | ✅ | Sales/Admin | تعديل عرض سعر |
| POST | `/quotations/:id/send` | ✅ | Sales/Admin | إرسال عرض السعر للعميل |

---

## 📊 Reports & Analytics

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/reports/payment-history` | ✅ | Admin/Accountant | سجل المدفوعات |
| GET | `/reports/invoice/:bookingId` | ✅ | Admin/Accountant | توليد فاتورة |
| GET | `/reports/user-pdf` | ✅ | Customer | تقرير المستخدم |
| GET | `/reports/sales` | ✅ | Admin | تقرير المبيعات |
| GET | `/dashboard/stats` | ✅ | Admin | إحصائيات لوحة التحكم |
| GET | `/dashboard/recent-activities` | ✅ | Admin | آخر النشاطات |

---

## 🛠️ Admin & Settings

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/rbac/capabilities` | ✅ | Admin | صلاحيات الأدوار |
| GET | `/rbac/matrix` | ✅ | Super Admin | مصفوفة الصلاحيات |
| PUT | `/settings/membership/:id` | ✅ | Admin | تعديل إعدادات باقة |

---

## 📝 Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [...]
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## 🔑 Authentication Headers

جميع الـ Endpoints التي تحتاج Authentication تتطلب:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚡ Rate Limiting

- **Default:** 100 requests / 15 minutes per IP
- **Auth endpoints:** 5 requests / 15 minutes per IP
- **File uploads:** 10 requests / hour per user

---

## 📤 File Upload Specs

**Max File Size:** 10MB  
**Allowed Types:** `jpg`, `jpeg`, `png`, `pdf`, `doc`, `docx`

**Multipart Form Data:**
```
POST /bookings
Content-Type: multipart/form-data

category=tour
title=رحلة القاهرة
files=<image1.jpg>
files=<image2.jpg>
```

---

**Last Updated:** December 2024  
**API Version:** 1.0.0

