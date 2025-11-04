/**
 * Cookie-based storage adapter for Cloudflare Workers compatibility
 * Works in both browser and edge runtime environments
 */

import type { StorageAdapter } from '../types';

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

    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name === key) {
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

    try {
      const encodedValue = encodeURIComponent(value);
      let cookieString = `${key}=${encodedValue}`;

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
    }
  }

  removeItem(key: string): void {
    if (typeof document === 'undefined') {
      return;
    }

    try {
      let cookieString = `${key}=; max-age=0; path=${this.options.path}`;

      if (this.options.domain) {
        cookieString += `; domain=${this.options.domain}`;
      }

      document.cookie = cookieString;
    } catch (error) {
      console.error('[CookieStorageAdapter] Error removing cookie:', error);
    }
  }
}
