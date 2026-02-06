/**
 * Fallback helper to ensure the react-native-video patch is always applied.
 * 1. Checks whether Video.js already contains our critical guard comment.
 * 2. If not, it re-runs `npx patch-package react-native-video`.
 * 3. If patch-package fails, we print a clear instruction so the developer can re-run it manually.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const videoJsPath = path.join(__dirname, 'node_modules', 'react-native-video', 'Video.js');
const marker = 'CRITICAL FIX: Check if UIManager exists before accessing it';

if (!fs.existsSync(videoJsPath)) {
  console.error('❌ react-native-video/Video.js not found – did npm install complete?');
  process.exit(1);
}

const contents = fs.readFileSync(videoJsPath, 'utf8');

if (contents.includes(marker)) {
  console.log('✅ react-native-video patch already applied (marker found).');
  process.exit(0);
}

try {
  console.log('🛠  Applying react-native-video patch via patch-package fallback...');
  execSync('npx patch-package react-native-video', { stdio: 'inherit' });
  console.log('✅ Patch applied successfully.');
} catch (error) {
  console.error('❌ Failed to apply react-native-video patch automatically.');
  console.error('   Please run `npx patch-package react-native-video` manually.');
  console.error('   Original error:', error.message);
  process.exit(1);
}

