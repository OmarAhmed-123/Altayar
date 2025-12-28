# 🌐 معلومات الرابط - Altayar Backend

## ✅ تم النشر بنجاح!

### 🔗 الروابط:

**Service URL (الرابط الرئيسي):**
```
https://altayar-backend-kuwjte4rda-uc.a.run.app
```

**API URL (للاستخدام في التطبيق):**
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api
```

**Health Check:**
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

---

## 📱 للوصول من أي مكان (خارج نفس الشبكة):

### ✅ الرابط جاهز للاستخدام من أي مكان!

**Cloud Run** يوفر رابط HTTPS عام يمكن الوصول إليه من:
- ✅ أي جهاز على الإنترنت
- ✅ أي شبكة (WiFi, Mobile Data, etc.)
- ✅ أي دولة
- ✅ بدون حاجة لـ VPN أو port forwarding

**الرابط:**
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api
```

---

## 🔧 المشاكل المحتملة وحلولها:

### 1. Service Unavailable

**السبب:** Environment variables مفقودة (قاعدة البيانات، JWT secrets, etc.)

**الحل:**
```
ADD_ENV_VARS.bat
```

**أو يدوياً:**
1. اذهب إلى: https://console.cloud.google.com/run?project=altayar-46d6f
2. اختر service: `altayar-backend`
3. Edit & Deploy New Revision
4. Variables & Secrets → Add Variable

**أضف:**
```
NODE_ENV=production
DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=tourist_app_db
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
FRONTEND_URL=https://your-frontend.com
```

---

## 📋 الخطوات التالية:

### 1. إضافة Environment Variables:
```
ADD_ENV_VARS.bat
```

### 2. تحديث الفرونت إند:
تم التحديث تلقائياً في:
- `E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart`

**إذا كان لديك فرونت إند آخر في `E:\Altayar82`:**
```bash
node update-frontend-config.js https://altayar-backend-kuwjte4rda-uc.a.run.app
```

### 3. اختبار API:
افتح في المتصفح:
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

### 4. تشغيل Migrations:
```bash
# استخدم Cloud SQL Proxy
cloud_sql_proxy -instances=altayar-46d6f:us-central1:altayar-db=tcp:5432

# في terminal آخر
set DB_HOST=127.0.0.1
set DB_PORT=5432
npm run migrate:latest
```

---

## ✅ التحقق من النشر:

### Health Check:
افتح في المتصفح:
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

**يجب أن ترى:**
```json
{
  "status": "OK",
  "message": "Server is running",
  ...
}
```

---

## 🎯 استخدام الرابط في التطبيق:

### Flutter:
```dart
// في app_config.dart
static const String baseUrl = 'https://altayar-backend-kuwjte4rda-uc.a.run.app/api';
```

### أو عند التشغيل:
```bash
flutter run --dart-define=API_BASE_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app/api
```

---

## 🔐 الأمان:

- ✅ HTTPS تلقائياً (SSL/TLS)
- ✅ Authentication مطلوب للـ APIs الحساسة
- ✅ CORS محدّث لدعم جميع origins
- ✅ Environment variables آمنة في Cloud Run

---

## 📞 الدعم:

إذا واجهت أي مشاكل:
1. راجع: `ADD_ENV_VARS.bat` لإضافة environment variables
2. راجع: Cloud Run logs في Console
3. اختبر: Health endpoint

---

**الرابط جاهز للاستخدام من أي مكان!** 🌐

