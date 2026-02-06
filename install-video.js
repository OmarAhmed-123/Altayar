/**
 * Install react-native-video with proper flags
 * This script ensures react-native-video is installed correctly
 */

const { execSync } = require('child_process');

console.log('📦 Installing react-native-video...');

try {
  // Install react-native-video with legacy peer deps to avoid conflicts
  console.log('Running: npm install react-native-video@^5.2.1 --save --legacy-peer-deps');
  execSync('npm install react-native-video@^5.2.1 --save --legacy-peer-deps', {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
  });
  
  console.log('✅ react-native-video installed successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. For Android: cd android && ./gradlew clean && cd ..');
  console.log('2. For iOS: cd ios && pod install && cd ..');
  console.log('3. Rebuild the app: npm run android or npm run ios');
  console.log('4. Clear Metro cache: npm run start:reset');
  
} catch (error) {
  console.error('❌ Error installing react-native-video:', error?.message || error);
  console.log('');
  console.log('💡 Try running manually:');
  console.log('   npm install react-native-video@^5.2.1 --save --legacy-peer-deps');
  process.exit(1);
}

