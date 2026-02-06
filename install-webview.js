#!/usr/bin/env node

/**
 * Script to install react-native-webview
 * This script handles peer dependency conflicts automatically
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing react-native-webview...\n');

try {
  // Try with --legacy-peer-deps first
  console.log('Attempting installation with --legacy-peer-deps...');
  execSync('npm install react-native-webview@13.12.2 --save --legacy-peer-deps', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('\n✅ Successfully installed react-native-webview with --legacy-peer-deps');
} catch (error) {
  console.warn('\n⚠️ Installation with --legacy-peer-deps failed:', error?.message || error);
  console.log('\n⚠️ Installation with --legacy-peer-deps failed, trying with --force...');
  try {
    execSync('npm install react-native-webview@13.12.2 --save --force', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('\n✅ Successfully installed react-native-webview with --force');
  } catch (forceError) {
    console.error('\n❌ Forced installation failed:', forceError?.message || forceError);
    console.error('\n❌ Installation failed with both methods.');
    console.error('Please try manually:');
    console.error('  npm install react-native-webview@13.12.2 --save --legacy-peer-deps');
    process.exit(1);
  }
}

// Verify installation
const webviewPath = path.join(process.cwd(), 'node_modules', 'react-native-webview');
if (fs.existsSync(webviewPath)) {
  console.log('\n✅ Verification: react-native-webview is installed');
  console.log('📦 Location:', webviewPath);
  
  // Check package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.dependencies && packageJson.dependencies['react-native-webview']) {
    console.log('✅ Package.json updated');
    console.log('📌 Version:', packageJson.dependencies['react-native-webview']);
  }
  
  console.log('\n🎉 Installation complete!');
  console.log('\nNext steps:');
  console.log('1. For iOS: cd ios && pod install && cd ..');
  console.log('2. Clear cache: npx react-native start --reset-cache');
  console.log('3. Run the app: npx react-native run-android (or run-ios)');
} else {
  console.error('\n❌ Verification failed: react-native-webview not found in node_modules');
  console.error('Please try manual installation:');
  console.error('  npm install react-native-webview@13.12.2 --save --legacy-peer-deps');
  process.exit(1);
}

