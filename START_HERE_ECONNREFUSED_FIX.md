# 🚀 START HERE: Fix ECONNREFUSED Error

## المشكلة
```
api exception(500): connect econnrefused 127.0.0.1:5432
```

## الحل السريع

### 1. شغّل السكريبت:
```cmd
fix-database-connection-final.bat
```

### 2. اختر طريقة الاتصال:
- **1** = Cloud SQL Proxy (موصى به) ✅
- **2** = Public IP with SSL

### 3. أدخل كلمة سر قاعدة البيانات

### 4. انتظر 1-2 دقيقة

### 5. اختبر:
```
https://altayar-backend-kuwjte4rda-uc.a.run.app/api/health
```

---

## ✅ النتيجة المتوقعة

بعد التحديث:
- ✅ لا مزيد من أخطاء ECONNREFUSED
- ✅ Register/Login يعمل
- ✅ قاعدة البيانات متصلة

---

## 📚 للمزيد من التفاصيل

راجع: `الحل_النهائي_ECONNREFUSED.md`

---

**الحل جاهز! 🎉**

