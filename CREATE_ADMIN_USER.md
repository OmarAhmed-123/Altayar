# كيفية إنشاء حساب الأدمن

## 📋 معلومات الحساب

- **Email:** `ahmedsaifdin237@gmail.com`
- **Password:** `AAIOH2040%%fF%`
- **Role:** `admin`
- **Name:** `Ahmed Saif Din`

## 🚀 الطرق المتاحة لإنشاء الحساب

### الطريقة 1: استخدام Script (موصى بها)

1. افتح Terminal/Command Prompt
2. انتقل إلى مجلد الباك إند:
   ```bash
   cd E:\Altayar-app\Altayar-app-final\backend
   ```
3. شغّل الـ script:
   ```bash
   npm run create-admin
   ```
   أو مباشرة:
   ```bash
   node scripts/createAdminUser.js
   ```

4. ستظهر رسالة نجاح إذا تم إنشاء الحساب بنجاح.

### الطريقة 2: استخدام API Endpoint

1. تأكد من أن السيرفر يعمل
2. استخدم Postman أو curl لإرسال POST request:
   ```bash
   curl -X POST http://localhost:5000/api/admin/create-admin \
     -H "Content-Type: application/json" \
     -d '{
       "email": "ahmedsaifdin237@gmail.com",
       "password": "AAIOH2040%%fF%",
       "name": "Ahmed Saif Din"
     }'
   ```

   أو من Postman:
   - Method: `POST`
   - URL: `http://localhost:5000/api/admin/create-admin`
   - Headers: `Content-Type: application/json`
   - Body (JSON):
     ```json
     {
       "email": "ahmedsaifdin237@gmail.com",
       "password": "AAIOH2040%%fF%",
       "name": "Ahmed Saif Din"
     }
     ```

### الطريقة 3: إضافة يدوية في قاعدة البيانات

إذا كنت تريد إضافة الحساب مباشرة في قاعدة البيانات:

```sql
-- أولاً، احسب hash لكلمة المرور باستخدام bcrypt
-- يمكنك استخدام Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('AAIOH2040%%fF%', 10);

-- ثم أضف المستخدم:
INSERT INTO users (email, password, name, role, points, cashback, created_at, updated_at)
VALUES (
  'ahmedsaifdin237@gmail.com',
  '$2a$10$...', -- hash كلمة المرور
  'Ahmed Saif Din',
  'admin',
  0,
  0,
  NOW(),
  NOW()
);
```

## ✅ التحقق من إنشاء الحساب

بعد إنشاء الحساب، يمكنك التحقق من خلال:

1. **تسجيل الدخول:**
   - Email: `ahmedsaifdin237@gmail.com`
   - Password: `AAIOH2040%%fF%`

2. **التحقق من Role:**
   - بعد تسجيل الدخول، تحقق من أن `role` في الـ response هو `admin`

3. **الوصول إلى لوحة الأدمن:**
   - في التطبيق، افتح Drawer Menu
   - اضغط على "لوحة الأدمن"
   - يجب أن تتمكن من الوصول إليها

## 🔒 ملاحظات الأمان

1. **في Production:**
   - يجب حماية endpoint `/api/admin/create-admin`
   - أضف middleware للتحقق من أن الطلب يأتي من مصدر موثوق
   - أو احذف الـ endpoint بعد إنشاء الحساب الأول

2. **تغيير كلمة المرور:**
   - بعد أول تسجيل دخول، يُنصح بتغيير كلمة المرور
   - يمكن استخدام endpoint `/api/users/profile` لتحديث كلمة المرور

## 📁 الملفات المضافة/المعدلة

1. **`scripts/createAdminUser.js`** - Script لإنشاء الأدمن
2. **`controllers/adminController.js`** - Controller لإنشاء الأدمن
3. **`routes/admin.js`** - Routes للأدمن
4. **`server.js`** - تم إضافة route `/api/admin`
5. **`package.json`** - تم إضافة script `create-admin`

## 🐛 حل المشاكل

### المشكلة: "User already exists"
- الحل: الـ script سيحاول تحديث المستخدم إلى admin إذا كان موجوداً

### المشكلة: "Database connection error"
- الحل: تأكد من أن قاعدة البيانات تعمل وأن `.env` يحتوي على معلومات الاتصال الصحيحة

### المشكلة: "bcrypt error"
- الحل: تأكد من تثبيت `bcryptjs`:
  ```bash
  npm install bcryptjs
  ```

## 📞 الدعم

إذا واجهت أي مشاكل، تأكد من:
1. أن قاعدة البيانات متصلة
2. أن جميع الـ dependencies مثبتة
3. أن ملف `.env` موجود ويحتوي على معلومات قاعدة البيانات

