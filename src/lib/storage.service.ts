/**
 * Storage Service
 * Centralized abstraction for localStorage access
 * Provides type-safe storage operations with error handling
 */

type StorageKey =
  | 'auth_token'
  | 'refresh_token'
  | 'user_data'
  | 'theme'
  | 'sidebar_state';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export class StorageService {
  private readonly prefix = 'biznavigate_';

  /**
   * Check if localStorage is available
   */
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get full storage key with prefix
   */
  private getKey(key: StorageKey): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get item from storage
   */
  private getItem(key: StorageKey): string | null {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return null;
    }

    try {
      return localStorage.getItem(this.getKey(key));
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  private setItem(key: StorageKey, value: string): void {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      localStorage.setItem(this.getKey(key), value);
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error);
    }
  }

  /**
   * Remove item from storage
   */
  private removeItem(key: StorageKey): void {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error(`Failed to remove ${key} from storage:`, error);
    }
  }

  // Auth Token Methods
  getAuthToken(): string | null {
    return this.getItem('auth_token');
  }

  setAuthToken(token: string): void {
    this.setItem('auth_token', token);
  }

  removeAuthToken(): void {
    this.removeItem('auth_token');
  }

  // Refresh Token Methods
  getRefreshToken(): string | null {
    return this.getItem('refresh_token');
  }

  setRefreshToken(token: string): void {
    this.setItem('refresh_token', token);
  }

  removeRefreshToken(): void {
    this.removeItem('refresh_token');
  }

  // User Data Methods
  getUserData(): UserData | null {
    const data = this.getItem('user_data');
    if (!data) return null;

    try {
      return JSON.parse(data) as UserData;
    } catch (error) {
      console.error('Failed to parse user data:', error);
      return null;
    }
  }

  setUserData(userData: UserData): void {
    try {
      this.setItem('user_data', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to stringify user data:', error);
    }
  }

  removeUserData(): void {
    this.removeItem('user_data');
  }

  // Theme Methods
  getTheme(): 'light' | 'dark' | null {
    const theme = this.getItem('theme');
    if (theme === 'light' || theme === 'dark') {
      return theme;
    }
    return null;
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.setItem('theme', theme);
  }

  removeTheme(): void {
    this.removeItem('theme');
  }

  // Sidebar State Methods
  getSidebarState(): boolean {
    const state = this.getItem('sidebar_state');
    return state === 'true';
  }

  setSidebarState(isOpen: boolean): void {
    this.setItem('sidebar_state', isOpen.toString());
  }

  // Clear all storage
  clearAll(): void {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const keys: StorageKey[] = [
        'auth_token',
        'refresh_token',
        'user_data',
        'theme',
        'sidebar_state',
      ];

      keys.forEach((key) => this.removeItem(key));
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

// Export singleton instance
export const storage = new StorageService();
