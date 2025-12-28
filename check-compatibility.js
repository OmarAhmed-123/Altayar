#!/usr/bin/env node

/**
 * Script to check compatibility between backend and frontend
 * Verifies API endpoints, CORS, and configuration
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.argv[2] || process.env.BACKEND_URL;

if (!BACKEND_URL) {
    console.error('❌ Error: Backend URL is required');
    console.log('Usage: node check-compatibility.js <BACKEND_URL>');
    console.log('Or set BACKEND_URL environment variable');
    process.exit(1);
}

const API_URL = BACKEND_URL.endsWith('/api') ? BACKEND_URL : `${BACKEND_URL}/api`;

console.log('🔍 Checking Backend-Frontend Compatibility...');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`API URL: ${API_URL}`);
console.log('');

// Test function
function testEndpoint(url, description) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        success: res.statusCode === 200,
                        statusCode: res.statusCode,
                        data: json,
                        headers: res.headers
                    });
                } catch (e) {
                    resolve({
                        success: res.statusCode === 200,
                        statusCode: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({
                success: false,
                error: err.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Timeout'
            });
        });
    });
}

async function runTests() {
    const results = {
        health: null,
        api: null,
        cors: null,
        frontend: null
    };
    
    // Test 1: Health Check
    console.log('1️⃣  Testing Health Endpoint...');
    results.health = await testEndpoint(`${API_URL}/health`, 'Health Check');
    if (results.health.success) {
        console.log('   ✅ Health check passed');
        if (results.health.data.recommendedBaseUrl) {
            console.log(`   📍 Recommended URL: ${results.health.data.recommendedBaseUrl}`);
        }
    } else {
        console.log(`   ❌ Health check failed: ${results.health.error || results.health.statusCode}`);
    }
    console.log('');
    
    // Test 2: API Root
    console.log('2️⃣  Testing API Root...');
    results.api = await testEndpoint(`${API_URL}`, 'API Root');
    if (results.api.success) {
        console.log('   ✅ API root accessible');
    } else {
        console.log(`   ❌ API root failed: ${results.api.error || results.api.statusCode}`);
    }
    console.log('');
    
    // Test 3: CORS
    console.log('3️⃣  Testing CORS Configuration...');
    const corsTest = await new Promise((resolve) => {
        const client = API_URL.startsWith('https') ? https : http;
        const url = new URL(`${API_URL}/health`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://example.com',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
            }
        };
        
        const req = client.request(options, (res) => {
            resolve({
                success: res.statusCode === 200 || res.statusCode === 204,
                statusCode: res.statusCode,
                headers: res.headers
            });
        });
        
        req.on('error', (err) => {
            resolve({
                success: false,
                error: err.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Timeout'
            });
        });
        
        req.end();
    });
    
    results.cors = corsTest;
    if (results.cors.success) {
        const corsHeaders = results.cors.headers['access-control-allow-origin'];
        if (corsHeaders) {
            console.log(`   ✅ CORS configured: ${corsHeaders}`);
        } else {
            console.log('   ⚠️  CORS headers not found');
        }
    } else {
        console.log(`   ❌ CORS test failed: ${results.cors.error || results.cors.statusCode}`);
    }
    console.log('');
    
    // Test 4: Frontend Configuration
    console.log('4️⃣  Checking Frontend Configuration...');
    const frontendConfigPath = path.join('E:', 'AltayarFlutter', 'Altayar', 'lib', 'core', 'config', 'app_config.dart');
    if (fs.existsSync(frontendConfigPath)) {
        const content = fs.readFileSync(frontendConfigPath, 'utf8');
        const urlMatch = content.match(/defaultValue:\s*['"]([^'"]+)['"]/);
        if (urlMatch) {
            const currentUrl = urlMatch[1];
            const expectedUrl = `${API_URL}`;
            if (currentUrl === expectedUrl) {
                console.log(`   ✅ Frontend configured correctly: ${currentUrl}`);
                results.frontend = { success: true, url: currentUrl };
            } else {
                console.log(`   ⚠️  Frontend URL mismatch:`);
                console.log(`      Current: ${currentUrl}`);
                console.log(`      Expected: ${expectedUrl}`);
                console.log(`   💡 Run: update-frontend-config.bat ${BACKEND_URL}`);
                results.frontend = { success: false, current: currentUrl, expected: expectedUrl };
            }
        } else {
            console.log('   ⚠️  Could not find API URL in frontend config');
            results.frontend = { success: false, error: 'URL not found' };
        }
    } else {
        console.log(`   ⚠️  Frontend config not found at: ${frontendConfigPath}`);
        results.frontend = { success: false, error: 'File not found' };
    }
    console.log('');
    
    // Summary
    console.log('========================================');
    console.log('📊 Compatibility Summary');
    console.log('========================================');
    console.log(`Health Check: ${results.health?.success ? '✅' : '❌'}`);
    console.log(`API Root: ${results.api?.success ? '✅' : '❌'}`);
    console.log(`CORS: ${results.cors?.success ? '✅' : '❌'}`);
    console.log(`Frontend Config: ${results.frontend?.success ? '✅' : '⚠️'}`);
    console.log('');
    
    if (results.health?.success && results.api?.success && results.cors?.success) {
        console.log('✅ Backend is ready and compatible with frontend!');
        if (!results.frontend?.success) {
            console.log('⚠️  Please update frontend configuration');
        }
    } else {
        console.log('❌ Some compatibility issues found. Please check the errors above.');
    }
}

runTests().catch(console.error);

