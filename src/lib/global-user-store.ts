/**
 * Global User Store - Single Source of Truth
 * This store is populated by middleware and accessed by all hooks
 * NO multiple auth subscriptions, NO race conditions, NO state conflicts
 */

import { supabase } from '@/app/utils/supabase/client';

export interface GlobalUserData {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

class GlobalUserStore {
  private static instance: GlobalUserStore;
  private userData: GlobalUserData | null = null;
  private listeners: Set<() => void> = new Set();
  private fetchPromise: Promise<GlobalUserData | null> | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): GlobalUserStore {
    if (!GlobalUserStore.instance) {
      GlobalUserStore.instance = new GlobalUserStore();
    }
    return GlobalUserStore.instance;
  }

  /**
   * Fetch user data from middleware headers via API
   * This is called ONCE and cached for all hooks
   */
  public async fetchUser(): Promise<GlobalUserData | null> {
    // If already fetching, return the existing promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // If already have data, return it
    if (this.userData) {
      return Promise.resolve(this.userData);
    }

    // Start fetching
    this.fetchPromise = fetch('/api/auth/me')
      .then(async (response) => {
        if (!response.ok) {
          this.userData = null;
          this.fetchPromise = null;
          this.notifyListeners();
          return null;
        }

        const data = await response.json();
        
        this.userData = {
          id: data.id,
          email: data.email,
          firstname: data.name?.split(' ')[0] || '',
          lastname: data.name?.split(' ').slice(1).join(' ') || '',
          role: data.role || 'user',
          isAdmin: data.isAdmin || false,
          isSuperAdmin: data.role === 'super_admin',
        };

        this.fetchPromise = null;
        this.notifyListeners();
        return this.userData;
      })
      .catch((error) => {
        console.error('GlobalUserStore: Failed to fetch user:', error);
        this.userData = null;
        this.fetchPromise = null;
        this.notifyListeners();
        return null;
      });

    return this.fetchPromise;
  }

  /**
   * Get current user data (synchronous)
   * Returns cached data or null if not yet loaded
   */
  public getUser(): GlobalUserData | null {
    return this.userData;
  }

  /**
   * Get user ID as number (commonly used by hooks)
   */
  public getUserId(): number | null {
    return this.userData?.id ? parseInt(this.userData.id) : null;
  }

  /**
   * Subscribe to user data changes
   */
  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Clear user data (on logout)
   */
  public clearUser(): void {
    this.userData = null;
    this.fetchPromise = null;
    this.notifyListeners();
  }

  /**
   * Sign out user - clears global store and Supabase session
   */
  public async signOut(): Promise<void> {
    console.log('[GlobalUserStore] Signing out user');
    try {
      await supabase.auth.signOut();
      this.clearUser();
    } catch (error) {
      console.error('[GlobalUserStore] Error signing out:', error);
      throw error;
    }
  }

  /**
   * Refresh user data from server
   */
  public async refreshUser(): Promise<GlobalUserData | null> {
    console.log('[GlobalUserStore] Refreshing user data');
    this.userData = null; // Clear cache to force refetch
    this.fetchPromise = null;
    return this.fetchUser();
  }

  /**
   * Manually set user data (for testing or manual updates)
   */
  public setUser(user: GlobalUserData | null): void {
    this.userData = user;
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('GlobalUserStore: Error in listener callback:', error);
      }
    });
  }
}

// Export singleton instance
export const globalUserStore = GlobalUserStore.getInstance();