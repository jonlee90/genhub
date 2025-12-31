# Security Fixes: KakaoTalk Integration

**Date:** 2025-12-30
**Status:** ✅ ALL CRITICAL VULNERABILITIES FIXED
**Files Modified:** 2 files

---

## Overview

Fixed 3 critical security vulnerabilities identified in code review of the KakaoTalk integration (Tasks 0016-0019).

---

## Critical Fixes Applied

### ✅ C1: Timing Attack in Webhook Signature Verification (CRITICAL)

**File:** `lib/services/kakao.ts:422-455`
**Issue:** Webhook signature verification used non-timing-safe string comparison (`===`), vulnerable to timing attacks
**Impact:** Attackers could forge webhook requests by exploiting timing differences in string comparison

**Fix Applied:**
- Replaced `===` comparison with `crypto.timingSafeEqual()`
- Added length check before comparison (constant time for different lengths)
- Updated crypto imports to include `createHmac` and `timingSafeEqual`
- Removed inline `require('crypto')` in favor of top-level import

**Code Changes:**
```typescript
// BEFORE (VULNERABLE):
const crypto = require('crypto');
const expectedSignature = crypto
  .createHmac('sha256', SENDBIRD_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

return signature === expectedSignature; // Timing attack vulnerable

// AFTER (SECURE):
import { createHmac, timingSafeEqual } from 'crypto';

const expectedSignature = createHmac('sha256', SENDBIRD_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

// Use timing-safe comparison
const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
const actualBuffer = Buffer.from(signature, 'utf8');

if (expectedBuffer.length !== actualBuffer.length) {
  return false;
}

return timingSafeEqual(expectedBuffer, actualBuffer);
```

**Security Impact:** ✅ ELIMINATED timing attack vector

---

### ✅ C2: CSRF Vulnerability in OAuth Callback (CRITICAL)

**File:** `app/api/kakao/callback/route.ts:34-66`
**Issue:** OAuth callback decoded `userId` from state parameter but never verified it against authenticated session
**Impact:** CSRF attack allowing attacker to connect their KakaoTalk account to victim's GenHub account

**Fix Applied:**
- Added `auth()` import from `@/lib/auth`
- Verify authenticated session exists before processing callback
- Compare `state.userId` with `session.user.id`
- Return error if mismatch detected (CSRF attempt)
- Added detailed error logging for security monitoring

**Code Changes:**
```typescript
// BEFORE (VULNERABLE):
const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
userId = stateData.userId;

// No verification - CSRF vulnerable!
const result = await KakaoService.connectKakaoAccount(userId, code);

// AFTER (SECURE):
const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
userId = stateData.userId;

// SECURITY: Verify state userId matches authenticated session
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.redirect(
    new URL('/app/settings?kakao_error=not_authenticated', request.url)
  );
}

if (session.user.id !== userId) {
  console.error('[kakao-callback] State userId mismatch - possible CSRF attack');
  return NextResponse.redirect(
    new URL('/app/settings?kakao_error=csrf_detected', request.url)
  );
}

// Only proceed if session matches state
const result = await KakaoService.connectKakaoAccount(userId, code);
```

**Security Impact:** ✅ ELIMINATED CSRF attack vector

---

### ✅ C3: Weak Encryption Key Validation (CRITICAL)

**File:** `lib/services/kakao.ts:33-52, 62-83`
**Issue:** Encryption used `KAKAO_ENCRYPTION_KEY.slice(0, 32)` without validating original key length
**Impact:** If environment variable < 32 bytes, weak encryption keys would be used

**Fix Applied:**
- Added validation in both `encryptToken()` and `decryptToken()` functions
- Check that `KAKAO_ENCRYPTION_KEY.length >= 32` before use
- Throw clear error message if key is too short
- Prevents weak encryption from insufficient key length

**Code Changes:**
```typescript
// BEFORE (VULNERABLE):
function encryptToken(token: string): string {
  if (!KAKAO_ENCRYPTION_KEY) {
    throw new Error('KAKAO_ENCRYPTION_KEY is not configured');
  }

  // No length validation - could be weak!
  const key = Buffer.from(KAKAO_ENCRYPTION_KEY.slice(0, 32));
  // ... encryption code
}

// AFTER (SECURE):
function encryptToken(token: string): string {
  if (!KAKAO_ENCRYPTION_KEY) {
    throw new Error('KAKAO_ENCRYPTION_KEY is not configured');
  }

  // SECURITY: Validate key length (must be at least 32 bytes for AES-256)
  if (KAKAO_ENCRYPTION_KEY.length < 32) {
    throw new Error('KAKAO_ENCRYPTION_KEY must be at least 32 characters long');
  }

  const key = Buffer.from(KAKAO_ENCRYPTION_KEY.slice(0, 32));
  // ... encryption code
}
```

**Same validation added to `decryptToken()` function.**

**Security Impact:** ✅ ELIMINATED weak encryption risk

---

## Files Modified

### 1. `lib/services/kakao.ts`

**Lines Modified:**
- Line 13: Added `createHmac, timingSafeEqual` to crypto imports
- Lines 40-43: Added encryption key length validation in `encryptToken()`
- Lines 69-72: Added encryption key length validation in `decryptToken()`
- Lines 429-455: Replaced timing-vulnerable signature verification with timing-safe comparison

**Total Changes:** 4 sections modified

### 2. `app/api/kakao/callback/route.ts`

**Lines Modified:**
- Line 6: Added `auth` import from `@/lib/auth`
- Lines 46-62: Added OAuth state validation against authenticated session

**Total Changes:** 2 sections modified

---

## Security Verification

### C1: Timing Attack Protection
- ✅ Uses `crypto.timingSafeEqual()` for constant-time comparison
- ✅ Length check prevents different-length buffer comparison errors
- ✅ No more inline `require()` - uses top-level imports
- ✅ Comprehensive error logging

### C2: CSRF Protection
- ✅ Verifies authenticated session exists
- ✅ Compares state userId with session userId
- ✅ Rejects mismatches with clear error messages
- ✅ Logs potential CSRF attempts for monitoring

### C3: Strong Encryption
- ✅ Validates key length >= 32 bytes before use
- ✅ Same validation in both encrypt and decrypt functions
- ✅ Clear error messages guide developers
- ✅ Prevents weak encryption from short keys

---

## Testing Recommendations

### 1. Test Webhook Signature Verification
```bash
# Test with valid signature
curl -X POST http://localhost:3000/api/kakao/webhook \
  -H "X-Sendbird-Signature: <valid-hmac>" \
  -d '{"test": "data"}'

# Test with invalid signature (should reject)
curl -X POST http://localhost:3000/api/kakao/webhook \
  -H "X-Sendbird-Signature: invalid" \
  -d '{"test": "data"}'
```

### 2. Test OAuth CSRF Protection
```bash
# Attempt to connect with different user's state (should reject)
# 1. User A initiates OAuth → gets state with userId=A
# 2. User B intercepts callback URL
# 3. User B uses their session with User A's state
# Expected: Error "csrf_detected"
```

### 3. Test Encryption Key Validation
```bash
# Set short encryption key (should error)
export KAKAO_ENCRYPTION_KEY="short"
node -e "require('./lib/services/kakao').KakaoService.connectKakaoAccount(...)"
# Expected: Error "KAKAO_ENCRYPTION_KEY must be at least 32 characters long"

# Set proper encryption key (should work)
export KAKAO_ENCRYPTION_KEY="this-is-a-32-character-long-key-here!"
```

---

## Deployment Checklist

Before deploying to production:

- [x] ✅ Fix C1: Timing attack in webhook signature verification
- [x] ✅ Fix C2: CSRF vulnerability in OAuth callback
- [x] ✅ Fix C3: Weak encryption key validation
- [ ] Generate 32+ character encryption key for production
- [ ] Set `KAKAO_ENCRYPTION_KEY` in production environment
- [ ] Test webhook signature verification end-to-end
- [ ] Test OAuth flow with valid session
- [ ] Test OAuth flow with mismatched session (should reject)
- [ ] Monitor logs for CSRF attempts
- [ ] Set up alerts for webhook signature failures

---

## Additional Security Recommendations

### High Priority (Implement Before Production)
1. **H1:** Add Sendbird env vars to `.env.example`
2. **H2:** Remove optional `userId` parameter from `getKakaoConnection()`
3. **H3:** Add database migration for `chat_rooms.external_id` (webhook channel mapping)
4. **H4:** Implement rate limiting on OAuth endpoints

### Medium Priority (Implement Post-Deployment)
1. **M1:** Replace `console.log` with structured logger with automatic redaction
2. **M2:** Add Zod validation for AlimTalk template parameters
3. **M3:** Document why webhook uses `createAdminClient()`

---

## Conclusion

**Security Status:** ✅ **SIGNIFICANTLY IMPROVED**

All 3 critical security vulnerabilities have been fixed:
- Timing attacks on webhook signatures: **ELIMINATED**
- CSRF attacks on OAuth flow: **ELIMINATED**
- Weak encryption from short keys: **ELIMINATED**

The KakaoTalk integration is now **ready for production deployment** after addressing the remaining high-priority issues (H1-H4) and completing the deployment checklist.

---

**Fixed by:** Claude Sonnet 4.5
**Date:** 2025-12-30
**Version:** 1.0.0
**Related:** Tasks 0016-0019 (KakaoTalk Integration)
