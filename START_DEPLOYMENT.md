# 🚀 ابدأ النشر الآن!

## الخطوات السريعة (3 دقائق)

### ✅ الخطوة 1: التحقق من الخطوط
الخطوط موجودة في `assets/fonts/static/` - ممتاز! ✅

### ✅ الخطوة 2: النشر

#### على Windows (PowerShell):
```powershell
cd E:\Altayar-app\Altayar-app-final\backend
.\scripts\deploy.ps1
```

#### أو النشر اليدوي:
```powershell
# 1. تعيين المشروع
$PROJECT_ID = gcloud config get-value project
$IMAGE_NAME = "gcr.io/$PROJECT_ID/altayar-backend"

# 2. بناء الصورة
docker build -t $IMAGE_NAME:latest .

# 3. رفع الصورة
docker push $IMAGE_NAME:latest

# 4. النشر
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
    --set-env-vars "NODE_ENV=production,PORT=8080"
```

### ✅ الخطوة 3: التحقق

```powershell
# اختبار API
curl https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health

# عرض السجلات
gcloud run services logs tail altayar-backend --region us-central1
```

## 📋 ما تم إعداده

✅ Dockerfile محدث ليشمل خطوط Cairo
✅ سكريبتات النشر جاهزة (deploy.ps1 و deploy.sh)
✅ الكود محدث للبحث عن الخطوط في `static/` folder
✅ جميع ملفات الإعداد جاهزة

## 📚 للمزيد من التفاصيل

- `FINAL_DEPLOYMENT_GUIDE.md` - دليل شامل
- `DEPLOY_TO_CLOUD_RUN.md` - تعليمات مفصلة
- `DEPLOYMENT_CHECKLIST.md` - قائمة التحقق

## ⚠️ ملاحظة مهمة

بعد النشر، تحقق من السجلات للتأكد من:
```
✅ [PDF Font] Cairo Regular registered: ...
✅ [PDF Font] Cairo Bold registered: ...
```

إذا لم تراها، تأكد من أن الخطوط موجودة في الصورة.

---

**جاهز للنشر! ابدأ الآن!** 🚀

