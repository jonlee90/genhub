const fs = require('fs');
const glob = require('glob');

// Mapping of incorrect to correct icon names
const iconNameFixes = {
  'loader2': 'loader-2',
  'link2': 'link-2',
  'xCircle': 'x-circle',
  'checkCircle2': 'check-circle-2',
  'checkCircle': 'check-circle',
  'alertCircle': 'alert-circle',
  'alertTriangle': 'alert-triangle',
  'chevronDown': 'chevron-down',
  'chevronRight': 'chevron-right',
  'chevronLeft': 'chevron-left',
  'chevronUp': 'chevron-up',
};

const files = glob.sync('components/projects/**/*.tsx');

let fixed = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix each incorrect icon name
  for (const [incorrect, correct] of Object.entries(iconNameFixes)) {
    const patterns = [
      new RegExp(`from 'lucide-react/icons/${incorrect}'`, 'g'),
      new RegExp(`from "lucide-react/icons/${incorrect}"`, 'g'),
    ];

    for (const pattern of patterns) {
      content = content.replace(pattern, `from 'lucide-react/icons/${correct}'`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n📊 Total fixed: ${fixed} files`);
