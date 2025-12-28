/**
 * Date utilities for consistent timezone handling across the application
 */

/**
 * Check if a task is overdue based on its due date and current status
 * Compares dates only (ignoring time) to avoid timezone issues
 */
export function isTaskOverdue(dueDate: string | null, status: string): boolean {
  if (!dueDate || status === 'completed') return false;

  const due = new Date(dueDate);
  const now = new Date();

  // Compare dates only (ignore time) to avoid timezone issues
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return due < now;
}

/**
 * Check if a date is in the past (date only comparison)
 */
export function isDatePast(date: string | null): boolean {
  if (!date) return false;

  const targetDate = new Date(date);
  const now = new Date();

  targetDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  return targetDate < now;
}

/**
 * Format a date string to a localized date string
 */
export function formatDate(date: string | null, locale: string = 'en-US'): string {
  if (!date) return '';

  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to a relative time string (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | null, locale: string = 'en-US'): string {
  if (!date) return '';

  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  } else if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  } else if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffInMs = end.getTime() - start.getTime();
  return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
}
