# ========================================
# التحقق من اتصال قاعدة البيانات - Verify Database Connection
# ========================================

$ErrorActionPreference = "Stop"
$PROJECT_ID = "altayar-46d6f"
$INSTANCE_NAME = "altayar-db"
$REGION = "us-central1"
$CONNECTION_NAME = "$PROJECT_ID:$REGION:$INSTANCE_NAME"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "التحقق من اتصال قاعدة البيانات" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if instance exists
Write-Host "[1/5] فحص وجود Cloud SQL instance..." -ForegroundColor Yellow
$instanceExists = gcloud sql instances describe $INSTANCE_NAME --project $PROJECT_ID 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Cloud SQL instance غير موجود: $INSTANCE_NAME" -ForegroundColor Red
    Write-Host "💡 قم بإنشاء instance أولاً" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Cloud SQL instance موجود" -ForegroundColor Green
Write-Host ""

# Step 2: Get instance information
Write-Host "[2/5] الحصول على معلومات Instance..." -ForegroundColor Yellow
$instanceInfo = gcloud sql instances describe $INSTANCE_NAME --project $PROJECT_ID --format="yaml" 2>&1
$connectionName = gcloud sql instances describe $INSTANCE_NAME --project $PROJECT_ID --format="value(connectionName)" 2>&1
Write-Host "✅ Connection Name: $connectionName" -ForegroundColor Green
Write-Host ""

# Step 3: Check databases
Write-Host "[3/5] فحص قواعد البيانات..." -ForegroundColor Yellow
$databases = gcloud sql databases list --instance=$INSTANCE_NAME --project $PROJECT_ID --format="value(name)" 2>&1
if ($databases -contains "tourist_app_db") {
    Write-Host "✅ قاعدة البيانات 'tourist_app_db' موجودة" -ForegroundColor Green
} else {
    Write-Host "⚠️  قاعدة البيانات 'tourist_app_db' غير موجودة" -ForegroundColor Yellow
    Write-Host "💡 قم بإنشاء قاعدة البيانات:" -ForegroundColor Yellow
    Write-Host "   gcloud sql databases create tourist_app_db --instance=$INSTANCE_NAME --project $PROJECT_ID" -ForegroundColor White
}
Write-Host ""

# Step 4: Check users
Write-Host "[4/5] فحص المستخدمين..." -ForegroundColor Yellow
$users = gcloud sql users list --instance=$INSTANCE_NAME --project $PROJECT_ID --format="value(name)" 2>&1
if ($users -contains "postgres") {
    Write-Host "✅ المستخدم 'postgres' موجود" -ForegroundColor Green
} else {
    Write-Host "⚠️  المستخدم 'postgres' غير موجود" -ForegroundColor Yellow
    Write-Host "💡 قم بإنشاء المستخدم:" -ForegroundColor Yellow
    Write-Host "   gcloud sql users create postgres --instance=$INSTANCE_NAME --password=YOUR_PASSWORD --project $PROJECT_ID" -ForegroundColor White
}
Write-Host ""

# Step 5: Check Cloud Run service connection
Write-Host "[5/5] فحص اتصال Cloud Run service..." -ForegroundColor Yellow
$serviceName = "altayar-backend"
$serviceInfo = gcloud run services describe $serviceName --region $REGION --project $PROJECT_ID --format="yaml" 2>&1
if ($serviceInfo -match $CONNECTION_NAME) {
    Write-Host "✅ Cloud Run service مربوط بـ Cloud SQL" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cloud Run service غير مربوط بـ Cloud SQL" -ForegroundColor Yellow
    Write-Host "💡 قم بربط Cloud Run بـ Cloud SQL:" -ForegroundColor Yellow
    Write-Host "   gcloud run services update $serviceName --add-cloudsql-instances $CONNECTION_NAME --region $REGION --project $PROJECT_ID" -ForegroundColor White
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ تم إكمال الفحص!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 المعلومات:" -ForegroundColor Yellow
Write-Host "   Connection Name: $CONNECTION_NAME" -ForegroundColor White
Write-Host "   DB Host (for Cloud Run): /cloudsql/$CONNECTION_NAME" -ForegroundColor White
Write-Host ""
Write-Host "📝 Environment Variables المطلوبة:" -ForegroundColor Yellow
Write-Host "   DB_HOST=/cloudsql/$CONNECTION_NAME" -ForegroundColor White
Write-Host "   DB_PORT=5432" -ForegroundColor White
Write-Host "   DB_USER=postgres" -ForegroundColor White
Write-Host "   DB_PASSWORD=YOUR_PASSWORD" -ForegroundColor White
Write-Host "   DB_NAME=tourist_app_db" -ForegroundColor White
Write-Host ""

