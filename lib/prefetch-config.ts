/**
 * Route Prefetch Configuration
 *
 * Defines critical routes to prefetch for each page.
 * Used for intelligent prefetching to improve perceived performance.
 *
 * Strategy:
 * - Prefetch commonly visited pages from current page
 * - Prefetch detail pages from list pages
 * - Prefetch related workflows
 *
 * @example
 * ```ts
 * import { prefetchConfig } from '@/lib/prefetch-config';
 * const hints = prefetchConfig[currentPath] || [];
 * hints.forEach(href => router.prefetch(href));
 * ```
 */

export interface PrefetchStrategy {
  /** Routes to prefetch immediately on page load */
  immediate?: string[];
  /** Routes to prefetch after idle (lower priority) */
  idle?: string[];
  /** Routes to prefetch on specific interaction */
  interaction?: Record<string, string[]>;
}

/**
 * Simple prefetch hints - routes to prefetch from each page
 */
export const prefetchConfig: Record<string, string[]> = {
  // Dashboard
  '/app': [
    '/app/projects',
    '/app/tasks',
    '/app/chat',
    '/app/team',
  ],

  // Projects
  '/app/projects': [
    '/app/tasks',
    '/app/materials',
    '/app/expenses',
  ],

  // Tasks
  '/app/tasks': [
    '/app/projects',
    '/app/chat',
    '/app/team',
  ],

  // Chat
  '/app/chat': [
    '/app/team',
    '/app/tasks',
  ],

  // Materials
  '/app/materials': [
    '/app/projects',
    '/app/tasks',
  ],

  // Expenses
  '/app/expenses': [
    '/app/projects',
  ],

  // Team
  '/app/team': [
    '/app/chat',
    '/app/projects',
    '/app/tasks',
  ],

  // Settings
  '/app/settings': [
    '/app',
  ],
};

/**
 * Advanced prefetch strategy with priorities
 */
export const prefetchStrategy: Record<string, PrefetchStrategy> = {
  // Dashboard - prefetch everything immediately (most common entry)
  '/app': {
    immediate: ['/app/projects', '/app/tasks'],
    idle: ['/app/chat', '/app/materials', '/app/expenses', '/app/team'],
  },

  // Projects list - prefetch task creation flow
  '/app/projects': {
    immediate: ['/app/tasks'],
    idle: ['/app/materials', '/app/expenses'],
  },

  // Tasks - prefetch project details and chat
  '/app/tasks': {
    immediate: ['/app/projects'],
    idle: ['/app/chat', '/app/team'],
  },

  // Chat - prefetch team directory
  '/app/chat': {
    immediate: ['/app/team'],
    idle: ['/app/tasks'],
  },
};

/**
 * Get prefetch routes for current path
 */
export function getPrefetchRoutes(currentPath: string): string[] {
  // Exact match
  if (prefetchConfig[currentPath]) {
    return prefetchConfig[currentPath];
  }

  // Pattern match (for dynamic routes)
  // Example: /app/projects/[id] -> use /app/projects config
  const pathSegments = currentPath.split('/').filter(Boolean);

  // Try parent path
  if (pathSegments.length > 2) {
    const parentPath = `/${pathSegments.slice(0, -1).join('/')}`;
    if (prefetchConfig[parentPath]) {
      return prefetchConfig[parentPath];
    }
  }

  return [];
}

/**
 * Get advanced prefetch strategy for current path
 */
export function getPrefetchStrategy(currentPath: string): PrefetchStrategy {
  return prefetchStrategy[currentPath] || { immediate: [], idle: [] };
}

/**
 * Navigation graph for optimal prefetch decisions
 */
export const navigationGraph: Record<string, { weight: number; routes: string[] }> = {
  '/app': { weight: 10, routes: ['/app/projects', '/app/tasks', '/app/chat'] },
  '/app/projects': { weight: 9, routes: ['/app/tasks', '/app/materials'] },
  '/app/tasks': { weight: 9, routes: ['/app/projects', '/app/chat'] },
  '/app/chat': { weight: 7, routes: ['/app/team', '/app/tasks'] },
  '/app/materials': { weight: 6, routes: ['/app/projects', '/app/tasks'] },
  '/app/expenses': { weight: 6, routes: ['/app/projects'] },
  '/app/team': { weight: 7, routes: ['/app/chat', '/app/projects'] },
};

/**
 * Get top N most likely next routes based on navigation graph
 */
export function getTopPrefetchRoutes(
  currentPath: string,
  limit: number = 3
): string[] {
  const graph = navigationGraph[currentPath];
  if (!graph) return [];

  return graph.routes.slice(0, limit);
}
