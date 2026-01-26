/**
 * Debug script for Task Templates functionality
 * Run with: npx tsx test-task-templates-debug.ts
 */

// Check 1: Verify icon mapping matches database
const DATABASE_ICONS = [
  'CheckCircle2',
  'ClipboardCheck',
  'FileText',
  'FolderKanban',
  'HardHat',
  'Layers',
  'Rocket',
  'ShoppingCart',
  'Wrench'
];

const PHASE_TEMPLATE_ICONS = {
  Rocket: 'Rocket',
  FileText: 'FileText',
  ShoppingCart: 'ShoppingCart',
  FolderKanban: 'FolderKanban',
  CheckCircle2: 'CheckCircle2',
  Layers: 'Layers',
  Sparkles: 'Sparkles',
  Calendar: 'Calendar',
  HardHat: 'HardHat',
  Hammer: 'Hammer',
  Wrench: 'Wrench',
  ClipboardCheck: 'ClipboardCheck',
  Package: 'Package',
  Truck: 'Truck',
  Flag: 'Flag',
};

console.log('=== Icon Mapping Check ===');
console.log('Icons in Database:', DATABASE_ICONS);
console.log('Icons in Component:', Object.keys(PHASE_TEMPLATE_ICONS));

const missingIcons = DATABASE_ICONS.filter(icon => !PHASE_TEMPLATE_ICONS[icon as keyof typeof PHASE_TEMPLATE_ICONS]);
const extraIcons = Object.keys(PHASE_TEMPLATE_ICONS).filter(icon => !DATABASE_ICONS.includes(icon));

if (missingIcons.length > 0) {
  console.error('❌ Missing icons in component:', missingIcons);
} else {
  console.log('✅ All database icons are mapped');
}

if (extraIcons.length > 0) {
  console.log('ℹ️  Extra icons in component (not in DB):', extraIcons);
}

console.log('\n=== Component Files Check ===');
console.log('Files to verify:');
console.log('1. components/settings/PhaseTemplateManager.tsx');
console.log('2. components/settings/TaskTemplateManager.tsx');
console.log('3. components/settings/ProjectConfigurationSection.tsx');
console.log('4. app/actions/phase-templates.ts');
console.log('5. app/actions/task-templates.ts');

console.log('\n=== Data Flow ===');
console.log('1. User navigates to Settings > Project Configuration');
console.log('2. ProjectConfigurationSection loads project types and phases');
console.log('3. User selects "Task Templates" tab');
console.log('4. TaskTemplateManager receives:');
console.log('   - projectTypes (from parent)');
console.log('   - phaseTemplates (from parent)');
console.log('   - taskTypes (from parent)');
console.log('5. User selects project type and phase from dropdowns');
console.log('6. TaskTemplateManager calls getTaskTemplates(phaseId)');
console.log('7. Task templates display in sortable list');

console.log('\n=== Potential Issues to Check ===');
console.log('1. Are phase templates loading correctly?');
console.log('2. Are task templates being fetched for the selected phase?');
console.log('3. Is the icon mapping working (icon_name field)?');
console.log('4. Are the dropdowns showing correct data?');
console.log('5. Are create/update/delete operations working?');
