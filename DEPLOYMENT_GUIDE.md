# دليل النشر والتشغيل - ALTAYAR Platform
## Production Deployment Guide

---

## 📋 جدول المحتويات

1. [متطلبات السيرفر](#متطلبات-السيرفر)
2. [نشر Backend](#نشر-backend)
3. [نشر Frontend](#نشر-frontend)
4. [الأمان والـ SSL](#الأمان-والssl)
5. [النسخ الاحتياطي](#النسخ-الاحتياطي)
6. [المراقبة](#المراقبة)

---

## 🖥️ متطلبات السيرفر

### الحد الأدنى (للتجربة)
- **CPU:** 2 Cores
- **RAM:** 4 GB
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 22.04 LTS

### الموصى به (للإنتاج)
- **CPU:** 4 Cores
- **RAM:** 8 GB
- **Storage:** 100 GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Bandwidth:** Unlimited أو 1TB+

---

## 🚀 نشر Backend

### 1. إعداد السيرفر

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# تثبيت PM2 لإدارة العمليات
sudo npm install -g pm2

# تثبيت PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# تثبيت Nginx
sudo apt install -y nginx
```

### 2. إعداد قاعدة البيانات

```bash
# الدخول لـ PostgreSQL
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE altayar_production;
CREATE USER altayar_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE altayar_production TO altayar_user;
\q
```

### 3. رفع الكود

```bash
# إنشاء مجلد للمشروع
sudo mkdir -p /var/www/altayar
sudo chown -R $USER:$USER /var/www/altayar

# رفع الملفات (استخدم Git أو SCP)
cd /var/www/altayar
git clone https://github.com/your-repo/altayar-backend.git backend
cd backend

# تثبيت Dependencies
npm install --production
```

### 4. ملف البيئة `.env` للإنتاج

```bash
cd /var/www/altayar/backend
nano .env
```

```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://altayar_user:your_secure_password@localhost:5432/altayar_production

# JWT (استخدم مفتاح قوي جداً)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
JWT_EXPIRATION=7d

# Fawaterak
FAWATERAK_API_KEY=live_your_production_key
FAWATERAK_WEBHOOK_SECRET=your_webhook_secret

# Gemini
GEMINI_API_KEY=your_gemini_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@altayar.com
SMTP_PASS=your_app_password

# Frontend URL (للـ CORS)
FRONTEND_URL=https://altayar.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/var/www/altayar/uploads
```

### 5. تشغيل الـ Migrations

```bash
npm run migrate
npm run seed # (اختياري)
```

### 6. تشغيل Backend باستخدام PM2

```bash
# بدء التطبيق
pm2 start server.js --name altayar-backend

# حفظ القائمة للتشغيل التلقائي عند إعادة التشغيل
pm2 save
pm2 startup

# التحقق من الحالة
pm2 status
pm2 logs altayar-backend
```

### 7. إعداد Nginx كـ Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/altayar
```

```nginx
server {
    listen 80;
    server_name api.altayar.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/altayar/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/altayar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. تفعيل SSL (Let's Encrypt)

```bash
# تثبيت Certbot
sudo apt install -y certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d api.altayar.com

# التجديد التلقائي
sudo certbot renew --dry-run
```

---

## 📱 نشر Frontend (Flutter)

### Option 1: Google Play Store (Android)

#### 1. إعداد Signing Key

```bash
cd E:\AltayarFlutter\Altayar\android
keytool -genkey -v -keystore altayar-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias altayar
```

#### 2. تكوين `android/key.properties`

```properties
storePassword=your_keystore_password
keyPassword=your_key_password
keyAlias=altayar
storeFile=altayar-release-key.jks
```

#### 3. تعديل `android/app/build.gradle`

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    ...
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 4. بناء APK/AAB

```bash
# بناء AAB للنشر على Google Play
flutter build appbundle --dart-define=API_BASE_URL=https://api.altayar.com/api --release

# أو بناء APK للتوزيع المباشر
flutter build apk --dart-define=API_BASE_URL=https://api.altayar.com/api --release --split-per-abi
```

الملف سيكون في:
- AAB: `build/app/outputs/bundle/release/app-release.aab`
- APK: `build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk`

#### 5. رفع على Google Play Console

1. اذهب إلى [Google Play Console](https://play.google.com/console)
2. أنشئ تطبيق جديد
3. املأ معلومات التطبيق
4. ارفع الـ AAB
5. أكمل إعداد المتجر (وصف، صور، فيديو...)
6. أرسل للمراجعة

---

### Option 2: Apple App Store (iOS)

#### 1. إعداد Xcode

```bash
cd E:\AltayarFlutter\Altayar\ios
open Runner.xcworkspace
```

#### 2. تكوين Signing & Capabilities

في Xcode:
1. اختر Team من Apple Developer Account
2. تأكد من Bundle Identifier (مثال: `com.altayar.app`)
3. فعّل Automatically manage signing

#### 3. بناء IPA

```bash
flutter build ipa --dart-define=API_BASE_URL=https://api.altayar.com/api --release
```

#### 4. رفع على App Store Connect

استخدم Xcode أو Transporter لرفع الـ IPA إلى App Store Connect.

---

### Option 3: Web Deployment

#### 1. بناء Web Version

```bash
flutter build web --dart-define=API_BASE_URL=https://api.altayar.com/api --release
```

#### 2. رفع على Server

```bash
# الملفات ستكون في: build/web/
scp -r build/web/* user@server:/var/www/altayar-web/
```

#### 3. إعداد Nginx للـ Web

```nginx
server {
    listen 80;
    server_name altayar.com www.altayar.com;

    root /var/www/altayar-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caching للملفات الثابتة
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
sudo systemctl restart nginx
```

---

## 🔒 الأمان والـ SSL

### 1. Firewall

```bash
# السماح بـ SSH, HTTP, HTTPS فقط
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. تأمين PostgreSQL

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

تأكد من أن السطر التالي موجود:
```
local   all   all   md5
```

```bash
sudo systemctl restart postgresql
```

### 3. Environment Variables الآمنة

- **لا تحفظ `.env` في Git**
- استخدم أدوات مثل **Vault** أو **AWS Secrets Manager** للإنتاج الكبير

### 4. Rate Limiting في Nginx

```nginx
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            ...
        }
    }
}
```

---

## 💾 النسخ الاحتياطي

### 1. Backup لقاعدة البيانات

```bash
# إنشاء Cron Job للنسخ الاحتياطي اليومي
crontab -e
```

أضف السطر التالي:
```
0 2 * * * pg_dump -U altayar_user altayar_production > /backups/altayar_$(date +\%Y\%m\%d).sql
```

### 2. Backup للملفات المرفوعة

```bash
# Backup يومي للمرفقات
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/altayar/uploads
```

### 3. استرجاع Backup

```bash
# استرجاع قاعدة البيانات
psql -U altayar_user -d altayar_production < /backups/altayar_20241203.sql

# استرجاع الملفات
tar -xzf /backups/uploads_20241203.tar.gz -C /var/www/altayar/
```

---

## 📊 المراقبة (Monitoring)

### 1. PM2 Monitoring

```bash
# رصد الموارد
pm2 monit

# عرض Logs
pm2 logs altayar-backend --lines 100

# Restart التطبيق
pm2 restart altayar-backend
```

### 2. Nginx Logs

```bash
# Access Logs
sudo tail -f /var/log/nginx/access.log

# Error Logs
sudo tail -f /var/log/nginx/error.log
```

### 3. Database Monitoring

```bash
# الاتصالات النشطة
sudo -u postgres psql -d altayar_production -c "SELECT * FROM pg_stat_activity;"

# حجم قاعدة البيانات
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('altayar_production'));"
```

### 4. استخدام أدوات خارجية (اختياري)

- **Uptime Monitoring:** [UptimeRobot](https://uptimerobot.com/)
- **Error Tracking:** [Sentry](https://sentry.io/)
- **Performance:** [New Relic](https://newrelic.com/)

---

## 🔄 التحديثات (Updates)

### تحديث Backend

```bash
cd /var/www/altayar/backend
git pull origin main
npm install --production
npm run migrate
pm2 restart altayar-backend
```

### تحديث Frontend

```bash
# بناء نسخة جديدة
flutter build apk --release

# أو رفع نسخة جديدة على Google Play
```

---

## ✅ Checklist قبل الإطلاق

- [ ] SSL Certificate مفعّل ويعمل
- [ ] Firewall مفعّل ومُكوّن بشكل صحيح
- [ ] النسخ الاحتياطي التلقائي مفعّل
- [ ] Environment Variables آمنة ولا توجد في Git
- [ ] Rate Limiting مفعّل
- [ ] CORS مُكوّن بشكل صحيح
- [ ] PM2 يُشغّل التطبيق تلقائياً عند إعادة التشغيل
- [ ] Nginx يعمل كـ Reverse Proxy
- [ ] قاعدة البيانات محمية بكلمة مرور قوية
- [ ] تم اختبار جميع APIs في بيئة الإنتاج
- [ ] Email SMTP يعمل بشكل صحيح
- [ ] Fawaterak Payment Gateway جاهز ومُختبر
- [ ] Gemini Chatbot يستجيب بشكل صحيح
- [ ] Monitoring مفعّل (Logs, Uptime)

---

**النظام جاهز الآن للإطلاق الرسمي! 🚀**

