# دليل تشغيل التطبيق على الويب - Quick Start

## الخطوات الكاملة لتشغيل التطبيق على الويب

### المتطلبات الأساسية
1. Node.js 18+ مثبت
2. Flutter SDK مثبت
3. PostgreSQL مثبت ومشغل
4. حساب Firebase مع Dynamic Links مفعل

---

## الخطوة 1: إعداد Backend

### 1.1 الانتقال لمجلد Backend
```bash
cd E:\Altayar-app\Altayar-app-final\backend
```

### 1.2 تثبيت المكتبات
```bash
npm install
```

### 1.3 إعداد ملف البيئة
```bash
# انسخ ملف env.example إلى .env
copy env.example .env
```

### 1.4 تعديل ملف .env
افتح ملف `.env` وعدل القيم التالية:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Backend URL (استخدم IP جهازك)
BACKEND_URL=http://192.168.1.4:5000

# Deep Links & Firebase Dynamic Links Configuration
DEEP_LINK_BASE_URL=https://altayar.com
LANDING_PAGE_URL=https://altayar.com
FIREBASE_PROJECT_ID=altayar-46d6f
FIREBASE_DYNAMIC_LINKS_DOMAIN=altayar.page.link
# احصل على API Key من Firebase Console > Project Settings > General
FIREBASE_API_KEY=your-firebase-api-key
ANDROID_PACKAGE_NAME=com.example.Altayar
IOS_BUNDLE_ID=com.example.Altayar
```

### 1.5 تشغيل Migrations
```bash
npm run migrate:latest
```

### 1.6 تشغيل Backend
```bash
npm run dev
```

✅ **التحقق**: افتح المتصفح على `http://localhost:5000/api/health` يجب أن ترى رسالة نجاح

---

## الخطوة 2: إعداد Flutter App

### 2.1 الانتقال لمجلد Flutter
```bash
cd E:\AltayarFlutter\Altayar
```

### 2.2 تثبيت المكتبات
```bash
flutter pub get
```

### 2.3 إعداد Firebase (اختياري - للـ Dynamic Links)
```bash
# تثبيت FlutterFire CLI
dart pub global activate flutterfire_cli

# إعداد Firebase
flutterfire configure
```

**ملاحظة**: إذا لم تقم بإعداد Firebase، سيتم استخدام Deep Links العادية بدون Dynamic Links

---

## الخطوة 3: بناء التطبيق للويب

### 3.1 بناء التطبيق
```bash
flutter build web --release
```

### 3.2 التحقق من البناء
الملفات المبنية ستكون في: `build/web/`

---

## الخطوة 4: نشر التطبيق على الويب

### الخيار 1: Firebase Hosting (موصى به)

#### 4.1 تثبيت Firebase CLI
```bash
npm install -g firebase-tools
```

#### 4.2 تسجيل الدخول
```bash
firebase login
```

#### 4.3 تهيئة Firebase Hosting
```bash
firebase init hosting
```

**اختر:**
- Use an existing project: `altayar-46d6f`
- Public directory: `build/web`
- Configure as single-page app: `Yes`
- Set up automatic builds: `No` (يمكنك تفعيله لاحقاً)

#### 4.4 النشر
```bash
flutter build web --release
firebase deploy --only hosting
```

✅ **النتيجة**: ستحصل على رابط مثل `https://altayar-46d6f.web.app`

---

### الخيار 2: Netlify

#### 4.1 تثبيت Netlify CLI
```bash
npm install -g netlify-cli
```

#### 4.2 بناء التطبيق
```bash
flutter build web --release
```

#### 4.3 النشر
```bash
netlify deploy --prod --dir=build/web
```

---

### الخيار 3: Vercel

#### 4.1 تثبيت Vercel CLI
```bash
npm install -g vercel
```

#### 4.2 بناء التطبيق
```bash
flutter build web --release
```

#### 4.3 النشر
```bash
vercel --prod build/web
```

---

## الخطوة 5: ربط Domain (اختياري)

### 5.1 في Firebase Hosting
1. اذهب إلى Firebase Console > Hosting
2. اضغط على "Add custom domain"
3. أدخل اسم النطاق (مثل: altayar.com)
4. اتبع التعليمات لإضافة DNS records

### 5.2 تحديث Backend .env
```env
DEEP_LINK_BASE_URL=https://altayar.com
LANDING_PAGE_URL=https://altayar.com
```

---

## الخطوة 6: اختبار التطبيق

### 6.1 اختبار Backend
```bash
curl http://localhost:5000/api/health
```

### 6.2 اختبار Deep Links
```bash
# إنشاء Deep Link
curl -X POST http://localhost:5000/api/deep-links/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "package",
    "id": "123",
    "title": "Test Package"
  }'
```

### 6.3 اختبار التطبيق على الويب
1. افتح الرابط المنشور (مثل: `https://altayar-46d6f.web.app`)
2. تأكد من أن التطبيق يعمل بشكل صحيح
3. جرب Deep Links من الموبايل

---

## استكشاف الأخطاء

### المشكلة: Backend لا يعمل
- ✅ تحقق من أن PostgreSQL يعمل
- ✅ تحقق من ملف `.env` وصحة البيانات
- ✅ تحقق من المنفذ 5000 غير مستخدم

### المشكلة: Flutter build فشل
- ✅ تحقق من `flutter doctor` للتأكد من التثبيت الصحيح
- ✅ جرب `flutter clean` ثم `flutter pub get`

### المشكلة: Firebase Dynamic Links لا تعمل
- ✅ تحقق من `FIREBASE_API_KEY` في ملف `.env`
- ✅ تحقق من إعدادات Dynamic Links في Firebase Console
- ✅ تأكد من أن Domain صحيح

### المشكلة: CORS errors
- ✅ تحقق من `FRONTEND_URL` في ملف `.env`
- ✅ تأكد من أن Backend يسمح بالـ origins الصحيحة

---

## الخطوات السريعة (ملخص)

```bash
# Backend
cd E:\Altayar-app\Altayar-app-final\backend
npm install
copy env.example .env
# عدل ملف .env
npm run migrate:latest
npm run dev

# Flutter
cd E:\AltayarFlutter\Altayar
flutter pub get
flutter build web --release

# Deploy
firebase deploy --only hosting
```

---

## روابط مفيدة

- Firebase Console: https://console.firebase.google.com/project/altayar-46d6f
- Dynamic Links: https://console.firebase.google.com/project/altayar-46d6f/durablelinks
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

---

## ملاحظات مهمة

1. **في التطوير**: استخدم `http://192.168.1.4:5000` للـ Backend URL
2. **في الإنتاج**: استخدم `https://altayar.com` أو domain الخاص بك
3. **Firebase API Key**: احصل عليه من Firebase Console > Project Settings > General
4. **Database**: تأكد من أن PostgreSQL يعمل قبل تشغيل Backend
5. **Ports**: تأكد من أن المنافذ 5000 (Backend) و 3000 (Frontend) متاحة

---

## الدعم

إذا واجهت أي مشاكل:
1. تحقق من ملفات الـ Logs
2. راجع ملفات التوثيق:
   - `FIREBASE_DYNAMIC_LINKS_SETUP.md`
   - `DEPLOYMENT_GUIDE.md`
   - `WEB_DEPLOYMENT.md`

---

**تم! التطبيق جاهز للعمل على الويب** 🎉

