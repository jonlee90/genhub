/**
 * Playwright Authentication Helpers
 *
 * Utilities for setting up authenticated sessions in Playwright tests
 */

export interface TestUser {
  email: string;
  name: string;
  id?: string;
}

/**
 * Authenticate a test user via the test auth endpoint
 * This sets up a valid session cookie for the user
 *
 * @param baseURL - The base URL of the app (e.g., http://localhost:3000)
 * @param user - User credentials (at minimum, email is required)
 * @returns Session token and user data
 */
export async function authenticateUser(
  baseURL: string,
  user: TestUser
): Promise<{ sessionToken: string; user: TestUser }> {
  console.log('[AuthHelper] Authenticating user:', user.email);

  const response = await fetch(`${baseURL}/api/test/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: user.email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Authentication failed: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  console.log('[AuthHelper] Authentication successful:', data.user.email);

  return data;
}

/**
 * Default test user (matches the user in the database)
 */
export const DEFAULT_TEST_USER: TestUser = {
  email: 'jonlee213@gmail.com',
  name: 'Jonathan Lee',
};

/**
 * Example usage in Playwright tests:
 *
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { authenticateUser, DEFAULT_TEST_USER } from './helpers/auth';
 *
 * test('authenticated chat page', async ({ page, baseURL }) => {
 *   // Authenticate before navigating
 *   const { sessionToken } = await authenticateUser(baseURL!, DEFAULT_TEST_USER);
 *
 *   // Set the session cookie
 *   await page.context().addCookies([
 *     {
 *       name: 'authjs.session-token',
 *       value: sessionToken,
 *       domain: 'localhost',
 *       path: '/',
 *       httpOnly: true,
 *       sameSite: 'Lax',
 *       expires: Date.now() / 1000 + 30 * 24 * 60 * 60, // 30 days
 *     },
 *   ]);
 *
 *   // Now navigate to authenticated page
 *   await page.goto('/app/chat');
 *
 *   // Page should be accessible without redirect
 *   await expect(page).toHaveURL(/\/app\/chat/);
 * });
 * ```
 */
