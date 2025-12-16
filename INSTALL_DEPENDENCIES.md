# تعليمات تثبيت الحزم المفقودة

## المشكلة
الخطأ: `Cannot find module 'pdfkit'`

## الحل

### الطريقة الأولى (الأسهل):
افتح PowerShell أو Command Prompt في مجلد الباك اند وقم بتشغيل:

```bash
npm install
```

أو لتثبيت pdfkit فقط:

```bash
npm install pdfkit
```

### الطريقة الثانية (إذا لم تعمل الأولى):
1. احذف مجلد `node_modules` وملف `package-lock.json`
2. قم بتشغيل `npm install` مرة أخرى

```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

### الطريقة الثالثة (استخدام npm cache clean):
```bash
npm cache clean --force
npm install
```

## التحقق من التثبيت
بعد التثبيت، تحقق من أن pdfkit مثبت بشكل صحيح:

```bash
npm list pdfkit
```

## تشغيل السيرفر
بعد تثبيت الحزم، قم بتشغيل السيرفر:

```bash
npm start
```

## ملاحظات
- تأكد من أنك في المجلد الصحيح: `E:\Altayar-app\Altayar-app-final\backend`
- تأكد من وجود ملف `.env` مع إعدادات قاعدة البيانات
- تأكد من أن Node.js مثبت على جهازك (الإصدار 14 أو أحدث)

