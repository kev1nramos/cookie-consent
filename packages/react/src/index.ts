/**
 * @kev1nramos/cookie-consent-react
 *
 * React components and hooks for cookie consent management
 */

export { CookieConsentBanner } from './components/CookieConsentBanner';
export { useConsentManager } from './hooks/useConsentManager';

export type {
  CookieConsentTheme,
  CookieConsentContent,
  CookieConsentLinks,
  CookieConsentBehavior,
  CookieConsentAccessibility,
  CookieConsentBannerProps,
} from './types';

export { defaultTheme } from './types';

// Re-export core types for convenience
export type {
  ConsentState,
  ConsentPreferences,
  ConsentCategory,
  ConsentChangeListener,
  StorageAdapter,
  ConsentManagerConfig,
} from '@kev1nramos/cookie-consent-core';

export { ConsentManager } from '@kev1nramos/cookie-consent-core';
