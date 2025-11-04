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
