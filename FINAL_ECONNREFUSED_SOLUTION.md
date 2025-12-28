# ✅ FINAL SOLUTION: ECONNREFUSED 127.0.0.1:5432

## Problem

When trying to register or login, you get:
```
api exception(500): connect econnrefused 127.0.0.1:5432
```

**Root Cause:** Backend on Google Cloud Run is trying to connect to database at `127.0.0.1:5432` (localhost) instead of Google Cloud SQL.

---

## ✅ Solution

### Step 1: Update Cloud Run Service

Run the script to update Cloud Run service with correct environment variables:

#### Windows:
```cmd
cd E:\Altayar-app\Altayar-app-final\backend
fix-database-connection-final.bat
```

#### PowerShell:
```powershell
cd E:\Altayar-app\Altayar-app-final\backend
.\fix-database-connection-final.ps1
```

---

### Step 2: Choose Connection Method

The script will ask you to choose:

#### Option 1: Cloud SQL Proxy (Socket) - **Recommended**
```
DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
```
- ✅ Most secure
- ✅ Works directly on Cloud Run
- ✅ No Public IP needed
- ✅ No SSL configuration needed

#### Option 2: Public IP with SSL - **Alternative**
```
DB_HOST=34.58.123.127
```
- ✅ Works from anywhere
- ✅ Requires SSL enabled
- ✅ Requires Public IP enabled on Cloud SQL

---

## 🔧 What Was Fixed

### 1. Updated `knexfile.js`
- ✅ Better support for Cloud SQL Proxy (socket)
- ✅ Better support for Public IP with SSL
- ✅ Automatic connection type detection
- ✅ Clearer console messages

### 2. Updated `config/db.js`
- ✅ Clearer error messages
- ✅ Better guidance on connection failure
- ✅ Better support for Public IP

### 3. New Scripts
- ✅ `fix-database-connection-final.ps1` - Update Cloud Run service
- ✅ `fix-database-connection-final.bat` - PowerShell wrapper
- ✅ `test-database-connection.ps1` - Test connection

---

## 🚀 Usage

### Update Cloud Run Service:

```powershell
# Run the script
.\fix-database-connection-final.ps1

# It will ask for:
# 1. Connection method (1 or 2)
# 2. Database password
# 3. JWT_SECRET (can be auto-generated)
# 4. SESSION_SECRET (can be auto-generated)
```

### Test Connection:

```powershell
# Test database connection
.\test-database-connection.ps1
```

---

## ✅ Verification

After updating Cloud Run service:

1. **Wait 1-2 minutes** for service to update

2. **Test Health Endpoint:**
   ```
   https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
   ```

3. **Check Database Status:**
   ```json
   {
     "database": {
       "status": "connected",
       "message": "Database is connected and operational"
     }
   }
   ```

4. **Test Register/Login:**
   - Should work without `ECONNREFUSED` error

---

## 🔍 Troubleshooting

### If problem persists:

#### 1. Check Cloud SQL Instance:
- ✅ Cloud SQL instance is running
- ✅ Public IP enabled (if using Public IP)
- ✅ Authorized networks configured (if using Public IP)

#### 2. Check Cloud Run Service:
- ✅ Environment variables are correct
- ✅ Cloud SQL instance is linked
- ✅ Service logs show no errors

#### 3. Try Different Connection Method:
- If Cloud SQL Proxy doesn't work, try Public IP
- If Public IP doesn't work, try Cloud SQL Proxy

#### 4. Review Logs:
```bash
gcloud run services logs read altayar-backend --region us-central1
```

---

## 📋 Required Environment Variables

### In Cloud Run:

```
NODE_ENV=production
PORT=8080
DB_HOST=/cloudsql/altayar-46d6f:us-central1:altayar-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=YOUR_DB_PASSWORD
DB_NAME=tourist_app_db
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com
BACKEND_URL=https://altayar-backend-kuwjte4rda-uc.a.run.app
```

---

## 🎯 Quick Steps

1. ✅ **Run:** `fix-database-connection-final.bat`
2. ✅ **Choose:** Connection method (1 or 2)
3. ✅ **Enter:** Database password
4. ✅ **Wait:** 1-2 minutes
5. ✅ **Test:** https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
6. ✅ **Verify:** Database status = "connected"

---

## ✅ Expected Result

After applying the solution:

- ✅ No more `ECONNREFUSED` errors
- ✅ Register/Login works correctly
- ✅ Database connected permanently
- ✅ Server works even when local machine is off

---

**Final solution is ready! 🎉**

