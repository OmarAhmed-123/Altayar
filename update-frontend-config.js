#!/usr/bin/env node

/**
 * Script to update Flutter frontend configuration with deployed backend URL
 * Usage: node update-frontend-config.js <BACKEND_URL>
 */

const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.argv[2];

if (!BACKEND_URL) {
    console.error('❌ Error: Backend URL is required');
    console.log('Usage: node update-frontend-config.js <BACKEND_URL>');
    console.log('Example: node update-frontend-config.js https://altayar-backend-xxxxx-uc.a.run.app');
    process.exit(1);
}

// Ensure URL ends with /api
const apiUrl = BACKEND_URL.endsWith('/api') 
    ? BACKEND_URL 
    : BACKEND_URL.endsWith('/') 
        ? `${BACKEND_URL}api`
        : `${BACKEND_URL}/api`;

// Try multiple possible paths
const possiblePaths = [
    path.join('E:', 'Altayar82', 'lib', 'core', 'config', 'app_config.dart'),
    path.join('E:', 'AltayarFlutter', 'Altayar', 'lib', 'core', 'config', 'app_config.dart'),
    path.join(__dirname, '..', '..', 'Altayar82', 'lib', 'core', 'config', 'app_config.dart'),
    path.join(__dirname, '..', '..', 'AltayarFlutter', 'Altayar', 'lib', 'core', 'config', 'app_config.dart'),
    path.join(__dirname, '..', 'Altayar82', 'lib', 'core', 'config', 'app_config.dart'),
    path.join(__dirname, '..', 'AltayarFlutter', 'Altayar', 'lib', 'core', 'config', 'app_config.dart'),
];

let frontendConfigPath = null;
for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
        frontendConfigPath = possiblePath;
        break;
    }
}

if (!frontendConfigPath || !fs.existsSync(frontendConfigPath)) {
    console.error(`❌ Error: Frontend config file not found`);
    console.log('Searched in:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    console.log('\nPlease ensure the Flutter project is at: E:\\Altayar82 or E:\\AltayarFlutter\\Altayar');
    console.log('\nYou can manually update app_config.dart:');
    console.log(`   Change defaultValue to: '${apiUrl}'`);
    process.exit(1);
}

console.log(`📝 Updating frontend configuration...`);
console.log(`   File: ${frontendConfigPath}`);
console.log(`   New API URL: ${apiUrl}`);

// Read the file
let content = fs.readFileSync(frontendConfigPath, 'utf8');

// Update the default value
const oldPattern = /defaultValue:\s*['"]([^'"]+)['"]/;
const newDefaultValue = `defaultValue: '${apiUrl}'`;

if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newDefaultValue);
    console.log('✅ Updated default API URL');
} else {
    console.warn('⚠️  Could not find defaultValue pattern, adding comment instead');
    // Add a comment at the top of the file
    content = `// Updated API URL: ${apiUrl}\n// To use this URL, run: flutter run --dart-define=API_BASE_URL=${apiUrl}\n\n${content}`;
}

// Write the file
fs.writeFileSync(frontendConfigPath, content, 'utf8');

console.log('');
console.log('✅ Frontend configuration updated successfully!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Rebuild your Flutter app:');
console.log(`   flutter build apk --dart-define=API_BASE_URL=${apiUrl}`);
console.log('   or');
console.log(`   flutter run --dart-define=API_BASE_URL=${apiUrl}`);
console.log('');
console.log('2. Or update the default value in app_config.dart manually');

