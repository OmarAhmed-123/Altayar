/**
 * Clean Android Build Script
 * This script cleans all Android build artifacts and caches
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning Android build artifacts...\n');

const androidDir = path.join(__dirname, 'android');
const buildDirs = [
  path.join(androidDir, 'app', 'build'),
  path.join(androidDir, 'build'),
  path.join(androidDir, '.gradle'),
  path.join(androidDir, 'app', '.cxx'),
];

// Remove build directories
buildDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Removing: ${dir}`);
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Warning: Could not remove ${dir}: ${error.message}`);
    }
  }
});

// Clean Gradle cache
console.log('\n🧹 Running Gradle clean...');
try {
  process.chdir(androidDir);
  execSync('gradlew.bat clean', { stdio: 'inherit' });
} catch (error) {
  console.warn('Warning: Gradle clean failed:', error.message);
}

console.log('\n✅ Android cleanup complete!');
console.log('💡 Next steps:');
console.log('   1. Run: npm install');
console.log('   2. Run: npx react-native run-android');
