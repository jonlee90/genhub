const fs = require('fs');
const glob = require('glob');

const replacements = [
  ['lucide-react/icons/check-circle2', 'lucide-react/icons/check-circle-2'],
  ['lucide-react/icons/mouse-pointer2', 'lucide-react/icons/mouse-pointer-2'],
];

const files = glob.sync('components/projects/**/*.tsx');

let fixed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n📊 Total fixed: ${fixed} files`);
