/**
 * ==========================================
 * تحديث Backend CORS - ملف مساعد
 * ==========================================
 * 
 * هذا الملف يحتوي على الكود المطلوب لتحديث Backend CORS
 * 
 * الخطوات:
 * 1. افتح ملف: E:\Altayar-app\Altayar-app-final\backend\server.js
 * 2. ابحث عن: app.use(cors({
 * 3. استبدل الكود بالكود الموجود في هذا الملف
 * 4. أعد تشغيل Backend server
 * ==========================================
 */

// ==========================================
// الحل الموصى به (للتنمية)
// ==========================================
const corsConfigDevelopment = {
    origin: true,  // ✅ السماح بجميع Origins في التطوير
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// ==========================================
// الحل البديل (تحديد IPs محددة)
// ==========================================
const corsConfigWithIPs = {
    origin: [
        "http://localhost:3000",
        "http://10.0.2.2:3000",
        "http://192.168.1.4:5000",
        /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // ✅ السماح بجميع IPs في الشبكة المحلية
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// ==========================================
// الكود الكامل للاستبدال في server.js
// ==========================================
const fullCorsCode = `
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : true,  // ✅ السماح بجميع Origins في التطوير
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
`;

// ==========================================
// الكود الكامل مع IPs محددة
// ==========================================
const fullCorsCodeWithIPs = `
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : [
            "http://localhost:3000",
            "http://10.0.2.2:3000",
            "http://192.168.1.4:5000",
            new RegExp('^http://192\\.168\\.\\d+\\.\\d+:\\d+$'),
        ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
`;

module.exports = {
    corsConfigDevelopment,
    corsConfigWithIPs,
    fullCorsCode,
    fullCorsCodeWithIPs
};

