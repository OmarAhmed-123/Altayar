/**
 * Script to replace all Icon imports and usage with SafeIcon
 * Run with: node replace-icons-script.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/TSX files in src directory
const files = glob.sync('src/**/*.{ts,tsx}', { absolute: true });

let totalReplacements = 0;

files.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Replace import statement
    if (content.includes("import Icon from 'react-native-vector-icons/MaterialIcons';")) {
      content = content.replace(
        /import Icon from ['"]react-native-vector-icons\/MaterialIcons['"];?/g,
        "import { SafeIcon } from './../../utils/iconHelper';"
      );
      modified = true;
    }

    // Replace relative imports
    if (content.includes("import Icon from './")) {
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, 'src/utils/iconHelper.ts'));
      const importPath = relativePath.replace(/\\/g, '/').replace(/\.ts$/, '');
      content = content.replace(
        /import Icon from ['"]\.\/.*react-native-vector-icons\/MaterialIcons['"];?/g,
        `import { SafeIcon } from '${importPath}';`
      );
      modified = true;
    }

    // Replace JSX usage: <Icon with <SafeIcon
    if (content.includes('<Icon ')) {
      const iconMatches = content.match(/<Icon\s+[^>]*>/g);
      if (iconMatches) {
        content = content.replace(/<Icon\s+/g, '<SafeIcon ');
        modified = true;
        totalReplacements += iconMatches.length;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n✨ Total replacements: ${totalReplacements}`);
console.log('Done!');

