# Team Invite Email Fix

## Problem
Team invitations are being created in the database but emails are NOT being sent.

## Root Cause
1. Email sending code has a TODO comment (not implemented)
2. Email credentials in .env.local are placeholders (xxxxxxxxxx)
3. Missing MAIL_* environment variables

## Quick Fix

### Step 1: Update .env.local

Replace the placeholder email values with real credentials:

```bash
# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-gmail-app-password
MAIL_FROM=your-email@gmail.com
```

For Gmail: Create an App Password at https://myaccount.google.com/apppasswords

### Step 2: Update app/actions/team.ts

Add this import at the top:
```typescript
import { send } from '@/lib/mail';
```

Add this function after getUserContext():
```typescript
async function sendInvitationEmail(email, name, link, inviter, company) {
  if (!process.env.MAIL_HOST) {
    return { success: false, error: 'Email not configured' };
  }
  try {
    await send({
      to: email,
      subject: \`Join \${company} on GenHub\`,
      text: \`Hi \${name}, \${inviter} invited you. Link: \${link}\`,
      html: \`<h1>Hi \${name}</h1><p>\${inviter} invited you to \${company}</p><a href="\${link}">Accept</a>\`
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

Replace TODO section (lines 188-194) with:
```typescript
const invitationLink = \`\${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=\${invitationToken}\`;

const emailResult = await sendInvitationEmail(
  data.email,
  data.name, 
  invitationLink,
  'Admin',
  'GenHub'
);

if (!emailResult.success) {
  return {
    success: true,
    message: \`Invite created but email failed. Share manually: \${invitationLink}\`,
    invitationLink
  };
}
```

### Step 3: Test

1. Restart dev server: `pnpm run dev`
2. Go to /app/team
3. Click "Invite Team Member"
4. Check console for email logs
5. Check email inbox

## Current Status

Database: WORKING ✓
Invitation creation: WORKING ✓  
Email sending: NOT WORKING ✗

## Files to Edit

1. .env.local - Add MAIL_* variables
2. app/actions/team.ts - Add email function + call it

