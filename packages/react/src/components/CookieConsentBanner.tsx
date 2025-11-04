/**
 * Cookie Consent Banner Component
 *
 * Fully themeable, accessible, GDPR-compliant cookie consent banner
 */

import React, { useState, useEffect } from 'react';
import type { CookieConsentBannerProps } from '../types';
import { defaultTheme } from '../types';
import { useConsentManager } from '../hooks/useConsentManager';

export function CookieConsentBanner({
  theme: userTheme,
  content,
  links = {},
  behavior = {},
  accessibility = {},
  config,
  onAcceptAll,
  onRejectAll,
  LinkComponent = 'a',
  className = '',
  style = {},
}: CookieConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { hasConsent, acceptAll, rejectAll } = useConsentManager(config);

  // Merge user theme with defaults
  const theme = {
    colors: { ...defaultTheme.colors, ...userTheme?.colors },
    fonts: { ...defaultTheme.fonts, ...userTheme?.fonts },
    borderRadius: userTheme?.borderRadius ?? defaultTheme.borderRadius,
    spacing: { ...defaultTheme.spacing, ...userTheme?.spacing },
  };

  // Merge behavior defaults
  const {
    showDelay = 1000,
    position = 'bottom',
    backdropBlur = true,
    closeOnBackdropClick = false,
    animationDuration = 300,
  } = behavior;

  // Merge accessibility defaults
  const {
    bannerLabel = 'Cookie consent banner',
    acceptButtonLabel,
    rejectButtonLabel,
  } = accessibility;

  useEffect(() => {
    if (!hasConsent) {
      const timer = setTimeout(() => {
        setShowBanner(true);
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10);
      }, showDelay);

      return () => clearTimeout(timer);
    }
  }, [hasConsent, showDelay]);

  const handleAcceptAll = async () => {
    await acceptAll();
    onAcceptAll?.();
    closeBanner();
  };

  const handleRejectAll = async () => {
    await rejectAll();
    onRejectAll?.();
    closeBanner();
  };

  const closeBanner = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), animationDuration);
  };

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      closeBanner();
    }
  };

  if (!showBanner) {
    return null;
  }

  // Position classes
  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
    center: 'top-1/2 -translate-y-1/2',
  };

  // Animation classes
  const animationClasses = {
    top: isVisible ? 'translate-y-0' : '-translate-y-full',
    bottom: isVisible ? 'translate-y-0' : 'translate-y-full',
    center: isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: theme.colors.backdrop,
          backdropFilter: backdropBlur ? 'blur(4px)' : 'none',
          WebkitBackdropFilter: backdropBlur ? 'blur(4px)' : 'none',
          zIndex: 9998,
          transition: `opacity ${animationDuration}ms ease-out`,
          opacity: isVisible ? 1 : 0,
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: theme.colors.banner,
          color: theme.colors.text,
          fontFamily: theme.fonts.family,
          transition: `all ${animationDuration}ms ease-out`,
          ...style,
          ...(position === 'bottom' && { bottom: 0 }),
          ...(position === 'top' && { top: 0 }),
          ...(position === 'center' && {
            top: '50%',
            left: '50%',
            right: 'auto',
            transform: isVisible ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(0.95)',
            maxWidth: '600px',
            borderRadius: theme.borderRadius,
            margin: '0 1rem',
          }),
          transform:
            position === 'top'
              ? isVisible
                ? 'translateY(0)'
                : 'translateY(-100%)'
              : position === 'bottom'
                ? isVisible
                  ? 'translateY(0)'
                  : 'translateY(100%)'
                : undefined,
        }}
        className={className}
        role="dialog"
        aria-live="polite"
        aria-label={bannerLabel}
      >
        <div
          style={{
            width: '100%',
            padding: theme.spacing.padding,
            maxWidth: '1280px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing.gap,
            }}
          >
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem',
                  color: theme.colors.text,
                }}
              >
                {content.title}
              </h2>
              <div
                style={{
                  fontSize: '0.875rem',
                  lineHeight: 1.6,
                  color: theme.colors.textSecondary,
                }}
              >
                {content.description}
                {links.cookiePolicy && (
                  <>
                    {' '}
                    <LinkComponent
                      href={links.cookiePolicy}
                      style={{
                        color: theme.colors.links,
                        textDecoration: 'underline',
                        transition: 'opacity 150ms',
                      }}
                      onMouseOver={(e: any) => (e.target.style.opacity = '0.8')}
                      onMouseOut={(e: any) => (e.target.style.opacity = '1')}
                    >
                      {content.learnMoreText || 'Learn more'}
                    </LinkComponent>
                  </>
                )}
                {links.cookieSettings && (
                  <>
                    {' · '}
                    <LinkComponent
                      href={links.cookieSettings}
                      style={{
                        color: theme.colors.textSecondary,
                        textDecoration: 'underline',
                        fontSize: '0.875rem',
                        transition: 'opacity 150ms',
                      }}
                      onMouseOver={(e: any) => (e.target.style.opacity = '1')}
                      onMouseOut={(e: any) => (e.target.style.opacity = '0.9')}
                    >
                      {content.managePreferencesText || 'Manage preferences'}
                    </LinkComponent>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                flexDirection: window.innerWidth < 640 ? 'column' : 'row',
                gap: '0.75rem',
                flexShrink: 0,
              }}
            >
              <button
                onClick={handleRejectAll}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: theme.borderRadius,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  transition: 'all 150ms',
                  backgroundColor: theme.colors.secondaryButton,
                  color: theme.colors.secondaryButtonText,
                  border: `1px solid rgba(255, 255, 255, 0.3)`,
                  cursor: 'pointer',
                }}
                aria-label={rejectButtonLabel}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.backgroundColor = theme.colors.secondaryButton!;
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              >
                {content.rejectButton || 'Reject All'}
              </button>
              <button
                onClick={handleAcceptAll}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: theme.borderRadius,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  transition: 'all 150ms',
                  backgroundColor: theme.colors.cta,
                  color: theme.colors.ctaText,
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label={acceptButtonLabel}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
              >
                {content.acceptButton || 'Accept All'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
