/**
 * Some React Native native modules create their codegen artifacts lazily during
 * Gradle builds. When we run `gradlew clean` from Windows CMD, those generated
 * folders may not exist yet, which makes the auto-generated
 * Android-autolinking.cmake bail out with:
 *   add_subdirectory ... which is not an existing directory
 *
 * To keep the build stable across clean environments, we eagerly create the
 * expected directories so CMake can safely add_subdirectory (even if it's just
 * an empty stub). The actual codegen output will overwrite these folders during
 * the next build step.
 */

const fs = require('fs');
const path = require('path');

const MODULES_WITH_CODEGEN = [
  '@react-native-async-storage/async-storage',
  'react-native-gesture-handler',
  'react-native-image-picker',
  'react-native-reanimated',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'react-native-webview',
  'react-native-worklets',
];

const PROJECT_ROOT = path.resolve(__dirname, '..');

const created = [];

for (const moduleName of MODULES_WITH_CODEGEN) {
  const targetDir = path.join(
    PROJECT_ROOT,
    'node_modules',
    moduleName,
    'android',
    'build',
    'generated',
    'source',
    'codegen',
    'jni'
  );

  try {
    fs.mkdirSync(targetDir, { recursive: true });
    const marker = path.join(targetDir, '.keep');
    if (!fs.existsSync(marker)) {
      fs.writeFileSync(
        marker,
        '// placeholder to keep directory for CMake autolinking\n',
        { encoding: 'utf8' }
      );
    }
    created.push(targetDir);
  } catch (error) {
    console.warn(`[codegen-stubs] Failed to ensure ${targetDir}: ${error.message}`);
  }
}

if (created.length > 0) {
  console.log('[codegen-stubs] Ensured codegen directories:', created.length);
}

