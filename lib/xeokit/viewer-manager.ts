// Debug: Global xeokit viewer instance manager
// P2.1 - Prevents multiple viewer instances and memory leaks

import type { Viewer } from '@xeokit/xeokit-sdk';
import { initXeokit, destroyXeokit } from './index';

/**
 * ViewerManager - Singleton pattern for managing xeokit viewer instances
 * Prevents memory leaks from multiple viewer instances on hot reload
 */
class ViewerManager {
  private viewers: Map<string, Viewer> = new Map();
  private static instance: ViewerManager | null = null;

  private constructor() {
    console.log('[ViewerManager] Instance created');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ViewerManager {
    if (!ViewerManager.instance) {
      ViewerManager.instance = new ViewerManager();
    }
    return ViewerManager.instance;
  }

  /**
   * Get or create viewer for a specific project
   * Reuses existing viewer if available
   */
  getOrCreateViewer(
    projectId: string,
    canvasElement: HTMLCanvasElement,
    options?: any
  ): Viewer | null {
    console.log('[ViewerManager] Getting or creating viewer for project', projectId);

    // Debug: Check if viewer already exists for this project
    const existing = this.viewers.get(projectId);
    if (existing) {
      console.log('[ViewerManager] Reusing existing viewer', projectId);
      return existing;
    }

    // Debug: Create new viewer
    const viewer = initXeokit(canvasElement, options);
    if (!viewer) {
      console.error('[ViewerManager] Failed to create viewer', projectId);
      return null;
    }

    // Debug: Store viewer
    this.viewers.set(projectId, viewer);
    console.log('[ViewerManager] Created and stored new viewer', projectId);

    return viewer;
  }

  /**
   * Get existing viewer without creating new one
   */
  getViewer(projectId: string): Viewer | null {
    const viewer = this.viewers.get(projectId);
    console.log('[ViewerManager] Getting viewer', { projectId, found: !!viewer });
    return viewer || null;
  }

  /**
   * Destroy specific viewer
   */
  destroyViewer(projectId: string): void {
    console.log('[ViewerManager] Destroying viewer', projectId);

    const viewer = this.viewers.get(projectId);
    if (viewer) {
      destroyXeokit(viewer);
      this.viewers.delete(projectId);
      console.log('[ViewerManager] Viewer destroyed and removed', projectId);
    } else {
      console.log('[ViewerManager] No viewer found to destroy', projectId);
    }
  }

  /**
   * Destroy all viewers (e.g., on app unmount)
   */
  destroyAll(): void {
    console.log('[ViewerManager] Destroying all viewers', {
      count: this.viewers.size,
    });

    this.viewers.forEach((viewer, projectId) => {
      console.log('[ViewerManager] Destroying viewer', projectId);
      destroyXeokit(viewer);
    });

    this.viewers.clear();
    console.log('[ViewerManager] All viewers destroyed');
  }

  /**
   * Get active viewer count
   */
  getViewerCount(): number {
    return this.viewers.size;
  }

  /**
   * Get all project IDs with active viewers
   */
  getActiveProjects(): string[] {
    return Array.from(this.viewers.keys());
  }
}

// Debug: Export singleton instance
export const viewerManager = ViewerManager.getInstance();

// Debug: Cleanup on module reload (HMR)
if (typeof window !== 'undefined') {
  // @ts-ignore - Add to window for debugging
  window.__viewerManager = viewerManager;

  // Debug: Cleanup on window unload
  window.addEventListener('beforeunload', () => {
    console.log('[ViewerManager] Window unload - destroying all viewers');
    viewerManager.destroyAll();
  });
}
