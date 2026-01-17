const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix all lucide import paths from dist/esm to icons
const files = glob.sync('components/projects/**/*.tsx');

let fixed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace the old path with the new path
  content = content.replace(
    /from ['"]lucide-react\/dist\/esm\/icons\//g,
    "from 'lucide-react/icons/"
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n📊 Total fixed: ${fixed} files`);
