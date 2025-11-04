/**
 * React Component Type Definitions
 */

import type { ReactNode } from 'react';
import type { ConsentManagerConfig } from '@kev1nramos/cookie-consent-core';

/**
 * Theme configuration for cookie consent banner
 */
export interface CookieConsentTheme {
  colors: {
    /** Banner background color (default: #8F93FF) */
    banner: string;
    /** Primary CTA button background (default: #27EAA6) */
    cta: string;
    /** CTA button text color (default: #FFFFFF) */
    ctaText: string;
    /** Banner text color (default: #FFFFFF) */
    text: string;
    /** Banner text secondary color (default: rgba(255,255,255,0.9)) */
    textSecondary?: string;
    /** Link color (default: #27EAA6) */
    links: string;
    /** Secondary button background (default: rgba(255,255,255,0.2)) */
    secondaryButton?: string;
    /** Secondary button text (default: #FFFFFF) */
    secondaryButtonText?: string;
    /** Backdrop color (default: rgba(0,0,0,0.2)) */
    backdrop?: string;
  };
  fonts?: {
    /** Font family (default: system font stack) */
    family?: string;
  };
  borderRadius?: string;
  spacing?: {
    padding?: string;
    gap?: string;
  };
}

/**
 * Content/copy for the cookie consent banner
 */
export interface CookieConsentContent {
  /** Banner title */
  title: string;
  /** Banner description/message */
  description: string | ReactNode;
  /** Accept all button text */
  acceptButton?: string;
  /** Reject all button text */
  rejectButton?: string;
  /** Learn more link text */
  learnMoreText?: string;
  /** Manage preferences link text */
  managePreferencesText?: string;
}

/**
 * Links configuration for cookie policy and settings
 */
export interface CookieConsentLinks {
  /** Cookie policy page URL */
  cookiePolicy?: string;
  /** Cookie settings/preferences page URL */
  cookieSettings?: string;
  /** Privacy policy page URL */
  privacyPolicy?: string;
}

/**
 * Behavior configuration
 */
export interface CookieConsentBehavior {
  /** Delay before showing banner in milliseconds (default: 1000) */
  showDelay?: number;
  /** Banner position (default: 'bottom') */
  position?: 'top' | 'bottom' | 'center';
  /** Enable backdrop blur effect (default: true) */
  backdropBlur?: boolean;
  /** Close banner on backdrop click (default: false) */
  closeOnBackdropClick?: boolean;
  /** Animation duration in milliseconds (default: 300) */
  animationDuration?: number;
}

/**
 * Accessibility configuration
 */
export interface CookieConsentAccessibility {
  /** ARIA label for banner (default: 'Cookie consent banner') */
  bannerLabel?: string;
  /** ARIA label for accept button */
  acceptButtonLabel?: string;
  /** ARIA label for reject button */
  rejectButtonLabel?: string;
}

/**
 * Complete props for CookieConsentBanner component
 */
export interface CookieConsentBannerProps {
  /** Theme configuration */
  theme?: Partial<CookieConsentTheme>;
  /** Content/copy */
  content: CookieConsentContent;
  /** Links configuration */
  links?: CookieConsentLinks;
  /** Behavior configuration */
  behavior?: CookieConsentBehavior;
  /** Accessibility configuration */
  accessibility?: CookieConsentAccessibility;
  /** Consent manager configuration */
  config?: ConsentManagerConfig;
  /** Callback when user accepts all cookies */
  onAcceptAll?: () => void;
  /** Callback when user rejects all cookies */
  onRejectAll?: () => void;
  /** Custom link component (for Next.js Link, React Router Link, etc.) */
  LinkComponent?: React.ComponentType<any> | 'a';
  /** Custom className for banner */
  className?: string;
  /** Custom styles for banner */
  style?: React.CSSProperties;
}

/**
 * Default theme values
 */
export const defaultTheme: CookieConsentTheme = {
  colors: {
    banner: '#8F93FF',
    cta: '#27EAA6',
    ctaText: '#FFFFFF',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.9)',
    links: '#27EAA6',
    secondaryButton: 'rgba(255, 255, 255, 0.2)',
    secondaryButtonText: '#FFFFFF',
    backdrop: 'rgba(0, 0, 0, 0.2)',
  },
  fonts: {
    family: 'system-ui, -apple-system, sans-serif',
  },
  borderRadius: '0.5rem',
  spacing: {
    padding: '1rem',
    gap: '0.75rem',
  },
};
