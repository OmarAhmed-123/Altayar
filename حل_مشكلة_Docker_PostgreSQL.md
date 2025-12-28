# ✅ حل مشكلة PostgreSQL مع Docker

## 🎯 المشكلة

لا يوجد PostgreSQL مثبت محلياً، لكن Docker يعمل. نحتاج لتشغيل PostgreSQL في Docker.

---

## ✅ الحل السريع (3 خطوات)

### الخطوة 1: تشغيل PostgreSQL في Docker

**الطريقة 1: استخدام السكريبت (موصى به)**
```bash
cd E:\Altayar-app\Altayar-app-final\backend

# على Windows
.\setup-postgres-docker.bat

# أو PowerShell
.\setup-postgres-docker.ps1
```

**الطريقة 2: يدوياً**
```bash
# إنشاء container جديد
docker run --name altayar-postgres \
  -e POSTGRES_PASSWORD=StrongPass123 \
  -e POSTGRES_DB=tourist_app_db \
  -p 5432:5432 \
  -d postgres:15-alpine

# أو استخدام docker-compose
docker-compose up -d postgres
```

**الوقت:** 1-2 دقيقة

---

### الخطوة 2: التحقق من .env

**تأكد من أن ملف `.env` يحتوي على:**
```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=StrongPass123
DB_NAME=tourist_app_db
NODE_ENV=development
```

**إذا لم يكن موجوداً، السكريبت سينشئه تلقائياً.**

---

### الخطوة 3: تشغيل Migrations

```bash
cd E:\Altayar-app\Altayar-app-final\backend
npm run migrate:latest
```

**الوقت:** 30 ثانية - 1 دقيقة

---

### الخطوة 4: تشغيل السيرفر

```bash
npm start
```

**يجب أن ترى:**
```
✅ PostgreSQL connected successfully.
✅ Database: Connected and operational
```

---

## ✅ التحقق من الحل

### اختبار 1: التحقق من Docker Container

```bash
docker ps
```

**يجب أن ترى:**
```
CONTAINER ID   IMAGE                STATUS
xxxxx          postgres:15-alpine   Up X minutes
```

---

### اختبار 2: التحقق من PostgreSQL

```bash
docker exec altayar-postgres pg_isready -U postgres
```

**يجب أن ترى:**
```
localhost:5432 - accepting connections
```

---

### اختبار 3: Health Check

```bash
curl http://localhost:5000/api/health
```

**يجب أن ترى:**
```json
{
  "status": "OK",
  "database": {
    "status": "connected"
  }
}
```

---

### اختبار 4: Register

1. افتح التطبيق
2. جرب عمل register
3. ✅ يجب أن يعمل بنجاح!

---

## 🔧 استكشاف الأخطاء

### المشكلة: Docker container لا يبدأ

**الحل:**
```bash
# تحقق من logs
docker logs altayar-postgres

# إعادة تشغيل container
docker restart altayar-postgres

# أو حذف وإنشاء جديد
docker stop altayar-postgres
docker rm altayar-postgres
docker run --name altayar-postgres \
  -e POSTGRES_PASSWORD=StrongPass123 \
  -e POSTGRES_DB=tourist_app_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

---

### المشكلة: Port 5432 مستخدم

**الحل:**
```bash
# تحقق من ما يستخدم port 5432
netstat -ano | findstr :5432

# أو استخدم port آخر
docker run --name altayar-postgres \
  -e POSTGRES_PASSWORD=StrongPass123 \
  -e POSTGRES_DB=tourist_app_db \
  -p 5433:5432 \
  -d postgres:15-alpine

# ثم غيّر في .env:
# DB_PORT=5433
```

---

### المشكلة: لا يمكن الاتصال بقاعدة البيانات

**الحل:**
1. تأكد من أن container يعمل:
   ```bash
   docker ps
   ```

2. تأكد من .env:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```

3. أعد تشغيل السيرفر:
   ```bash
   npm start
   ```

---

## 📋 أوامر مفيدة

### إدارة Container

```bash
# بدء container
docker start altayar-postgres

# إيقاف container
docker stop altayar-postgres

# إعادة تشغيل container
docker restart altayar-postgres

# حذف container
docker stop altayar-postgres
docker rm altayar-postgres

# عرض logs
docker logs altayar-postgres

# الدخول إلى container
docker exec -it altayar-postgres psql -U postgres -d tourist_app_db
```

---

## 🎉 النتيجة

✅ **الآن:**
- ✅ PostgreSQL يعمل في Docker
- ✅ قاعدة البيانات متصلة
- ✅ Register يعمل بنجاح
- ✅ كل شيء يعمل بشكل سليم

---

## 🔗 روابط مفيدة

- **Docker Desktop:** https://www.docker.com/products/docker-desktop
- **PostgreSQL Docker Image:** https://hub.docker.com/_/postgres
- **Health Check:** http://localhost:5000/api/health

---

**تم الحل بشكل نهائي!** ✅

