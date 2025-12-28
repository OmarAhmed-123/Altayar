# ========================================
# نشر شامل مع جميع الإصلاحات - Deploy with All Fixes
# ========================================
# هذا السكريبت يقوم بـ:
# 1. بناء Docker image
# 2. رفع الصورة إلى Container Registry
# 3. نشر على Cloud Run مع جميع الإعدادات الصحيحة
# 4. تفعيل جميع APIs المطلوبة
# 5. إعداد Environment Variables
# 6. اختبار النشر
# ========================================

$ErrorActionPreference = "Stop"
$PROJECT_ID = "altayar-46d6f"
$SERVICE_NAME = "altayar-backend"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"
$CONNECTION_NAME = "$PROJECT_ID:$REGION:altayar-db"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "نشر شامل مع جميع الإصلاحات" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check authentication
Write-Host "[1/12] التحقق من تسجيل الدخول..." -ForegroundColor Yellow
$currentProject = gcloud config get-value project 2>&1
if ($currentProject -ne $PROJECT_ID) {
    Write-Host "📝 تعيين المشروع إلى: $PROJECT_ID" -ForegroundColor Yellow
    gcloud config set project $PROJECT_ID
}
Write-Host "✅ تم التحقق" -ForegroundColor Green
Write-Host ""

# Step 2: Enable required APIs
Write-Host "[2/12] تفعيل APIs المطلوبة..." -ForegroundColor Yellow
$requiredApis = @(
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "compute.googleapis.com"
)

foreach ($api in $requiredApis) {
    $apiStatus = gcloud services list --enabled --filter="name:$api" --format="value(name)" 2>&1
    if (-not $apiStatus) {
        Write-Host "   تفعيل $api..." -ForegroundColor Gray
        gcloud services enable $api --project $PROJECT_ID 2>&1 | Out-Null
    }
}
Write-Host "✅ تم تفعيل جميع APIs" -ForegroundColor Green
Write-Host ""

# Step 3: Get database password
Write-Host "[3/12] إدخال كلمة سر قاعدة البيانات..." -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString "أدخل كلمة سر قاعدة البيانات"
$DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword))
Write-Host "✅ تم إدخال كلمة السر" -ForegroundColor Green
Write-Host ""

# Step 4: Generate secrets
Write-Host "[4/12] توليد Secrets..." -ForegroundColor Yellow
$JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
$SESSION_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
Write-Host "✅ تم توليد Secrets" -ForegroundColor Green
Write-Host ""

# Step 5: Build Docker image
Write-Host "[5/12] بناء Docker image..." -ForegroundColor Yellow
docker build -t "$IMAGE_NAME:latest" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل بناء الصورة" -ForegroundColor Red
    exit 1
}
Write-Host "✅ تم بناء الصورة" -ForegroundColor Green
Write-Host ""

# Step 6: Configure Docker for gcloud
Write-Host "[6/12] إعداد Docker لـ gcloud..." -ForegroundColor Yellow
gcloud auth configure-docker 2>&1 | Out-Null
Write-Host "✅ تم الإعداد" -ForegroundColor Green
Write-Host ""

# Step 7: Push image to Container Registry
Write-Host "[7/12] رفع الصورة إلى Container Registry..." -ForegroundColor Yellow
docker push "$IMAGE_NAME:latest"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل رفع الصورة" -ForegroundColor Red
    exit 1
}
Write-Host "✅ تم رفع الصورة" -ForegroundColor Green
Write-Host ""

# Step 8: Prepare environment variables
Write-Host "[8/12] إعداد Environment Variables..." -ForegroundColor Yellow
$envVars = @(
    "NODE_ENV=production",
    "PORT=8080",
    "DB_HOST=/cloudsql/$CONNECTION_NAME",
    "DB_PORT=5432",
    "DB_USER=postgres",
    "DB_PASSWORD=$DB_PASSWORD",
    "DB_NAME=tourist_app_db",
    "JWT_SECRET=$JWT_SECRET",
    "SESSION_SECRET=$SESSION_SECRET",
    "FRONTEND_URL=https://altayar-46d6f.web.app,https://altayar-46d6f.firebaseapp.com",
    "BACKEND_URL=https://$SERVICE_NAME-$REGION-$PROJECT_ID.a.run.app"
) -join ","

Write-Host "✅ تم الإعداد" -ForegroundColor Green
Write-Host ""

# Step 9: Deploy to Cloud Run
Write-Host "[9/12] النشر على Cloud Run..." -ForegroundColor Yellow
Write-Host "   هذا قد يستغرق 2-3 دقائق..." -ForegroundColor Gray

$deployOutput = gcloud run deploy $SERVICE_NAME `
    --image "$IMAGE_NAME:latest" `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --add-cloudsql-instances $CONNECTION_NAME `
    --set-env-vars $envVars `
    --project $PROJECT_ID 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل النشر" -ForegroundColor Red
    Write-Host $deployOutput -ForegroundColor Red
    exit 1
}

Write-Host "✅ تم النشر بنجاح" -ForegroundColor Green
Write-Host ""

# Step 10: Get service URL
Write-Host "[10/12] الحصول على رابط السيرفر..." -ForegroundColor Yellow
$SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.url)" 2>&1
if (-not $SERVICE_URL -or $SERVICE_URL -match "ERROR") {
    Write-Host "⚠️  فشل الحصول على الرابط تلقائياً" -ForegroundColor Yellow
    $SERVICE_URL = "https://$SERVICE_NAME-$REGION-$PROJECT_ID.a.run.app"
}
Write-Host "✅ رابط السيرفر: $SERVICE_URL" -ForegroundColor Green
Write-Host ""

# Step 11: Wait and test
Write-Host "[11/12] انتظار جاهزية السيرفر واختباره..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

$testEndpoints = @(
    @{Path="/api/health"; Name="Health Check"},
    @{Path="/api"; Name="API Root"},
    @{Path="/api/oauth/config"; Name="OAuth Config"}
)

foreach ($endpoint in $testEndpoints) {
    Write-Host "   اختبار $($endpoint.Name)..." -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri "$SERVICE_URL$($endpoint.Path)" -Method GET -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ $($endpoint.Name) يعمل" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $($endpoint.Name) رجع: $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ❌ $($endpoint.Name) فشل: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Step 12: Update frontend
Write-Host "[12/12] تحديث الفرونت إند..." -ForegroundColor Yellow
$frontendConfigPath = "E:\AltayarFlutter\Altayar\lib\core\config\app_config.dart"
if (Test-Path $frontendConfigPath) {
    node update-frontend-config.js $SERVICE_URL 2>&1 | Out-Null
    Write-Host "✅ تم تحديث الفرونت إند" -ForegroundColor Green
} else {
    Write-Host "⚠️  ملف الفرونت إند غير موجود" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ تم إكمال النشر بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 المعلومات:" -ForegroundColor Yellow
Write-Host "   رابط السيرفر: $SERVICE_URL" -ForegroundColor White
Write-Host "   رابط API: $SERVICE_URL/api" -ForegroundColor White
Write-Host "   Health Check: $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "   OAuth Config: $SERVICE_URL/api/oauth/config" -ForegroundColor White
Write-Host ""
Write-Host "📝 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "   1. اختبر السيرفر: curl $SERVICE_URL/api/health" -ForegroundColor White
Write-Host "   2. راجع السجلات: gcloud run services logs read $SERVICE_NAME --region $REGION --limit 50" -ForegroundColor White
Write-Host "   3. إذا كان هناك مشاكل، شغّل: .\fix-all-issues-complete.ps1" -ForegroundColor White
Write-Host ""

