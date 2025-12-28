# دليل شامل: تشغيل التطبيق على الويب

## 📋 نظرة عامة

هذا الدليل يشرح كيفية تشغيل تطبيق Altayar على الويب بشكل كامل، من Backend إلى Frontend.

---

## 🚀 الخطوات الكاملة

### الجزء 1: إعداد Backend

#### الخطوة 1.1: الانتقال للمجلد
```bash
cd E:\Altayar-app\Altayar-app-final\backend
```

#### الخطوة 1.2: تثبيت المكتبات
```bash
npm install
```

#### الخطوة 1.3: إعداد ملف البيئة
```bash
# انسخ ملف env.example
copy env.example .env
```

#### الخطوة 1.4: تعديل ملف .env
افتح ملف `.env` وعدل القيم التالية:

```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure
SESSION_SECRET=your-super-secret-session-key-here-make-it-very-long-and-secure

# Server
PORT=5000
NODE_ENV=development

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://192.168.1.4:5000

# Firebase Dynamic Links
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_DYNAMIC_LINKS_DOMAIN=altayar.page.link
DEEP_LINK_BASE_URL=https://altayar.com
LANDING_PAGE_URL=https://altayar.com
ANDROID_PACKAGE_NAME=com.example.Altayar
IOS_BUNDLE_ID=com.example.Altayar
```

**كيفية الحصول على Firebase API Key:**
1. اذهب إلى: https://console.firebase.google.com/project/altayar-46d6f/settings/general
2. ابحث عن "Web API Key"
3. انسخه وضعه في `.env`

#### الخطوة 1.5: تشغيل Database Migrations
```bash
npm run migrate:latest
```

#### الخطوة 1.6: تشغيل Backend
```bash
npm run dev
```

✅ **التحقق**: افتح المتصفح على `http://localhost:5000/api/health`

---

### الجزء 2: إعداد Flutter App

#### الخطوة 2.1: الانتقال للمجلد
```bash
cd E:\AltayarFlutter\Altayar
```

#### الخطوة 2.2: تثبيت المكتبات
```bash
flutter pub get
```

#### الخطوة 2.3: إعداد Firebase (اختياري)
```bash
# تثبيت FlutterFire CLI
dart pub global activate flutterfire_cli

# إعداد Firebase
flutterfire configure
```

**اختر:**
- Project: `altayar-46d6f`
- Platforms: Android, iOS, Web

---

### الجزء 3: بناء التطبيق للويب

#### الخطوة 3.1: بناء التطبيق
```bash
flutter build web --release
```

#### الخطوة 3.2: التحقق
الملفات المبنية في: `build/web/`

---

### الجزء 4: نشر التطبيق

#### الخيار A: Firebase Hosting (موصى به)

##### 4.1: تثبيت Firebase CLI
```bash
npm install -g firebase-tools
```

##### 4.2: تسجيل الدخول
```bash
firebase login
```

##### 4.3: تهيئة Firebase Hosting (مرة واحدة فقط)
```bash
firebase init hosting
```

**اختر:**
- ✅ Use an existing project: `altayar-46d6f`
- ✅ Public directory: `build/web`
- ✅ Configure as single-page app: `Yes`
- ❌ Set up automatic builds: `No`

##### 4.4: النشر
```bash
# بناء التطبيق
flutter build web --release

# النشر
firebase deploy --only hosting
```

✅ **النتيجة**: `https://altayar-46d6f.web.app`

---

#### الخيار B: Netlify

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# بناء التطبيق
flutter build web --release

# النشر
netlify deploy --prod --dir=build/web
```

---

#### الخيار C: Vercel

```bash
# تثبيت Vercel CLI
npm install -g vercel

# بناء التطبيق
flutter build web --release

# النشر
vercel --prod build/web
```

---

## 🔗 ربط Domain مخصص

### في Firebase Hosting:
1. اذهب إلى: https://console.firebase.google.com/project/altayar-46d6f/hosting
2. اضغط "Add custom domain"
3. أدخل اسم النطاق (مثل: `altayar.com`)
4. اتبع التعليمات لإضافة DNS records

### تحديث Backend .env:
```env
DEEP_LINK_BASE_URL=https://altayar.com
LANDING_PAGE_URL=https://altayar.com
```

---

## ✅ اختبار التطبيق

### 1. اختبار Backend
```bash
curl http://localhost:5000/api/health
```

### 2. اختبار Deep Links
```bash
curl -X POST http://localhost:5000/api/deep-links/share \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "package",
    "id": "123",
    "title": "Test Package"
  }'
```

### 3. اختبار التطبيق على الويب
افتح الرابط المنشور وتأكد من:
- ✅ التطبيق يعمل
- ✅ الاتصال بالـ Backend يعمل
- ✅ Deep Links تعمل

---

## 🐛 استكشاف الأخطاء

### Backend لا يعمل
- ✅ تحقق من PostgreSQL يعمل
- ✅ تحقق من ملف `.env`
- ✅ تحقق من المنفذ 5000

### Flutter build فشل
```bash
flutter clean
flutter pub get
flutter build web --release
```

### Firebase Dynamic Links لا تعمل
- ✅ تحقق من `FIREBASE_API_KEY`
- ✅ تحقق من Firebase Console
- ✅ تحقق من Domain

### CORS errors
- ✅ تحقق من `FRONTEND_URL` في `.env`
- ✅ تحقق من CORS settings في `server.js`

---

## 📝 ملخص سريع

```bash
# Backend
cd E:\Altayar-app\Altayar-app-final\backend
npm install
copy env.example .env
# عدل .env
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

## 🔗 روابط مفيدة

- Firebase Console: https://console.firebase.google.com/project/altayar-46d6f
- Dynamic Links: https://console.firebase.google.com/project/altayar-46d6f/durablelinks
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

---

## 📚 ملفات التوثيق

- `QUICK_START_WEB.md` - دليل سريع
- `FIREBASE_DYNAMIC_LINKS_SETUP.md` - إعداد Firebase
- `DEPLOYMENT_GUIDE.md` - دليل النشر الشامل
- `CLEANUP_GUIDE.md` - تنظيف الملفات

---

## ✨ تم! التطبيق جاهز للعمل على الويب 🎉

