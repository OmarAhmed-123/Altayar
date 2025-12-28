# 🚀 دليل الإصلاح السريع

## المشكلة: Docker Build Failed

### الحل السريع (3 خطوات)

#### الخطوة 1: تنظيف Docker Cache
```powershell
.\scripts\fix-docker-cache.ps1
```

أو يدوياً:
```powershell
docker builder prune -af
```

#### الخطوة 2: إعادة تشغيل Docker Desktop
1. أغلق Docker Desktop
2. افتحه مرة أخرى
3. انتظر حتى يكتمل التحميل

#### الخطوة 3: النشر مرة أخرى
```powershell
.\scripts\deploy.ps1
```

## إذا لم يعمل الحل السريع

### الحل البديل: البناء بدون Cache

```powershell
$PROJECT_ID = gcloud config get-value project
$IMAGE_NAME = "gcr.io/$PROJECT_ID/altayar-backend"

# بناء بدون cache (يستغرق وقتاً أطول لكن يحل المشكلة)
docker build --no-cache -t $IMAGE_NAME:latest .

# رفع الصورة
docker push $IMAGE_NAME:latest

# النشر
gcloud run deploy altayar-backend `
    --image $IMAGE_NAME:latest `
    --platform managed `
    --region us-central1 `
    --allow-unauthenticated `
    --port 8080 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --max-instances 10 `
    --min-instances 1 `
    --concurrency 80 `
    --set-env-vars "NODE_ENV=production"
```

## التحقق من النجاح

```powershell
# اختبار API
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health

# عرض السجلات
gcloud run services logs tail altayar-backend --region us-central1
```

## ملاحظات

- البناء بدون cache يستغرق 5-10 دقائق لكنه يحل معظم المشاكل
- تنظيف Docker cache يحرر مساحة على القرص
- إعادة تشغيل Docker Desktop يحل المشاكل المؤقتة

---

**بعد تطبيق هذه الخطوات، يجب أن يعمل كل شيء!** ✅

