/**
 * Cookie Consent Type Definitions
 *
 * Framework-agnostic type definitions for GDPR-compliant cookie consent management
 */

export type ConsentCategory = 'essential' | 'analytics' | 'marketing' | string;

export interface ConsentState {
  version: number;
  essential: boolean; // Always true - required for core functionality
  analytics: boolean; // Google Analytics, Plausible, etc.
  marketing: boolean; // Facebook Pixel, LinkedIn Insight Tag, etc.
  timestamp: number; // When consent was given (milliseconds)
  expiresAt: number; // When consent expires (milliseconds)
  [key: string]: boolean | number; // Support for custom categories
}

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
  [key: string]: boolean; // Support for custom categories
}

export type ConsentChangeListener = (state: ConsentState) => void;

/**
 * Storage adapter interface for pluggable storage backends
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

/**
 * Configuration options for ConsentManager
 */
export interface ConsentManagerConfig {
  /**
   * Key used for storage (default: 'cookie_consent')
   */
  storageKey?: string;

  /**
   * Consent duration in days (default: 365)
   */
  duration?: number;

  /**
   * Consent version for migration purposes (default: 1)
   */
  version?: number;

  /**
   * Custom storage adapter (default: localStorage)
   */
  storage?: StorageAdapter;

  /**
   * Additional consent categories beyond essential, analytics, marketing
   */
  customCategories?: string[];

  /**
   * Callback fired when consent changes
   */
  onConsentChange?: ConsentChangeListener;

  /**
   * Enable debug logging (default: false)
   */
  debug?: boolean;

  /**
   * Enable integrity verification using HMAC signatures (default: true)
   * Prevents tampering with consent data in storage
   */
  enableIntegrity?: boolean;
}

/**
 * Debug information for troubleshooting
 */
export interface ConsentDebugInfo {
  hasConsent: boolean;
  state: ConsentState | null;
  isExpired: boolean;
  daysRemaining: number | null;
  storageKey: string;
  version: number;
}
