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
import {
  validateConsentState,
  validateCustomCategories,
  validateStorageKey,
  validateDuration,
  validateVersion,
} from './validation';
import {
  signConsentState,
  verifyConsentState,
  getOrCreateSecret,
  type SignedConsentState,
} from './crypto';

const DEFAULT_STORAGE_KEY = 'cookie_consent';
const DEFAULT_CONSENT_VERSION = 1;
const DEFAULT_CONSENT_DURATION_DAYS = 365;

const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_CONSENT_CHANGES_PER_WINDOW = 5;
// Prevent memory leaks from excessive listeners
const MAX_LISTENERS = 100;

export class ConsentManager {
  private listeners: Set<ConsentChangeListener> = new Set();
  private currentState: ConsentState | null = null;
  private secret: string = '';
  private loadingPromise: Promise<ConsentState | null> | null = null;
  private isInitialized: boolean = false;
  private lastConsentChangeTimestamps: number[] = [];
  private config: Required<Omit<ConsentManagerConfig, 'onConsentChange' | 'customCategories' | 'enableIntegrity'>> & {
    customCategories: string[];
    onConsentChange?: ConsentChangeListener;
    enableIntegrity: boolean;
  };

  constructor(config: ConsentManagerConfig = {}) {
    // Validate storage key
    const storageKey = config.storageKey ?? DEFAULT_STORAGE_KEY;
    const storageKeyValidation = validateStorageKey(storageKey);
    if (!storageKeyValidation.success) {
      throw new Error(`Invalid storage key: ${storageKeyValidation.error}`);
    }

    // Validate duration
    const duration = config.duration ?? DEFAULT_CONSENT_DURATION_DAYS;
    const durationValidation = validateDuration(duration);
    if (!durationValidation.success) {
      throw new Error(`Invalid duration: ${durationValidation.error}`);
    }

    // Validate version
    const version = config.version ?? DEFAULT_CONSENT_VERSION;
    const versionValidation = validateVersion(version);
    if (!versionValidation.success) {
      throw new Error(`Invalid version: ${versionValidation.error}`);
    }

    // Validate custom categories
    const customCategories = config.customCategories ?? [];
    const categoriesValidation = validateCustomCategories(customCategories);
    if (!categoriesValidation.success) {
      throw new Error(`Invalid custom categories: ${categoriesValidation.error}`);
    }

    this.config = {
      storageKey: storageKeyValidation.data,
      duration: durationValidation.data,
      version: versionValidation.data,
      storage: config.storage ?? new LocalStorageAdapter(),
      customCategories: categoriesValidation.data,
      onConsentChange: config.onConsentChange,
      debug: config.debug ?? false,
      enableIntegrity: config.enableIntegrity ?? true,
    };

    // Initialize secret for integrity verification
    if (this.config.enableIntegrity) {
      this.secret = getOrCreateSecret(this.config.storageKey);
    }

    // Register global change listener if provided
    if (this.config.onConsentChange) {
      this.onChange(this.config.onConsentChange);
    }

    // Load initial consent state (fire and forget - use getConsent() for guaranteed load)
    this.ensureLoaded();
  }

  /**
   * Ensure consent is loaded (prevents race conditions)
   * Returns the existing promise if already loading
   */
  private ensureLoaded(): Promise<ConsentState | null> {
    if (this.isInitialized) {
      return Promise.resolve(this.currentState);
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadConsent()
      .then((state) => {
        this.isInitialized = true;
        this.loadingPromise = null;
        return state;
      })
      .catch((error) => {
        console.error('[ConsentManager] Error during initialization:', error);
        this.isInitialized = true; // Mark as initialized even on error
        this.loadingPromise = null;
        return null;
      });

    return this.loadingPromise;
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
   * Check if rate limit has been exceeded
   * Prevents DoS attacks via rapid consent changes
   */
  private checkRateLimit(): boolean {
    const now = Date.now();

    // Remove timestamps outside the current window
    this.lastConsentChangeTimestamps = this.lastConsentChangeTimestamps.filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
    );

    // Check if limit exceeded
    if (this.lastConsentChangeTimestamps.length >= MAX_CONSENT_CHANGES_PER_WINDOW) {
      return false; // Rate limit exceeded
    }

    // Add current timestamp
    this.lastConsentChangeTimestamps.push(now);
    return true; // Rate limit OK
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

      // Parse JSON (may throw)
      let parsed: unknown;
      try {
        parsed = JSON.parse(stored);
      } catch (parseError) {
        console.error('[ConsentManager] Failed to parse stored consent:', parseError);
        await this.clearConsent();
        return null;
      }

      // Verify integrity signature if enabled
      let state: ConsentState;
      if (this.config.enableIntegrity) {
        const verification = await verifyConsentState(parsed as SignedConsentState, this.secret);
        if (!verification.valid || !verification.state) {
          console.error('[ConsentManager] Integrity verification failed - data may have been tampered with');
          this.log('Integrity check failed, clearing consent');
          await this.clearConsent();
          return null;
        }
        state = verification.state;
      } else {
        // Skip integrity check if disabled
        const validation = validateConsentState(parsed, this.config.customCategories);
        if (!validation.success) {
          console.error('[ConsentManager] Invalid consent state:', validation.error);
          this.log('Invalid consent state structure, clearing');
          await this.clearConsent();
          return null;
        }
        state = validation.data as ConsentState;
      }

      // Additional validation even after signature check (defense in depth)
      const validation = validateConsentState(state, this.config.customCategories);
      if (!validation.success) {
        console.error('[ConsentManager] Invalid consent state after integrity check:', validation.error);
        await this.clearConsent();
        return null;
      }
      state = validation.data as ConsentState;

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
   * Save consent state to storage
   */
  private async saveConsent(preferences: ConsentPreferences): Promise<ConsentState> {
    // Check rate limit to prevent abuse
    if (!this.checkRateLimit()) {
      const error = new Error('Rate limit exceeded: Too many consent changes in a short time');
      console.error('[ConsentManager]', error.message);
      throw error;
    }

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
      // Sign the state if integrity is enabled
      let stateToStore: ConsentState | SignedConsentState = state;
      if (this.config.enableIntegrity) {
        stateToStore = await signConsentState(state, this.secret);
        this.log('Signed consent state with integrity signature');
      }

      await this.config.storage.setItem(this.config.storageKey, JSON.stringify(stateToStore));
      this.currentState = state; // Store unsigned state in memory
      this.log('Saved consent state:', state);
      this.notifyListeners(state);
      return state;
    } catch (error) {
      console.error('[ConsentManager] Error saving consent:', error);
      throw error; // Throw instead of silently returning to surface the error
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
   * Waits for initialization to complete if still loading
   */
  public async getConsent(): Promise<ConsentState | null> {
    await this.ensureLoaded();
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
    await this.ensureLoaded();
    return this.currentState !== null;
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
    await this.ensureLoaded();
    if (!this.currentState) return false;
    return this.currentState[category] === true;
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
    // Check listener limit to prevent memory leaks
    if (this.listeners.size >= MAX_LISTENERS) {
      console.warn(
        `[ConsentManager] Maximum listener limit (${MAX_LISTENERS}) reached. ` +
        'This may indicate a memory leak. Please ensure listeners are properly unsubscribed.'
      );
    }

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
   * Remove all listeners (useful for cleanup)
   */
  public removeAllListeners(): void {
    this.listeners.clear();
    this.log('All listeners removed');
  }

  /**
   * Get the number of active listeners (useful for debugging)
   */
  public getListenerCount(): number {
    return this.listeners.size;
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
