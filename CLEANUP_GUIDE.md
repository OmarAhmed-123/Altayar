# دليل تنظيف الملفات

## ملفات يمكن حذفها (بعد التأكد من عدم الحاجة)

### ملفات Migration المؤقتة
هذه الملفات تم تنفيذها بالفعل ويمكن حذفها:

- `add-reels-columns.js` - تم تنفيذها
- `fix_membership_tier.js` - تم تنفيذها (إذا تم إصلاح البيانات)
- `run-migration.js` - تم تنفيذها
- `run-booking-migration.js` - تم تنفيذها

**ملاحظة**: احتفظ بنسخة احتياطية قبل الحذف!

### ملفات Build
- `build/` - يتم إنشاؤها تلقائياً
- `node_modules/` - يتم تثبيتها تلقائياً

### ملفات Logs
- `*.log` - ملفات السجلات
- `logs/` - مجلد السجلات

---

## ملفات يجب الاحتفاظ بها

### ملفات Configuration
- `package.json`
- `knexfile.js`
- `env.example`
- `.gitignore`

### ملفات Source Code
- `server.js`
- `controllers/`
- `routes/`
- `models/`
- `middleware/`
- `services/`
- `utils/`

### ملفات Database
- `db/migrations/` - **مهم جداً!**
- `db/seeds/`

### ملفات Documentation
- `README.md`
- `DEPLOYMENT_GUIDE.md`
- `FIREBASE_DYNAMIC_LINKS_SETUP.md`
- `QUICK_START_WEB.md`

---

## تنظيف آمن

### 1. إنشاء نسخة احتياطية
```bash
# قبل الحذف، أنشئ نسخة احتياطية
git add .
git commit -m "Backup before cleanup"
```

### 2. حذف الملفات المؤقتة
```bash
# احذف ملفات migration المؤقتة (بعد التأكد)
del add-reels-columns.js
del fix_membership_tier.js
del run-migration.js
del run-booking-migration.js
```

### 3. تنظيف node_modules (اختياري)
```bash
# إذا كنت تريد تنظيف node_modules
rmdir /s node_modules
npm install
```

---

## ملفات .gitignore

الملفات التالية محمية في `.gitignore` ولن يتم رفعها:
- `.env` - ملف البيئة (مهم جداً!)
- `node_modules/` - المكتبات
- `uploads/` - الملفات المرفوعة
- `memberships/` - ملفات العضويات
- `*.log` - ملفات السجلات

---

## ملاحظات مهمة

⚠️ **تحذير**: لا تحذف:
- ملفات `db/migrations/` - مهمة جداً!
- ملفات `controllers/`, `routes/`, `models/` - الكود الأساسي
- ملفات `package.json`, `knexfile.js` - ملفات التكوين

✅ **آمن للحذف**:
- ملفات migration المؤقتة (بعد التأكد من التنفيذ)
- ملفات logs
- مجلدات build

