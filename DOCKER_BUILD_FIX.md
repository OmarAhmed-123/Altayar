# إصلاح مشاكل Docker Build

## المشكلة: "parent snapshot does not exist"

هذه المشكلة تحدث عادة بسبب:
1. مشاكل في Docker cache
2. layers تالفة أو غير مكتملة
3. مشاكل في Docker Desktop

## الحلول السريعة

### الحل 1: تنظيف Docker Cache (موصى به)

```powershell
# تشغيل السكريبت المخصص
.\scripts\fix-docker-cache.ps1
```

أو يدوياً:
```powershell
# تنظيف build cache
docker builder prune -af

# تنظيف النظام (اختياري)
docker system prune -af
```

### الحل 2: البناء بدون Cache

```powershell
docker build --no-cache -t gcr.io/altayar-46d6f/altayar-backend:latest .
```

### الحل 3: إعادة تشغيل Docker Desktop

1. أغلق Docker Desktop
2. افتحه مرة أخرى
3. انتظر حتى يكتمل التحميل
4. حاول البناء مرة أخرى

### الحل 4: البناء خطوة بخطوة

```powershell
# 1. تحقق من Docker
docker --version
docker info

# 2. بناء بدون cache
docker build --no-cache --progress=plain -t test-build .

# 3. إذا نجح، ارفع الصورة
docker tag test-build gcr.io/altayar-46d6f/altayar-backend:latest
docker push gcr.io/altayar-46d6f/altayar-backend:latest
```

## التحقق من المشاكل

### 1. تحقق من مساحة القرص
```powershell
docker system df
```

إذا كانت المساحة ممتلئة، قم بتنظيف:
```powershell
docker system prune -af --volumes
```

### 2. تحقق من Docker Desktop
- تأكد من أن Docker Desktop يعمل
- تحقق من الإعدادات > Resources > Disk image size (يجب أن يكون كافياً)

### 3. تحقق من الملفات
```powershell
# تأكد من وجود Dockerfile
Test-Path Dockerfile

# تأكد من وجود package.json
Test-Path package.json
```

## النشر بعد الإصلاح

بعد إصلاح المشكلة:

```powershell
.\scripts\deploy.ps1
```

أو يدوياً:
```powershell
$PROJECT_ID = gcloud config get-value project
$IMAGE_NAME = "gcr.io/$PROJECT_ID/altayar-backend"

docker build --no-cache -t $IMAGE_NAME:latest .
docker push $IMAGE_NAME:latest

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

## ملاحظات مهمة

- البناء بدون cache (`--no-cache`) يستغرق وقتاً أطول لكنه يحل معظم المشاكل
- تنظيف Docker cache يحرر مساحة لكن قد يزيل images مفيدة
- إعادة تشغيل Docker Desktop يحل معظم المشاكل المؤقتة

---

**بعد تطبيق الحلول أعلاه، يجب أن يعمل البناء بشكل صحيح!** ✅

