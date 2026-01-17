const fs = require('fs');
const path = require('path');

// Convert CamelCase to kebab-case for lucide icon names
// Handles numeric suffixes (e.g., Loader2 -> loader-2, Link2 -> link-2)
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')  // lowercase followed by uppercase
    .replace(/([A-Z])([A-Z])([a-z])/g, '$1-$2$3')  // consecutive uppercase
    .replace(/([a-z0-9])(\d)/g, '$1-$2')  // letter/digit followed by digit
    .toLowerCase();
}

function fixLucideImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Match: import { Icon1, Icon2, ... } from 'lucide-react'
    // Handles multiline imports too
    const barrelImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g;

    content = content.replace(barrelImportRegex, (match, icons) => {
      modified = true;

      // Extract icon names and filter out type imports
      const iconNames = icons
        .split(',')
        .map(name => name.trim())
        .filter(name => name && !name.startsWith('type '));

      if (iconNames.length === 0) return match; // Keep type imports as-is

      // Generate direct imports (use lucide-react/icons/* export path)
      const directImports = iconNames
        .map(iconName => {
          const kebabName = toKebabCase(iconName);
          return `import ${iconName} from 'lucide-react/icons/${kebabName}';`;
        })
        .join('\n');

      return `// Performance optimization: Direct imports instead of barrel file (saves 200-800ms per page)\n${directImports}`;
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all arguments (file paths)
if (process.argv.length < 3) {
  console.log('Usage: node fix-lucide-imports.js <file-path> [file-path2] ...');
  process.exit(1);
}

let fixed = 0;
for (let i = 2; i < process.argv.length; i++) {
  if (fixLucideImports(process.argv[i])) {
    fixed++;
  }
}

console.log(`\n📊 Total fixed: ${fixed}/${process.argv.length - 2} files`);
