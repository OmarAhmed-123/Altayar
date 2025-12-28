# إعداد قاعدة البيانات PostgreSQL

## المشكلة الحالية

الخادم لا يستطيع الاتصال بقاعدة البيانات PostgreSQL على `localhost:5432`.

## الحلول

### الحل 1: تثبيت PostgreSQL محلياً (للتطوير)

#### على Windows:

1. **تحميل وتثبيت PostgreSQL:**
   - اذهب إلى: https://www.postgresql.org/download/windows/
   - قم بتحميل وتثبيت PostgreSQL
   - تذكر كلمة المرور التي تحددها للمستخدم `postgres`

2. **تشغيل سكريبت الإعداد:**
   ```powershell
   .\scripts\setup-local-db.ps1
   ```

3. **إنشاء قاعدة البيانات:**
   ```powershell
   # افتح Command Prompt كمسؤول
   createdb -U postgres tourist_app_db
   ```

4. **إنشاء ملف .env:**
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   DB_NAME=tourist_app_db
   NODE_ENV=development
   ```

5. **تشغيل Migrations:**
   ```powershell
   npm run migrate:latest
   ```

### الحل 2: استخدام Docker (أسهل)

```powershell
# تشغيل PostgreSQL في Docker
docker run --name altayar-postgres `
    -e POSTGRES_PASSWORD=StrongPass123 `
    -e POSTGRES_DB=tourist_app_db `
    -p 5432:5432 `
    -d postgres

# إنشاء ملف .env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db
NODE_ENV=development

# تشغيل Migrations
npm run migrate:latest
```

### الحل 3: العمل بدون قاعدة بيانات (للتطوير فقط)

الخادم الآن يمكنه العمل بدون قاعدة بيانات في development mode:

```powershell
# فقط شغل الخادم
npm start
```

**ملاحظة:** 
- الخادم سيعمل لكن ميزات قاعدة البيانات لن تعمل
- مفيد لاختبار API structure فقط
- على Cloud Run، قاعدة البيانات ستكون متاحة تلقائياً

## التحقق من الاتصال

### 1. اختبار الاتصال:
```powershell
# اختبار psql
psql -U postgres -d tourist_app_db

# أو
psql -h 127.0.0.1 -U postgres -d tourist_app_db
```

### 2. اختبار من Node.js:
```powershell
node -e "const {db} = require('./config/db'); db.raw('SELECT 1').then(() => console.log('✅ Connected')).catch(e => console.log('❌', e.message))"
```

### 3. اختبار Health Endpoint:
```powershell
curl http://localhost:5000/api/health
```

يجب أن ترى:
```json
{
  "database": {
    "status": "connected",
    "message": "Database is connected and operational"
  }
}
```

## إعدادات Cloud Run (Production)

على Cloud Run، قاعدة البيانات ستكون متاحة عبر Cloud SQL. تأكد من:

1. **إعداد Cloud SQL Instance**
2. **إضافة Environment Variables:**
   ```
   DB_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=tourist_app_db
   ```

3. **إضافة Cloud SQL Connection:**
   ```powershell
   gcloud run services update altayar-backend `
       --add-cloudsql-instances PROJECT_ID:REGION:INSTANCE_NAME `
       --region us-central1
   ```

## استكشاف الأخطاء

### خطأ: "Connection refused"
- تأكد من أن PostgreSQL service يعمل
- تحقق من أن البورت 5432 مفتوح
- تحقق من إعدادات firewall

### خطأ: "Authentication failed"
- تحقق من username و password في .env
- تأكد من أن المستخدم موجود في PostgreSQL

### خطأ: "Database does not exist"
- قم بإنشاء قاعدة البيانات: `createdb -U postgres tourist_app_db`

## ملاحظات مهمة

- ✅ في development: الخادم يمكنه العمل بدون قاعدة بيانات
- ❌ في production: قاعدة البيانات مطلوبة
- 🔒 استخدم .env file لحفظ credentials
- 📝 لا ترفع .env file إلى Git

---

**بعد إعداد قاعدة البيانات، أعد تشغيل الخادم:** `npm start`

