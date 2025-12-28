#!/usr/bin/env node

/**
 * Script to update React Native frontend configuration with deployed backend URL
 * Usage: node update-react-native-config.js <BACKEND_URL>
 */

const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.argv[2];

if (!BACKEND_URL) {
    console.error('❌ Error: Backend URL is required');
    console.log('Usage: node update-react-native-config.js <BACKEND_URL>');
    console.log('Example: node update-react-native-config.js https://altayar-backend-xxxxx-uc.a.run.app');
    process.exit(1);
}

// Ensure URL ends with /api
const apiUrl = BACKEND_URL.endsWith('/api') 
    ? BACKEND_URL 
    : BACKEND_URL.endsWith('/') 
        ? `${BACKEND_URL}api`
        : `${BACKEND_URL}/api`;

// Try multiple possible paths for React Native
const possiblePaths = [
    path.join('E:', 'Altayar82', 'src', 'constants', 'theme.ts'),
    path.join('E:', 'Altayar82', 'src', 'services', 'api.ts'),
    path.join('E:', 'Altayar82', 'src', 'services', 'apiClient.ts'),
    path.join('E:', 'Altayar82', 'src', 'config', 'api.ts'),
    path.join('E:', 'Altayar82', 'src', 'config', 'config.ts'),
    path.join('E:', 'Altayar82', 'src', 'constants', 'api.ts'),
    path.join('E:', 'Altayar82', 'constants', 'api.ts'),
    path.join(__dirname, '..', '..', 'Altayar82', 'src', 'constants', 'theme.ts'),
];

let configPath = null;
for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
        configPath = possiblePath;
        break;
    }
}

if (!configPath) {
    console.error(`❌ Error: API config file not found`);
    console.log('Searched in:');
    possiblePaths.forEach(p => console.log(`   - ${p}`));
    console.log('\nPlease update manually:');
    console.log(`   Change API_BASE_URL to: '${apiUrl}'`);
    process.exit(1);
}

console.log(`📝 Updating React Native API configuration...`);
console.log(`   File: ${configPath}`);
console.log(`   New API URL: ${apiUrl}`);

// Read the file
let content = fs.readFileSync(configPath, 'utf8');

// Try multiple patterns
let updated = false;

// Pattern 1: export const API_BASE_URL = `http://...`
const pattern1 = /export\s+const\s+API_BASE_URL\s*=\s*`[^`]+`/g;
if (pattern1.test(content)) {
    content = content.replace(pattern1, `export const API_BASE_URL = \`${apiUrl}\``);
    updated = true;
}

// Pattern 2: const API_BASE_URL = '...'
if (!updated) {
    const pattern2 = /(const|let|var)\s+API_BASE_URL\s*=\s*['"]([^'"]+)['"]/gi;
    if (pattern2.test(content)) {
        content = content.replace(pattern2, `$1 API_BASE_URL = '${apiUrl}'`);
        updated = true;
    }
}

// Pattern 3: API_BASE_URL: '...'
if (!updated) {
    const pattern3 = /API_BASE_URL\s*:\s*['"]([^'"]+)['"]/gi;
    if (pattern3.test(content)) {
        content = content.replace(pattern3, `API_BASE_URL: '${apiUrl}'`);
        updated = true;
    }
}

// Pattern 4: Replace getBackendHost function to return production URL
if (!updated) {
    // Replace the entire getBackendHost function to return production URL directly
    const getBackendHostPattern = /const\s+getBackendHost\s*=\s*\([^)]*\)\s*=>\s*\{[^}]*\}/gs;
    if (getBackendHostPattern.test(content)) {
        content = content.replace(getBackendHostPattern, 
            `const getBackendHost = () => {
  // Production: Use Cloud Run URL
  if (!__DEV__) {
    return 'altayar-backend-kuwjte4rda-uc.a.run.app';
  }
  // Development: Use local IP
  if (Platform.OS === 'android' && __DEV__) {
    return COMPUTER_IP;
  }
  if (Platform.OS === 'ios' && __DEV__) {
    return 'localhost';
  }
  return COMPUTER_IP;
};`
        );
        // Also update API_BASE_URL to use https in production
        const apiBaseUrlPattern = /export\s+const\s+API_BASE_URL\s*=\s*`[^`]+`/;
        if (apiBaseUrlPattern.test(content)) {
            content = content.replace(apiBaseUrlPattern, 
                `export const API_BASE_URL = __DEV__ 
  ? \`http://\${getBackendHost()}:${BACKEND_PORT}${API_PATH}\`
  : \`${apiUrl}\`;`
            );
            updated = true;
        }
    }
}

// Pattern 5: Simple URL replacement
if (!updated) {
    const urlPattern = /http:\/\/[^\s'"]+:5000\/api/g;
    if (urlPattern.test(content)) {
        content = content.replace(urlPattern, apiUrl);
        updated = true;
    }
}

if (!updated) {
    console.warn('⚠️  Could not find API URL pattern, adding comment instead');
    // Add a comment at the top of the file
    content = `// Updated API URL: ${apiUrl}\n// To use this URL, update API_BASE_URL constant\n\n${content}`;
} else {
    console.log('✅ Updated API URL');
}

// Write the file
fs.writeFileSync(configPath, content, 'utf8');

console.log('');
console.log('✅ React Native configuration updated successfully!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Rebuild your React Native app:');
console.log(`   npx react-native run-android`);
console.log('   or');
console.log(`   npx react-native run-ios`);
console.log('');

