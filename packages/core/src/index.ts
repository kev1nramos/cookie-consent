/**
 * @kev1nramos/cookie-consent-core
 *
 * Framework-agnostic cookie consent management library
 */

export { ConsentManager } from './ConsentManager';

export type {
  ConsentCategory,
  ConsentState,
  ConsentPreferences,
  ConsentChangeListener,
  StorageAdapter,
  ConsentManagerConfig,
  ConsentDebugInfo,
} from './types';

export {
  LocalStorageAdapter,
  CookieStorageAdapter,
  MemoryStorageAdapter,
} from './storage';

export type { CookieStorageOptions } from './storage';

export {
  validateConsentState,
  validateCustomCategories,
  validateStorageKey,
  validateDuration,
  validateVersion,
} from './validation';

export {
  signConsentState,
  verifyConsentState,
  generateSignature,
  verifySignature,
  getOrCreateSecret,
  type SignedConsentState,
} from './crypto';
