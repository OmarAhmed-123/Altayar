# ⚡ إصلاح سريع - الجداول غير موجودة

## المشكلة

```
relation "users" does not exist
```

## ✅ الحل السريع (خطوة واحدة!)

```powershell
.\scripts\run-migrations.ps1
```

أو يدوياً:

```powershell
npm run migrate:latest
```

## ✅ التحقق

بعد تشغيل migrations، أعد تشغيل الخادم:

```powershell
npm start
```

يجب أن ترى:
```
✅ PostgreSQL connected successfully.
✅ [DB] Migrations completed successfully
```

**بدون أخطاء!**

---

**هذا كل شيء!** ✅

