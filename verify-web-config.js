#!/usr/bin/env node

/**
 * Script to verify web app configuration and connectivity
 * Checks:
 * 1. Flutter app_config.dart uses production URL
 * 2. Backend API is accessible
 * 3. Database connection is configured correctly
 * 4. CORS is properly configured
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const PRODUCTION_API_URL = 'https://altayar-backend-kuwjte4rda-uc.a.run.app/api';
const FLUTTER_CONFIG_PATH = path.join('E:', 'AltayarFlutter', 'Altayar', 'lib', 'core', 'config', 'app_config.dart');

console.log('🔍 التحقق من إعدادات التطبيق...\n');
console.log('='.repeat(60));

// Check 1: Flutter app_config.dart
console.log('\n1️⃣ فحص إعدادات Flutter...');
if (fs.existsSync(FLUTTER_CONFIG_PATH)) {
    const content = fs.readFileSync(FLUTTER_CONFIG_PATH, 'utf8');
    
    // Check if production URL is set
    if (content.includes('altayar-backend-kuwjte4rda-uc.a.run.app')) {
        console.log('✅ Flutter config يحتوي على رابط الإنتاج');
    } else {
        console.log('⚠️  Flutter config لا يحتوي على رابط الإنتاج');
    }
    
    // Check if kIsWeb is used
    if (content.includes('kIsWeb')) {
        console.log('✅ Flutter config يستخدم kIsWeb للتحقق من منصة الويب');
    } else {
        console.log('⚠️  Flutter config لا يستخدم kIsWeb');
    }
    
    // Check if web platform forces production URL
    if (content.includes('kIsWeb') && content.includes('altayar-backend-kuwjte4rda-uc.a.run.app')) {
        console.log('✅ Flutter config يجبر استخدام رابط الإنتاج للويب');
    } else {
        console.log('⚠️  Flutter config قد لا يجبر استخدام رابط الإنتاج للويب');
    }
} else {
    console.log('❌ ملف Flutter config غير موجود:', FLUTTER_CONFIG_PATH);
}

// Check 2: Backend API accessibility
console.log('\n2️⃣ فحص إمكانية الوصول إلى Backend API...');
const testBackendConnection = () => {
    return new Promise((resolve) => {
        const url = new URL(`${PRODUCTION_API_URL}/health`);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.status === 'OK' || json.status === 'DEGRADED') {
                        console.log('✅ Backend API متاح ويمكن الوصول إليه');
                        console.log(`   Status: ${json.status}`);
                        console.log(`   Database: ${json.database?.status || 'unknown'}`);
                        if (json.database?.status === 'disconnected') {
                            console.log('   ⚠️  قاعدة البيانات غير متصلة - يجب إضافة Environment Variables');
                        }
                        resolve(true);
                    } else {
                        console.log('⚠️  Backend API متاح لكن الحالة غير طبيعية');
                        resolve(false);
                    }
                } catch (e) {
                    console.log('⚠️  Backend API متاح لكن الرد غير صحيح');
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ لا يمكن الوصول إلى Backend API:', error.message);
            console.log('   تأكد من أن السيرفر منشور على Cloud Run');
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('❌ انتهت مهلة الاتصال بـ Backend API');
            req.destroy();
            resolve(false);
        });
    });
};

// Check 3: Environment variables
console.log('\n3️⃣ فحص Environment Variables...');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
    const missing = [];
    
    requiredVars.forEach(varName => {
        const regex = new RegExp(`^${varName}=`, 'm');
        if (regex.test(envContent)) {
            console.log(`✅ ${varName} موجود`);
        } else {
            console.log(`⚠️  ${varName} غير موجود`);
            missing.push(varName);
        }
    });
    
    if (missing.length > 0) {
        console.log('\n⚠️  Environment Variables المفقودة:', missing.join(', '));
        console.log('   استخدم: ADD_ENV_VARS.bat لإضافتها');
    }
} else {
    console.log('⚠️  ملف .env غير موجود');
    console.log('   استخدم: ADD_ENV_VARS.bat لإنشائه');
}

// Check 4: CORS configuration
console.log('\n4️⃣ فحص إعدادات CORS...');
const serverJsPath = path.join(__dirname, 'server.js');
if (fs.existsSync(serverJsPath)) {
    const content = fs.readFileSync(serverJsPath, 'utf8');
    
    if (content.includes('.web.app') || content.includes('.firebaseapp.com')) {
        console.log('✅ CORS يدعم Firebase Hosting domains');
    } else {
        console.log('⚠️  CORS قد لا يدعم Firebase Hosting domains');
    }
    
    if (content.includes('.run.app')) {
        console.log('✅ CORS يدعم Cloud Run domains');
    } else {
        console.log('⚠️  CORS قد لا يدعم Cloud Run domains');
    }
    
    if (content.includes('isFirebaseHosting') || content.includes('isKnownHosting')) {
        console.log('✅ CORS يحتوي على منطق تلقائي للـ hosting domains');
    } else {
        console.log('⚠️  CORS قد لا يحتوي على منطق تلقائي للـ hosting domains');
    }
} else {
    console.log('❌ ملف server.js غير موجود');
}

// Run all checks
(async () => {
    await testBackendConnection();
    
    console.log('\n' + '='.repeat(60));
    console.log('\n📋 ملخص التحقق:\n');
    console.log('✅ تم التحقق من الإعدادات');
    console.log('\n💡 الخطوات التالية:');
    console.log('1. تأكد من أن Flutter app_config.dart يستخدم رابط الإنتاج');
    console.log('2. تأكد من أن Backend API متاح على Cloud Run');
    console.log('3. أضف Environment Variables باستخدام ADD_ENV_VARS.bat');
    console.log('4. أعد بناء ونشر التطبيق للويب');
    console.log('\n🔗 روابط مفيدة:');
    console.log(`   Backend API: ${PRODUCTION_API_URL}`);
    console.log(`   Health Check: ${PRODUCTION_API_URL}/health`);
    console.log('\n');
})();

