#!/usr/bin/env node

/**
 * Script to rebuild Android app after installing react-native-webview
 * This ensures native modules are properly linked
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Rebuilding Android app for react-native-webview...\n');

const projectRoot = process.cwd();
const androidDir = path.join(projectRoot, 'android');

try {
  // Step 1: Clean Gradle
  console.log('📦 Cleaning Gradle...');
  if (fs.existsSync(androidDir)) {
    const isWindows = process.platform === 'win32';
    const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';
    
    try {
      execSync(`cd android && ${gradlewCmd} clean`, { 
        stdio: 'inherit',
        shell: isWindows ? true : false,
        cwd: androidDir
      });
    } catch (error) {
      console.warn('⚠️  Could not run gradlew clean. Continuing...', error?.message || error);
    }
  }

  // Step 2: Remove build folders
  console.log('\n🗑️  Removing build folders...');
  const buildFolders = [
    path.join(androidDir, 'app', 'build'),
    path.join(androidDir, 'build'),
    path.join(androidDir, '.gradle'),
  ];

  buildFolders.forEach(folder => {
    if (fs.existsSync(folder)) {
      try {
        fs.rmSync(folder, { recursive: true, force: true });
        console.log(`   ✅ Removed: ${path.relative(projectRoot, folder)}`);
      } catch (error) {
        console.warn(`   ⚠️  Could not remove: ${path.relative(projectRoot, folder)}`, error?.message || error);
      }
    }
  });

  // Step 3: Clean Metro bundler cache
  console.log('\n🧹 Cleaning Metro bundler cache...');
  const cacheDir = path.join(projectRoot, 'node_modules', '.cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log('   ✅ Removed Metro cache');
    } catch (error) {
      console.warn('   ⚠️  Could not remove Metro cache', error?.message || error);
    }
  }

  // Step 4: Rebuild
  console.log('\n🔨 Rebuilding app...');
  if (fs.existsSync(androidDir)) {
    const isWindows = process.platform === 'win32';
    const gradlewCmd = isWindows ? 'gradlew.bat' : './gradlew';
    
    try {
      execSync(`cd android && ${gradlewCmd} assembleDebug`, { 
        stdio: 'inherit',
        shell: isWindows ? true : false,
        cwd: androidDir
      });
      console.log('\n✅ Rebuild complete!');
      console.log('📱 Now run: npx react-native run-android');
    } catch (error) {
      console.error('\n❌ Could not rebuild. Please run manually:', error?.message || error);
      if (isWindows) {
        console.error('   cd android && gradlew.bat assembleDebug');
      } else {
        console.error('   cd android && ./gradlew assembleDebug');
      }
      console.log('\n💡 Alternatively, you can run:');
      console.log('   npx react-native run-android');
      console.log('   (This will rebuild automatically)');
    }
  } else {
    console.error('❌ Android directory not found!');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error during rebuild:', error.message);
  process.exit(1);
}

