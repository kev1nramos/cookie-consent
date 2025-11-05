/**
 * Cookie-based storage adapter for Cloudflare Workers compatibility
 * Works in both browser and edge runtime environments
 */

import type { StorageAdapter } from '../types';
import { validateStorageKey } from '../validation';

export interface CookieStorageOptions {
  /**
   * Cookie domain (optional)
   */
  domain?: string;

  /**
   * Cookie path (default: '/')
   */
  path?: string;

  /**
   * Secure flag (default: true)
   */
  secure?: boolean;

  /**
   * SameSite attribute (default: 'Lax')
   */
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export class CookieStorageAdapter implements StorageAdapter {
  private options: CookieStorageOptions;

  constructor(options: CookieStorageOptions = {}) {
    this.options = {
      path: '/',
      secure: true,
      sameSite: 'Lax',
      ...options,
    };
  }

  getItem(key: string): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    // Validate key to prevent injection attacks
    const keyValidation = validateStorageKey(key);
    if (!keyValidation.success) {
      console.error('[CookieStorageAdapter] Invalid cookie key:', keyValidation.error);
      return null;
    }

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name === keyValidation.data) {
          return decodeURIComponent(valueParts.join('='));
        }
      }
      return null;
    } catch (error) {
      console.error('[CookieStorageAdapter] Error reading cookie:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Validate key to prevent cookie injection attacks
    const keyValidation = validateStorageKey(key);
    if (!keyValidation.success) {
      console.error('[CookieStorageAdapter] Invalid cookie key:', keyValidation.error);
      throw new Error(`Invalid cookie key: ${keyValidation.error}`);
    }

    try {
      const encodedValue = encodeURIComponent(value);
      let cookieString = `${keyValidation.data}=${encodedValue}`;

      // Add path
      cookieString += `; path=${this.options.path}`;

      // Add domain if specified
      if (this.options.domain) {
        cookieString += `; domain=${this.options.domain}`;
      }

      // Add secure flag
      if (this.options.secure) {
        cookieString += '; secure';
      }

      // Add SameSite attribute
      cookieString += `; samesite=${this.options.sameSite}`;

      // Set max-age to 1 year (will be overridden by consent expiration logic)
      cookieString += `; max-age=${365 * 24 * 60 * 60}`;

      document.cookie = cookieString;
    } catch (error) {
      console.error('[CookieStorageAdapter] Error writing cookie:', error);
      throw error;
    }
  }

  removeItem(key: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    // Validate key to prevent injection attacks
    const keyValidation = validateStorageKey(key);
    if (!keyValidation.success) {
      console.error('[CookieStorageAdapter] Invalid cookie key:', keyValidation.error);
      return;
    }

    try {
      let cookieString = `${keyValidation.data}=; max-age=0; path=${this.options.path}`;

      if (this.options.domain) {
        cookieString += `; domain=${this.options.domain}`;
      }

      document.cookie = cookieString;
    } catch (error) {
      console.error('[CookieStorageAdapter] Error removing cookie:', error);
    }
  }
}
