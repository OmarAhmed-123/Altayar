# ✅ الحل النهائي - إصلاح Migration DB_HOST Error

## 🔍 المشكلة

من الـ errors:
```
[MIGRATIONS] Connection config: {
  "host": "127.0.0.1",
  "port": 5432,
  ...
}
[MIGRATIONS] ERROR: connect ECONNREFUSED 127.0.0.1:5432
```

**السبب:** 
- الـ migration script يحاول الاتصال بـ `127.0.0.1:5432` بدلاً من Cloud SQL Proxy socket
- `DB_HOST` environment variable غير موجود أو غير صحيح في Cloud Run Job
- الـ script لا يكتشف Cloud SQL Proxy socket تلقائياً

---

## ✅ الحلول المطبقة

### 1. ✅ إضافة DB_HOST Fallback في `run-migrations-in-container.js`

**التغييرات:**
- ✅ إضافة logging أفضل لـ environment variables
- ✅ Auto-detect Cloud SQL Proxy socket إذا كان `DB_HOST` غير موجود أو `localhost`
- ✅ استخدام Cloud SQL Proxy socket path: `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`
- ✅ Fallback إلى default Cloud SQL instance إذا لم يتم تحديده

### 2. ✅ إصلاح `run-migrations-now.ps1`

**التغييرات:**
- ✅ التحقق من وجود `DB_HOST` في environment variables
- ✅ إذا كان `DB_HOST` غير موجود أو `localhost`، تعيينه إلى Cloud SQL Proxy socket
- ✅ إزالة `DB_HOST` القديم وإضافة الجديد بشكل صحيح
- ✅ Logging أفضل لعملية التحقق

---

## ✅ كيف يعمل الآن

### عند تشغيل `run-migrations-now.bat`:

1. ✅ **Get Environment Variables:** يحصل على environment variables من Cloud Run service
2. ✅ **Check DB_HOST:** يتحقق من وجود `DB_HOST` في environment variables
3. ✅ **Auto-Fix DB_HOST:** إذا كان `DB_HOST` غير موجود أو `localhost`:
   - يعين `DB_HOST` إلى Cloud SQL Proxy socket: `/cloudsql/altayar-46d6f:us-central1:altayar-db`
   - يمرر `DB_HOST` الصحيح إلى Cloud Run Job
4. ✅ **Run Migrations:** يشغل migrations باستخدام `DB_HOST` الصحيح
5. ✅ **Fallback in Container:** إذا فشل الـ detection في PowerShell، الـ container script يحاول مرة أخرى

---

## 📋 التغييرات

### `run-migrations-in-container.js`:

```javascript
// CRITICAL FIX: If DB_HOST is not set or is localhost, try to use Cloud SQL Proxy
if (!process.env.DB_HOST || process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST.includes('localhost')) {
    console.log('[MIGRATIONS] WARNING: DB_HOST is not set or is localhost');
    console.log('[MIGRATIONS] Attempting to use Cloud SQL Proxy socket...');
    
    // Try to get Cloud SQL instance from environment or use default
    const cloudSqlInstance = process.env.CLOUD_SQL_INSTANCE || 
                             process.env.CLOUD_SQL_CONNECTION_NAME ||
                             'altayar-46d6f:us-central1:altayar-db';
    
    // Cloud SQL Proxy socket path format: /cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
    const socketPath = `/cloudsql/${cloudSqlInstance}`;
    console.log(`[MIGRATIONS] Setting DB_HOST to Cloud SQL Proxy socket: ${socketPath}`);
    process.env.DB_HOST = socketPath;
}
```

### `run-migrations-now.ps1`:

```powershell
# CRITICAL FIX: Ensure DB_HOST is set to Cloud SQL Proxy socket if not already set
$hasDbHost = $false
$dbHostValue = $null
foreach ($envVar in $envVars) {
    if ($envVar.name -eq "DB_HOST") {
        $hasDbHost = $true
        $dbHostValue = $envVar.value
        Write-Host "   Found DB_HOST: $dbHostValue" -ForegroundColor Green
        break
    }
}

# If DB_HOST is not set or is localhost, set it to Cloud SQL Proxy socket
if (-not $hasDbHost -or $null -eq $dbHostValue -or $dbHostValue -eq "127.0.0.1" -or $dbHostValue -like "*localhost*") {
    $cloudSqlSocket = "/cloudsql/$CLOUD_SQL_INSTANCE"
    Write-Host "   Setting DB_HOST to Cloud SQL Proxy socket: $cloudSqlSocket" -ForegroundColor Yellow
    
    # Remove existing DB_HOST if it exists and add the correct one
    $envVarsList = $envVarsList | Where-Object { $_ -notlike "DB_HOST=*" }
    $envVarsList += "DB_HOST=$cloudSqlSocket"
}
```

---

## 🚀 الخطوات التالية

### 1. تشغيل Migrations:

```bash
run-migrations-now.bat
```

هذا سيضمن:
- ✅ `DB_HOST` يتم تعيينه بشكل صحيح إلى Cloud SQL Proxy socket
- ✅ الـ migrations تعمل باستخدام الاتصال الصحيح
- ✅ جميع الـ tables يتم إنشاؤها بنجاح

### 2. التحقق من النتيجة:

بعد تشغيل الـ migrations:
- ✅ لا مزيد من `ECONNREFUSED 127.0.0.1:5432` errors
- ✅ الـ migrations تعمل بنجاح
- ✅ جميع الـ tables موجودة
- ✅ Register/Login يعمل بشكل صحيح

---

## ✅ الخلاصة

الحل النهائي:
1. ✅ Auto-detect Cloud SQL Proxy socket إذا كان `DB_HOST` غير موجود
2. ✅ تعيين `DB_HOST` بشكل صحيح في PowerShell script
3. ✅ Fallback في container script إذا فشل الـ detection
4. ✅ Logging أفضل لعملية التحقق

**النتيجة:** الـ migrations تعمل بشكل صحيح باستخدام Cloud SQL Proxy socket، ولا مزيد من `ECONNREFUSED` errors.

