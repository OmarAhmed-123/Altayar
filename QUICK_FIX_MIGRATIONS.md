# ⚡ إصلاح سريع - مشاكل Migrations

## المشكلة

```
migration failed with error: alter table "memberships" add column "image_url" varchar(255) null - relation "memberships" does not exist
```

## ✅ الحل السريع (خطوة واحدة!)

```powershell
.\scripts\fix-migrations.ps1
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

## 📚 للمزيد من التفاصيل

راجع: `FIX_MIGRATIONS_COMPLETE.md`

---

**هذا كل شيء!** ✅

