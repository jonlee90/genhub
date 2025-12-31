# KakaoTalk Integration via Sendbird

## Overview

GenHub integrates with KakaoTalk Business Messaging via Sendbird to provide:

1. **AlimTalk Notifications** (One-way: GenHub → KakaoTalk)
   - Task assignments
   - Expense approval/rejection
   - Project milestone updates

2. **Two-Way Message Sync** (Optional: GenHub ↔ KakaoTalk)
   - Sync messages from GenHub chat to KakaoTalk
   - Receive messages from KakaoTalk in GenHub chat

## Architecture

```
┌─────────────────┐
│   GenHub PWA    │
│  (Next.js 15)   │
└────────┬────────┘
         │
         │ Server Actions
         │ API Routes
         ▼
┌─────────────────┐
│ KakaoService    │
│ (lib/services)  │
└────────┬────────┘
         │
         │ HTTP API
         ▼
┌─────────────────┐
│    Sendbird     │
│ Business Messaging
└────────┬────────┘
         │
         │ AlimTalk API
         ▼
┌─────────────────┐
│   KakaoTalk     │
│  (User's App)   │
└─────────────────┘
```

## Database Schema

### Table: `kakao_connections`

Stores KakaoTalk account connections with encrypted tokens.

```sql
CREATE TABLE public.kakao_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  kakao_user_id text NOT NULL,
  sendbird_user_id text NOT NULL,
  two_way_sync boolean NOT NULL DEFAULT false,
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  access_token text NOT NULL,   -- Encrypted with AES-256-GCM
  refresh_token text NOT NULL,  -- Encrypted with AES-256-GCM
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT kakao_connections_user_id_key UNIQUE (user_id)
);
```

**RLS Policies:**
- Users can only view/manage their own connection
- Authenticated users only

## Environment Variables

Copy `.env.kakao.example` to `.env.local` and configure:

```env
# Sendbird App Configuration
SENDBIRD_APP_ID=your_sendbird_app_id
SENDBIRD_API_TOKEN=your_sendbird_api_token
SENDBIRD_WEBHOOK_SECRET=your_sendbird_webhook_secret

# Sendbird OAuth
SENDBIRD_OAUTH_CLIENT_ID=your_oauth_client_id
SENDBIRD_OAUTH_CLIENT_SECRET=your_oauth_client_secret

# Encryption (32 chars for AES-256)
KAKAO_ENCRYPTION_KEY=your_32_character_encryption_key
```

## Setup Instructions

### 1. Sendbird Configuration

1. **Create Sendbird Account**
   - Go to [Sendbird Dashboard](https://dashboard.sendbird.com/)
   - Sign up and create new application
   - Select "Business Messaging" type

2. **Enable KakaoTalk Business Messaging**
   - Dashboard → Settings → Business Messaging
   - Enable KakaoTalk integration
   - Link your KakaoTalk Business account

3. **Register AlimTalk Templates**

   Go to Business Messaging → Templates and register:

   **Template: TASK_ASSIGN_001**
   ```
   새 작업이 할당되었습니다.
   프로젝트: {{projectName}}
   작업: {{taskTitle}}
   마감일: {{dueDate}}
   ```

   **Template: EXPENSE_STATUS_001**
   ```
   경비 승인 상태: {{status}}
   금액: {{amount}}
   코멘트: {{comment}}
   ```

   **Template: PROJECT_MILESTONE_001**
   ```
   프로젝트 마일스톤 업데이트
   프로젝트: {{projectName}}
   단계: {{phase}}
   마일스톤: {{milestone}}
   ```

4. **Configure OAuth App**
   - Dashboard → Settings → OAuth
   - Create new OAuth application
   - Redirect URI: `https://yourdomain.com/api/kakao/callback`
   - Copy Client ID and Secret

5. **Set Webhook URL**
   - Dashboard → Settings → Webhooks
   - Add webhook: `https://yourdomain.com/api/kakao/webhook`
   - Select events: `group_channel:message_send`
   - Copy Webhook Secret

### 2. Database Migration

Run migration to create `kakao_connections` table:

```bash
# Apply migration
supabase db push

# Or manually:
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/031_kakao_connections.sql
```

### 3. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy output to `KAKAO_ENCRYPTION_KEY` in `.env.local`.

### 4. Test Connection

1. Run app: `pnpm dev`
2. Go to Settings → Integrations → KakaoTalk
3. Click "Connect KakaoTalk"
4. Authorize with KakaoTalk account
5. Enable two-way sync (optional)

## Usage

### Connecting KakaoTalk Account

**User Flow:**
1. User navigates to `/app/settings`
2. Clicks "Connect KakaoTalk" button
3. Redirected to Sendbird OAuth page
4. Authorizes with KakaoTalk credentials
5. Redirected back to GenHub with success message
6. Connection stored in `kakao_connections` table

**API Routes:**
- `GET /api/kakao/connect` - Initiate OAuth flow
- `GET /api/kakao/callback` - Handle OAuth callback

**Server Actions:**
- `getKakaoConnection()` - Get user's connection status
- `updateTwoWaySync(enabled: boolean)` - Toggle two-way sync
- `disconnectKakao()` - Disconnect account

### Sending AlimTalk Notifications

**Automatic notifications are sent when:**

1. **Task Assignment** (`tasks.ts`)
   ```typescript
   // Triggered when task is assigned to user
   await KakaoService.sendAlimTalk(assignee.id, {
     template: 'task_assignment',
     params: {
       taskTitle: 'Install HVAC system',
       dueDate: '2025-01-15',
       projectName: 'Downtown Office Building'
     }
   });
   ```

2. **Expense Approval** (`expenses.ts`)
   ```typescript
   // Triggered when expense is approved/rejected
   await KakaoService.sendAlimTalk(submitter.id, {
     template: 'expense_status',
     params: {
       status: 'Approved',
       amount: '$250.00',
       comment: 'Receipt verified'
     }
   });
   ```

3. **Project Milestone** (`projects.ts`)
   ```typescript
   // Triggered when phase status changes
   await KakaoService.sendAlimTalk(member.id, {
     template: 'project_milestone',
     params: {
       projectName: 'Shopping Mall Renovation',
       phase: 'Construction',
       milestone: 'Foundation complete'
     }
   });
   ```

**Retry Logic:**
- Maximum 3 attempts
- Exponential backoff (1s, 2s, 4s)
- Auto token refresh on 401 errors
- Graceful failure (won't break main operation)

### Two-Way Message Sync

**Outgoing (GenHub → KakaoTalk):**

When user sends message in GenHub chat:
1. Message inserted into `messages` table
2. Check if user has `two_way_sync = true`
3. If enabled, sync to KakaoTalk via Sendbird API
4. Message appears in user's KakaoTalk app

**Incoming (KakaoTalk → GenHub):**

When user sends message in KakaoTalk:
1. Sendbird sends webhook to `/api/kakao/webhook`
2. Webhook verifies signature
3. Maps Sendbird user to GenHub user
4. Inserts message into GenHub chat room
5. Message appears in GenHub UI (via Realtime)

**Implementation:**
```typescript
// chat.ts sendMessage action
if (userConnection.two_way_sync) {
  await KakaoService.syncMessage(userId, {
    content: message.content,
    chatRoomId: chatRoom.id
  });
}
```

## Security

### Token Encryption

All access/refresh tokens are encrypted before storage using **AES-256-GCM**:

```typescript
// Encryption (lib/services/kakao.ts)
function encryptToken(token: string): string {
  const key = Buffer.from(KAKAO_ENCRYPTION_KEY.slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

### Webhook Signature Verification

All incoming webhooks are verified using HMAC-SHA256:

```typescript
function verifyWebhookSignature(signature: string, body: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', SENDBIRD_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}
```

### Row Level Security

- Users can only access their own `kakao_connections` record
- All queries use `next_auth.uid()` for user context
- Admin operations use `createAdminClient()` (webhooks only)

## Monitoring & Debugging

### Logs

All operations are logged with `[kakao]` prefix:

```typescript
console.log('[kakao] Connecting KakaoTalk account for user:', userId);
console.log('[kakao] AlimTalk sent successfully, message_id:', messageId);
console.error('[kakao] Token exchange failed:', error);
```

### Sendbird Dashboard

Monitor in Sendbird Dashboard:
- **Business Messaging → Logs**: AlimTalk send history
- **Webhooks → Logs**: Incoming webhook events
- **Analytics**: Message delivery rates

### Database Queries

Check connection status:
```sql
SELECT
  user_id,
  kakao_user_id,
  two_way_sync,
  connected_at,
  disconnected_at
FROM kakao_connections
WHERE user_id = 'user-uuid-here';
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Token exchange failed` | Invalid auth code or OAuth config | Check OAuth credentials in Sendbird Dashboard |
| `AlimTalk send failed` | Template not approved or invalid params | Verify template registration and param names |
| `Invalid webhook signature` | Wrong webhook secret | Check `SENDBIRD_WEBHOOK_SECRET` matches Dashboard |
| `Connection not found` | User hasn't connected KakaoTalk | User must complete OAuth flow first |
| `Failed to refresh token` | Refresh token expired | User must reconnect KakaoTalk account |

### Graceful Degradation

- AlimTalk failures don't block main operations (task creation, expense approval)
- Two-way sync failures are logged but don't affect message delivery in GenHub
- Automatic retry with exponential backoff for transient errors

## Limitations

1. **AlimTalk Templates**
   - Must be pre-registered and approved by KakaoTalk
   - Cannot send arbitrary messages
   - Template modifications require re-approval

2. **Rate Limits**
   - Sendbird free tier: 100 messages/month
   - Upgrade to paid plan for production use

3. **Two-Way Sync**
   - Requires user to enable explicitly
   - Only works for group channels (not DMs)
   - Message mapping depends on Sendbird channel URL

## Testing

### Manual Testing

1. **AlimTalk Send:**
   ```bash
   # In GenHub, create task and assign to user with KakaoTalk connected
   # Check KakaoTalk app for notification
   ```

2. **Two-Way Sync:**
   ```bash
   # Enable two-way sync in settings
   # Send message in GenHub → verify in KakaoTalk
   # Send message in KakaoTalk → verify in GenHub
   ```

3. **Webhook:**
   ```bash
   # Use Sendbird Dashboard → Webhooks → Test
   # Send test webhook to /api/kakao/webhook
   # Verify signature validation and message insertion
   ```

### Automated Tests

```typescript
// TODO: Add tests for:
// - Token encryption/decryption
// - Webhook signature verification
// - AlimTalk template parameter validation
// - OAuth flow error handling
```

## Future Enhancements

- [ ] Support for rich messages (images, buttons, carousels)
- [ ] AlimTalk delivery reports and read receipts
- [ ] Bulk message sending for project-wide announcements
- [ ] Custom template management UI
- [ ] Integration with GenHub notification preferences
- [ ] Analytics dashboard for KakaoTalk engagement

## Support

For issues with:
- **Sendbird:** [Sendbird Support](https://sendbird.com/support)
- **KakaoTalk Business:** [KakaoTalk for Business](https://business.kakao.com/)
- **GenHub Integration:** Create issue in GitHub repository

## References

- [Sendbird Business Messaging Docs](https://sendbird.com/docs/business-messaging)
- [KakaoTalk AlimTalk Guide](https://developers.kakao.com/docs/latest/en/message/rest-api)
- [Sendbird Webhooks](https://sendbird.com/docs/chat/v3/platform-api/guides/webhooks)
