# ⚡ إنشاء حساب الأدمن بسرعة

## 🎯 معلومات الحساب

- **Email:** `ahmedsaifdin237@gmail.com`
- **Password:** `AAIOH2040%%fF%`
- **Role:** `admin`

## 🚀 الطريقة السريعة

### 1. افتح Terminal في مجلد الباك إند:
```bash
cd E:\Altayar-app\Altayar-app-final\backend
```

### 2. شغّل الأمر:
```bash
npm run create-admin
```

### 3. انتظر رسالة النجاح:
```
✅ Admin user created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User ID: 1
Email: ahmedsaifdin237@gmail.com
Name: Ahmed Saif Din
Role: admin
Password: AAIOH2040%%fF%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You can now login with these credentials!
```

## ✅ تم! الآن يمكنك:

1. **تسجيل الدخول في التطبيق:**
   - Email: `ahmedsaifdin237@gmail.com`
   - Password: `AAIOH2040%%fF%`

2. **الوصول إلى لوحة الأدمن:**
   - افتح Drawer Menu
   - اضغط على "لوحة الأدمن"

## 📝 ملاحظات

- إذا كان المستخدم موجوداً بالفعل، سيتم تحديثه إلى admin
- كلمة المرور مشفرة باستخدام bcrypt
- يمكنك تغيير كلمة المرور بعد تسجيل الدخول

## 🔧 طرق أخرى

### استخدام API:
```bash
curl -X POST http://localhost:5000/api/admin/create-admin
```

### قراءة المزيد:
راجع ملف `CREATE_ADMIN_USER.md` للتفاصيل الكاملة

