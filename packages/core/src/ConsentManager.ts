/**
 * Cookie Consent Manager
 *
 * Framework-agnostic, GDPR-compliant consent management system
 * with pluggable storage and configurable options
 */

import type {
  ConsentState,
  ConsentPreferences,
  ConsentChangeListener,
  ConsentManagerConfig,
  ConsentDebugInfo,
  StorageAdapter,
} from './types';
import { LocalStorageAdapter } from './storage';

const DEFAULT_STORAGE_KEY = 'cookie_consent';
const DEFAULT_CONSENT_VERSION = 1;
const DEFAULT_CONSENT_DURATION_DAYS = 365;

export class ConsentManager {
  private listeners: Set<ConsentChangeListener> = new Set();
  private currentState: ConsentState | null = null;
  private config: Required<Omit<ConsentManagerConfig, 'onConsentChange' | 'customCategories'>> & {
    customCategories: string[];
    onConsentChange?: ConsentChangeListener;
  };

  constructor(config: ConsentManagerConfig = {}) {
    this.config = {
      storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
      duration: config.duration ?? DEFAULT_CONSENT_DURATION_DAYS,
      version: config.version ?? DEFAULT_CONSENT_VERSION,
      storage: config.storage ?? new LocalStorageAdapter(),
      customCategories: config.customCategories ?? [],
      onConsentChange: config.onConsentChange,
      debug: config.debug ?? false,
    };

    // Register global change listener if provided
    if (this.config.onConsentChange) {
      this.onChange(this.config.onConsentChange);
    }

    // Load initial consent state
    this.loadConsent();
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[ConsentManager]', ...args);
    }
  }

  /**
   * Load consent state from storage
   */
  private async loadConsent(): Promise<ConsentState | null> {
    try {
      const stored = await this.config.storage.getItem(this.config.storageKey);
      if (!stored) {
        this.log('No stored consent found');
        return null;
      }

      const state: ConsentState = JSON.parse(stored);

      // Validate structure
      if (!this.isValidConsentState(state)) {
        this.log('Invalid consent state structure, clearing');
        await this.clearConsent();
        return null;
      }

      // Check if consent has expired
      if (Date.now() > state.expiresAt) {
        this.log('Consent has expired, clearing');
        await this.clearConsent();
        return null;
      }

      // Check version compatibility
      if (state.version !== this.config.version) {
        this.log(
          `Consent version mismatch (stored: ${state.version}, current: ${this.config.version}), clearing`
        );
        await this.clearConsent();
        return null;
      }

      this.currentState = state;
      this.log('Loaded consent state:', state);
      return state;
    } catch (error) {
      console.error('[ConsentManager] Error loading consent:', error);
      await this.clearConsent();
      return null;
    }
  }

  /**
   * Validate consent state structure
   */
  private isValidConsentState(state: any): state is ConsentState {
    const hasRequiredFields =
      typeof state === 'object' &&
      typeof state.version === 'number' &&
      typeof state.essential === 'boolean' &&
      typeof state.analytics === 'boolean' &&
      typeof state.marketing === 'boolean' &&
      typeof state.timestamp === 'number' &&
      typeof state.expiresAt === 'number';

    if (!hasRequiredFields) {
      return false;
    }

    // Validate custom categories if any are configured
    for (const category of this.config.customCategories) {
      if (typeof state[category] !== 'boolean') {
        return false;
      }
    }

    return true;
  }

  /**
   * Save consent state to storage
   */
  private async saveConsent(preferences: ConsentPreferences): Promise<ConsentState> {
    const timestamp = Date.now();
    const expiresAt = timestamp + this.config.duration * 24 * 60 * 60 * 1000;

    const state: ConsentState = {
      version: this.config.version,
      essential: true, // Always true
      analytics: preferences.analytics,
      marketing: preferences.marketing,
      timestamp,
      expiresAt,
    };

    // Add custom categories
    for (const category of this.config.customCategories) {
      state[category] = preferences[category] ?? false;
    }

    try {
      await this.config.storage.setItem(this.config.storageKey, JSON.stringify(state));
      this.currentState = state;
      this.log('Saved consent state:', state);
      this.notifyListeners(state);
      return state;
    } catch (error) {
      console.error('[ConsentManager] Error saving consent:', error);
      return state;
    }
  }

  /**
   * Clear consent from storage
   */
  private async clearConsent(): Promise<void> {
    try {
      await this.config.storage.removeItem(this.config.storageKey);
      this.currentState = null;
      this.log('Cleared consent');
    } catch (error) {
      console.error('[ConsentManager] Error clearing consent:', error);
    }
  }

  /**
   * Notify all listeners of consent changes
   */
  private notifyListeners(state: ConsentState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('[ConsentManager] Error in listener:', error);
      }
    });
  }

  /**
   * Get current consent state
   */
  public async getConsent(): Promise<ConsentState | null> {
    if (!this.currentState) {
      this.currentState = await this.loadConsent();
    }
    return this.currentState;
  }

  /**
   * Get current consent state synchronously (returns cached value)
   */
  public getConsentSync(): ConsentState | null {
    return this.currentState;
  }

  /**
   * Check if user has made a consent decision
   */
  public async hasConsent(): Promise<boolean> {
    const consent = await this.getConsent();
    return consent !== null;
  }

  /**
   * Check if user has made a consent decision (synchronous)
   */
  public hasConsentSync(): boolean {
    return this.currentState !== null;
  }

  /**
   * Check if a specific category is consented
   */
  public async hasConsentFor(category: string): Promise<boolean> {
    const consent = await this.getConsent();
    if (!consent) return false;
    return consent[category] === true;
  }

  /**
   * Check if a specific category is consented (synchronous)
   */
  public hasConsentForSync(category: string): boolean {
    if (!this.currentState) return false;
    return this.currentState[category] === true;
  }

  /**
   * Accept all cookies
   */
  public async acceptAll(): Promise<ConsentState> {
    const preferences: ConsentPreferences = {
      analytics: true,
      marketing: true,
    };

    // Accept all custom categories
    for (const category of this.config.customCategories) {
      preferences[category] = true;
    }

    return this.saveConsent(preferences);
  }

  /**
   * Reject all non-essential cookies
   */
  public async rejectAll(): Promise<ConsentState> {
    const preferences: ConsentPreferences = {
      analytics: false,
      marketing: false,
    };

    // Reject all custom categories
    for (const category of this.config.customCategories) {
      preferences[category] = false;
    }

    return this.saveConsent(preferences);
  }

  /**
   * Set custom consent preferences
   */
  public async setPreferences(preferences: ConsentPreferences): Promise<ConsentState> {
    return this.saveConsent(preferences);
  }

  /**
   * Withdraw consent (GDPR requirement)
   */
  public async withdrawConsent(): Promise<void> {
    await this.clearConsent();

    // Notify listeners with a "reject all" state without saving
    const withdrawnState: ConsentState = {
      version: this.config.version,
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      expiresAt: Date.now(),
    };

    // Add custom categories as false
    for (const category of this.config.customCategories) {
      withdrawnState[category] = false;
    }

    this.notifyListeners(withdrawnState);
    this.log('Consent withdrawn');
  }

  /**
   * Subscribe to consent changes
   * @returns Unsubscribe function
   */
  public onChange(listener: ConsentChangeListener): () => void {
    this.listeners.add(listener);

    // Immediately notify with current state if it exists
    if (this.currentState) {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('[ConsentManager] Error in initial listener call:', error);
      }
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get consent state for debugging
   */
  public async getDebugInfo(): Promise<ConsentDebugInfo> {
    const state = await this.getConsent();
    const now = Date.now();

    return {
      hasConsent: await this.hasConsent(),
      state,
      isExpired: state ? now > state.expiresAt : false,
      daysRemaining: state ? Math.floor((state.expiresAt - now) / (24 * 60 * 60 * 1000)) : null,
      storageKey: this.config.storageKey,
      version: this.config.version,
    };
  }
}
