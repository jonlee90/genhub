# Firebase Setup Guide - Push Notifications

This guide explains how to set up Firebase Cloud Messaging for push notifications in GenHub.

## Overview

The Service Worker environment variable injection system ensures Firebase credentials are securely embedded at build time, not exposed in client-side code.

---

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Enter project name (e.g., "GenHub PWA")
4. Disable Google Analytics (optional)
5. Click "Create project"

---

## Step 2: Register Web App

1. In Firebase Console, click the **Web icon** (</>) to add a web app
2. Enter app nickname: "GenHub Web App"
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase config object** - you'll need these values

The config looks like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

## Step 3: Enable Cloud Messaging

1. In Firebase Console sidebar, click **Build** → **Cloud Messaging**
2. Click **Get Started** if prompted
3. No additional configuration needed - messaging is auto-enabled

---

## Step 4: Generate Web Push Certificate (VAPID Key)

1. In Cloud Messaging page, scroll to **Web configuration**
2. Under **Web Push certificates**, click **Generate key pair**
3. **Copy the key pair** - this is your VAPID key
4. Format: `BF8uXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

---

## Step 5: Get Server Key (for Edge Function)

1. In Firebase Console, click the **Gear icon** → **Project settings**
2. Go to **Cloud Messaging** tab
3. Scroll to **Cloud Messaging API (Legacy)**
4. If disabled, click **Enable Cloud Messaging API (Legacy)**
5. **Copy the Server key**
6. Format: `AAAA1234567890:APA91bXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

**⚠️ Important:** Keep this key secret! It has full access to send push notifications.

---

## Step 6: Add Environment Variables

Create or update `/Users/jonathanlee/Desktop/genhub/.env.local`:

```bash
# Firebase Cloud Messaging (Push Notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BF8uXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# FCM Server Key (for Edge Function) - KEEP SECRET!
FCM_SERVER_KEY=AAAA1234567890:APA91bXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Replace all `XXXX` values with your actual Firebase credentials.**

---

## Step 7: Test the Injection Script

Run the injection script manually to verify it works:

```bash
node scripts/inject-sw-env.js
```

**Expected output:**
```
[inject-sw-env] Starting environment variable injection...
[inject-sw-env] Reading Service Worker from: /Users/jonathanlee/Desktop/genhub/public/firebase-messaging-sw.js
[inject-sw-env] ✓ Injected NEXT_PUBLIC_FIREBASE_API_KEY
[inject-sw-env] ✓ Injected NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
[inject-sw-env] ✓ Injected NEXT_PUBLIC_FIREBASE_PROJECT_ID
[inject-sw-env] ✓ Injected NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
[inject-sw-env] ✓ Injected NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
[inject-sw-env] ✓ Injected NEXT_PUBLIC_FIREBASE_APP_ID

✅ [inject-sw-env] Successfully injected 6 environment variables
✅ [inject-sw-env] Service Worker is ready for deployment
```

**If you see errors:**
- Double-check all environment variables are in `.env.local`
- Ensure there are no typos in variable names
- Restart your terminal to reload environment variables

---

## Step 8: Deploy Supabase Edge Function

The Edge Function needs the FCM Server Key to send push notifications.

### Option A: Supabase CLI

```bash
# Deploy the function
npx supabase functions deploy send-push-notification --no-verify-jwt

# Set the FCM_SERVER_KEY secret
npx supabase secrets set FCM_SERVER_KEY=AAAA1234567890:APA91bXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Option B: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Click **Deploy new function**
4. Upload `/supabase/functions/send-push-notification/index.ts`
5. Go to **Settings** → **Edge Function Secrets**
6. Add secret: `FCM_SERVER_KEY` with your server key value

---

## Step 9: Test Push Notifications

### Development Testing:

```bash
# Start dev server (injection runs automatically)
npm run dev
```

1. Visit http://localhost:3000/app/chat
2. You should see a permission prompt banner
3. Click "Enable Notifications"
4. Grant permission in browser dialog
5. Send a test message in a chat room
6. Close the browser tab
7. Open another browser tab and send a message
8. You should receive an OS notification!

### Production Testing:

```bash
# Build (injection runs automatically)
npm run build

# Start production server
npm start
```

Test the same flow as development.

---

## How It Works

### Build-Time Injection

The `scripts/inject-sw-env.js` script:

1. **Runs automatically** before `dev` and `build` (via `predev` and `prebuild` npm scripts)
2. **Reads** the Service Worker file: `public/firebase-messaging-sw.js`
3. **Finds** placeholder strings like `'NEXT_PUBLIC_FIREBASE_API_KEY'`
4. **Replaces** them with actual environment variable values
5. **Writes** the updated Service Worker back to disk

**Why build-time injection?**

Service Workers are static files served from the `/public` folder. They:
- Cannot access `process.env` at runtime
- Cannot use Next.js environment variable replacement
- Must have Firebase credentials embedded directly in the code

By injecting at build time, we:
- ✅ Keep credentials secure (not in source control)
- ✅ Allow different configs per environment (dev/staging/prod)
- ✅ Avoid hardcoding secrets in the codebase

---

## Security Best Practices

### Environment Variables

1. **Never commit `.env.local`** to Git (already in `.gitignore`)
2. **Use different Firebase projects** for dev/staging/prod
3. **Rotate FCM Server Key** if compromised
4. **Restrict API keys** in Firebase Console (optional but recommended)

### Firebase Console Security

1. Go to Firebase Console → **Project Settings** → **General**
2. Scroll to **Your apps** → **Web apps**
3. Click the gear icon → **App settings**
4. Under **API key restrictions**:
   - Click "Configure" next to API key
   - In Google Cloud Console, restrict to your domain
   - Example: Only allow requests from `yourdomain.com`

---

## Troubleshooting

### Error: "Missing Firebase environment variables"

**Cause:** Environment variables not set in `.env.local`

**Fix:**
1. Create `.env.local` if it doesn't exist
2. Copy Firebase config from Step 6
3. Replace placeholder values with your actual keys
4. Restart terminal/dev server

---

### Error: "Service Worker registration failed"

**Cause:** Service Worker has invalid Firebase config

**Fix:**
```bash
# Verify injection worked
cat public/firebase-messaging-sw.js | grep apiKey

# Should show actual API key, not placeholder:
# apiKey: 'AIzaSyXXXXXXXXXXXXX',  ✅ GOOD
# apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',  ❌ BAD (placeholder still there)
```

If placeholder is still there, run:
```bash
node scripts/inject-sw-env.js
```

---

### Error: "Messaging is not supported in this browser"

**Cause:** Browser doesn't support Web Push API

**Supported browsers:**
- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 79+
- ✅ Safari 16+ (macOS 13+, iOS 16.4+)
- ❌ Safari < 16 (no support)

**Fix:** Upgrade browser or test on supported browser

---

### Error: "Permission denied" or no notification appears

**Cause:** User denied notification permission

**Fix:**
1. Reset permission in browser:
   - Chrome: Click lock icon in address bar → Site settings → Notifications → Reset
   - Firefox: Click lock icon → Clear cookies and site data
   - Safari: Safari → Settings → Websites → Notifications → Reset
2. Refresh page and try again

---

### Notifications work in development but not production

**Cause:** Environment variables not set in production environment

**Fix:**

**Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all Firebase env vars (without `NEXT_PUBLIC_` prefix for server-side)
3. Redeploy

**Other platforms:**
- Set environment variables in platform dashboard
- Ensure `prebuild` script runs before build
- Check build logs for injection confirmation

---

## Environment-Specific Configuration

### Development
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_PROJECT_ID=genhub-dev
```

### Staging
```bash
# .env.staging
NEXT_PUBLIC_FIREBASE_PROJECT_ID=genhub-staging
```

### Production
```bash
# .env.production (on hosting platform)
NEXT_PUBLIC_FIREBASE_PROJECT_ID=genhub-prod
```

**Best practice:** Use separate Firebase projects for each environment.

---

## Monitoring & Analytics

### Firebase Console

1. Go to **Cloud Messaging** page
2. View statistics:
   - Messages sent
   - Messages delivered
   - Messages opened
   - Errors

### Supabase Edge Function Logs

```bash
# View live logs
npx supabase functions logs send-push-notification --tail

# View recent logs
npx supabase functions logs send-push-notification
```

---

## Next Steps

After setup is complete:

1. ✅ Test push notifications in development
2. ✅ Test push notifications in production
3. ✅ Set up monitoring alerts (Firebase Console)
4. ✅ Document notification permissions in user onboarding
5. ✅ Consider adding analytics tracking for notification CTR

---

## Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

---

**Need help?** Check the [troubleshooting section](#troubleshooting) or open an issue on GitHub.
