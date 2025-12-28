import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Uses DOMPurify with a strict whitelist of allowed tags and attributes
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (React escapes by default)
    return dirty;
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Sanitize plain text (removes all HTML tags)
 */
export function sanitizeText(text: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return as-is (React escapes by default)
    return text;
  }

  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize a URL to prevent javascript: and other dangerous protocols
 */
export function sanitizeUrl(url: string): string {
  const allowedProtocols = ['http:', 'https:', 'mailto:'];

  try {
    const parsed = new URL(url, window.location.origin);
    if (allowedProtocols.includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // Invalid URL, return empty string
    return '';
  }

  return '';
}
