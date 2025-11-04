/**
 * LocalStorage adapter for browser environments
 */

import type { StorageAdapter } from '../types';

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error reading from localStorage:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error writing to localStorage:', error);
    }
  }

  removeItem(key: string): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[LocalStorageAdapter] Error removing from localStorage:', error);
    }
  }
}
