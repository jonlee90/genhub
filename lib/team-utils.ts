/**
 * Team utility functions
 */

/**
 * Checks if a team member was manually added (has placeholder email)
 *
 * Manual members have emails in format: manual_{uuid}@placeholder.genhub.local
 *
 * @param email - The email address to check
 * @returns true if the email is a placeholder for a manually added member
 */
export function isManualMember(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.startsWith('manual_') && email.endsWith('@placeholder.genhub.local');
}

/**
 * Gets display text for a team member's email
 * Shows "No email on file" for manual members, otherwise the actual email
 *
 * @param email - The email address
 * @returns Display text for the email
 */
export function getDisplayEmail(email: string | null | undefined): string {
  if (!email) return 'No email';
  if (isManualMember(email)) return 'No email on file';
  return email;
}
