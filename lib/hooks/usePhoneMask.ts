import { useState, useCallback } from 'react';

/**
 * Phone mask utility hook
 * Formats phone numbers as (XXX) XXX-XXXX for US phone numbers
 */
export function usePhoneMask(initialValue: string = '') {
  const [value, setValue] = useState(formatPhoneNumber(initialValue));

  const handleChange = useCallback((input: string) => {
    const formatted = formatPhoneNumber(input);
    setValue(formatted);
    return formatted;
  }, []);

  return {
    value,
    onChange: handleChange,
    setValue,
  };
}

/**
 * Format phone number to (XXX) XXX-XXXX
 * @param input - Raw phone number input
 * @returns Formatted phone number
 */
export function formatPhoneNumber(input: string): string {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  // Limit to 10 digits
  const truncated = digits.slice(0, 10);

  // Format based on length
  if (truncated.length === 0) return '';
  if (truncated.length <= 3) return `(${truncated}`;
  if (truncated.length <= 6) return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
}

/**
 * Extract raw digits from formatted phone number
 * @param formatted - Formatted phone number like (555) 123-4567
 * @returns Raw digits like 5551234567
 */
export function extractPhoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, '');
}
