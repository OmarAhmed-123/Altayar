# 🎨 دليل النشر على Render (سهل جداً!)

## ✅ لماذا Render?

- ✅ **Free tier ممتاز**
- ✅ **PostgreSQL مجاني**
- ✅ **SSL تلقائي**
- ✅ **Deploy من GitHub**
- ✅ **سريع وموثوق**

## 🚀 خطوات النشر (10 دقائق)

### الخطوة 1: إعداد المشروع على GitHub

(نفس خطوات Railway - راجع `RAILWAY_DEPLOYMENT.md`)

### الخطوة 2: إنشاء حساب Render

1. **سجّل الدخول:**
   ```
   https://render.com
   ```

2. **سجّل بحساب GitHub:**
   - اضغط "Get Started for Free"
   - اختر "Sign up with GitHub"

### الخطوة 3: إنشاء Web Service

1. **أنشئ Web Service:**
   - اضغط "New" → "Web Service"
   - اختر repository `altayar-backend`

2. **إعدادات Service:**
   - **Name:** `altayar-backend`
   - **Region:** اختر الأقرب لك
   - **Branch:** `main`
   - **Root Directory:** `backend` (إذا كان في subfolder)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`

3. **Plan:**
   - اختر **"Free"**

### الخطوة 4: إعداد قاعدة البيانات

1. **أنشئ PostgreSQL:**
   - اضغط "New" → "PostgreSQL"
   - **Name:** `altayar-db`
   - **Database:** `tourist_app_db`
   - **User:** `altayar_user`
   - **Plan:** **"Free"**

2. **احصل على Connection String:**
   - بعد الإنشاء، اذهب إلى Database
   - انسخ **"Internal Database URL"**

### الخطوة 5: إعداد Environment Variables

في Web Service settings:

1. **Environment:**
   ```
   NODE_ENV=production
   PORT=8080
   DATABASE_URL=<من قاعدة البيانات>
   DB_HOST=<من Render Database>
   DB_PORT=5432
   DB_USER=<من Render Database>
   DB_PASSWORD=<من Render Database>
   DB_NAME=tourist_app_db
   JWT_SECRET=your-secret-key-here
   SESSION_SECRET=your-session-secret-here
   FRONTEND_URL=https://your-frontend-url.com
   ```

### الخطوة 6: تشغيل Migrations

1. **استخدم Render Shell:**
   - في Web Service
   - اضغط "Shell"
   - شغّل:
     ```bash
     npm run migrate:latest
     ```

2. **أو أضف في Build Command:**
   ```
   npm install && npm run migrate:latest
   ```

### الخطوة 7: Deploy

Render سيقوم بالـ deploy تلقائياً. URL سيكون:
```
https://altayar-backend.onrender.com
```

**ملاحظة:** Free tier قد يكون بطيء في البداية (cold start)

### الخطوة 8: تحديث الفرونت إند

```dart
// app_config.dart
static const String baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://altayar-backend.onrender.com/api',
);
```

## ✅ المميزات

- ✅ **Free tier جيد**
- ✅ **PostgreSQL مجاني**
- ✅ **SSL تلقائي**
- ✅ **Deploy تلقائي**

## ⚠️ القيود (Free Tier)

- ⚠️ **Cold start:** قد يستغرق 30-60 ثانية في البداية
- ⚠️ **Sleep:** بعد 15 دقيقة عدم استخدام، ينام
- ⚠️ **Bandwidth:** محدود

**للتغلب على Cold Start:**
- استخدم خدمة مثل UptimeRobot لـ ping كل 5 دقائق
- أو ارفع إلى Paid plan ($7/شهر)

## 💰 التكلفة

- **Free:** مجاني (مع القيود أعلاه)
- **Starter:** $7/شهر (بدون قيود)

---

**Render ممتاز وسهل! جربه الآن!** 🎨

