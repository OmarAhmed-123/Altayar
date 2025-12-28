# إعداد خطوط Cairo للغة العربية في ملفات PDF

## الطريقة التلقائية

```bash
node scripts/downloadCairoFonts.js
```

## الطريقة اليدوية

1. قم بزيارة: https://fonts.google.com/specimen/Cairo
2. اضغط على "Download family"
3. استخرج ملف ZIP
4. انسخ الملفات التالية إلى `assets/fonts/`:
   - `Cairo-Regular.ttf`
   - `Cairo-Bold.ttf`

## التحقق من التثبيت

بعد إضافة الخطوط، تأكد من وجود الملفات:
- `assets/fonts/Cairo-Regular.ttf`
- `assets/fonts/Cairo-Bold.ttf`

## ملاحظات

- الخطوط ضرورية لعرض النصوص العربية بشكل صحيح في ملفات PDF
- بدون الخطوط، سيتم استخدام Helvetica كبديل (لن تعرض العربية بشكل صحيح)
- النظام سيعمل بدون الخطوط، لكن النصوص العربية قد تظهر كرموز

