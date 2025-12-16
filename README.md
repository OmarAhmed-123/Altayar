# Altayar Backend (Node.js / Express)

Backend API for Altayar tourism app. Built with Express, PostgreSQL (Knex + Objection), JWT auth, and Socket.IO.

## المتطلبات
- Node.js 20+
- PostgreSQL 12+

## الإعداد السريع
1) انسخ ملف البيئة:
```
copy env.example .env
```
عدل قيم قاعدة البيانات، `JWT_SECRET`، و `FRONTEND_URL` (استخدم عنوان تطبيق Flutter العام/المحلي).

2) ثبّت الاعتمادات:
```
npm install
```

3) أنشئ قاعدة البيانات وشغّل الـ migrations + seed:
```
npx knex migrate:latest
npm run seed
```

4) شغّل السيرفر:
```
npm run dev
```
الخدمة تعمل افتراضياً على `http://localhost:5000/api`.

## نقاط التحقق
- Health: `GET /api/health`
- Auth: `POST /api/auth/login`
- Packages: `GET /api/packages`

## تكامل الفرونت (Flutter)
- القيمة الافتراضية في `lib/core/config/app_config.dart` هي `http://localhost:5000/api`.
- على جهاز حقيقي استخدم IP الجهاز المضيف: مثال `http://192.168.1.4:5000/api`.
- يمكنك تغييرها بتشغيل Flutter مع:
```
flutter run --dart-define=API_BASE_URL=http://<host>:5000/api
```
- الـ WebSockets تستخدم نفس الأصل (`/socket.io`) ويكفي تمرير توكن JWT في `auth.token`.

## سكربتات مفيدة
- `npm run migrate:latest` / `npm run migrate:rollback`
- `npm run seed:database` لإعادة ملء البيانات التجريبية
- `node scripts/createAdminUser.js` لإنشاء أدمن سريع

## ملاحظات
- مجلدات المخرجات مثل `uploads/` و `memberships/` يتم تجاهلها في الـ Git.
- قبل النشر، تأكد من فتح المنفذ 5000 للوصول من الموبايل، أو حدّث `API_BASE_URL` بالقيمة العامة.

