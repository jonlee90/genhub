#!/usr/bin/env node

/**
 * Inject Firebase environment variables into Service Worker
 *
 * This script runs at build time to replace placeholder strings in the
 * Service Worker with actual environment variable values.
 *
 * Why: Service Workers in the public/ folder are static files that cannot
 * access process.env at runtime, so we must inject values at build time.
 */

const fs = require('fs');
const path = require('path');

console.log('[inject-sw-env] Starting environment variable injection...');

// Define required Firebase environment variables
const envVars = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate all required environment variables are present
const missing = Object.entries(envVars).filter(([_, value]) => !value);

if (missing.length > 0) {
  console.warn('\n⚠️  [inject-sw-env] WARNING: Missing Firebase environment variables:');
  missing.forEach(([key]) => {
    console.warn(`   - ${key}`);
  });
  console.warn('\nPlease add these variables to your .env.local file for push notifications to work.\n');
  console.warn('Example:');
  console.warn('NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key');
  console.warn('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com');
  console.warn('...\n');

  // Check if this is a production build
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  if (isProduction) {
    console.error('❌ [inject-sw-env] ERROR: Cannot build for production without Firebase configuration');
    process.exit(1);
  }

  // Development: warn but continue (allow dev server to start)
  console.warn('⚠️  [inject-sw-env] Continuing without Firebase configuration');
  console.warn('⚠️  Push notifications will NOT work until Firebase is configured\n');
  return;
}

// Read Service Worker file
const swPath = path.join(__dirname, '../public/firebase-messaging-sw.js');

if (!fs.existsSync(swPath)) {
  console.error(`\n❌ [inject-sw-env] ERROR: Service Worker file not found at: ${swPath}\n`);
  process.exit(1);
}

console.log(`[inject-sw-env] Reading Service Worker from: ${swPath}`);
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace placeholder strings with actual environment variable values
let replacementCount = 0;
Object.entries(envVars).forEach(([key, value]) => {
  const placeholder = `'${key}'`;
  const replacement = `'${value}'`;

  if (swContent.includes(placeholder)) {
    swContent = swContent.replace(new RegExp(placeholder, 'g'), replacement);
    replacementCount++;
    console.log(`[inject-sw-env] ✓ Injected ${key}`);
  }
});

if (replacementCount === 0) {
  console.warn('\n⚠️  [inject-sw-env] WARNING: No placeholders found in Service Worker');
  console.warn('⚠️  Make sure the Service Worker uses placeholder strings like:');
  console.warn("   apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',\n");
}

// Write updated content back to file
fs.writeFileSync(swPath, swContent, 'utf8');

console.log(`\n✅ [inject-sw-env] Successfully injected ${replacementCount} environment variables`);
console.log(`✅ [inject-sw-env] Service Worker is ready for deployment\n`);
