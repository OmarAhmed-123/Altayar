# 🚀 ابدأ من هنا - إصلاح قاعدة البيانات

## 🔍 المشكلة

السيرفر يعمل لكن قاعدة البيانات غير متصلة:
```json
{
  "database": {
    "status": "disconnected"
  }
}
```

---

## ✅ الحل السريع

### شغّل هذا الملف:
```cmd
fix-cloud-sql-complete.bat
```

### سيطلب منك:
1. كلمة سر قاعدة البيانات
2. JWT_SECRET (اضغط Enter للتوليد التلقائي)
3. SESSION_SECRET (اضغط Enter للتوليد التلقائي)
4. اختر طريقة الاتصال (1 أو 2)

---

## ✅ ما سيتم إصلاحه

1. ✅ التحقق من Cloud SQL instance
2. ✅ منح IAM permissions (Cloud SQL Client role)
3. ✅ تحديث Cloud Run service
4. ✅ اختبار الاتصال

---

## ✅ النتيجة

- ✅ قاعدة البيانات متصلة
- ✅ Register/Login يعمل
- ✅ لا مزيد من ECONNREFUSED

---

**جاهز! شغّل `fix-cloud-sql-complete.bat` الآن! 🎉**

