/**
 * React hook for managing cookie consent
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ConsentManager, type ConsentState, type ConsentManagerConfig } from '@kev1nramos/cookie-consent-core';

export interface UseConsentManagerReturn {
  /** Current consent state */
  consent: ConsentState | null;
  /** Whether user has made a consent decision */
  hasConsent: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Accept all cookies */
  acceptAll: () => Promise<void>;
  /** Reject all cookies */
  rejectAll: () => Promise<void>;
  /** Set custom preferences */
  setPreferences: (preferences: { analytics: boolean; marketing: boolean; [key: string]: boolean }) => Promise<void>;
  /** Withdraw consent */
  withdrawConsent: () => Promise<void>;
  /** Check if specific category is consented */
  hasConsentFor: (category: string) => boolean;
  /** Consent manager instance */
  manager: ConsentManager;
}

/**
 * Hook for managing cookie consent with React
 */
export function useConsentManager(config?: ConsentManagerConfig): UseConsentManagerReturn {
  const managerRef = useRef<ConsentManager>(new ConsentManager(config || {}));
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const manager = managerRef.current;

  useEffect(() => {
    // Load initial consent state
    manager.getConsent().then((state) => {
      setConsent(state);
      setIsLoading(false);
    });

    // Subscribe to consent changes
    const unsubscribe = manager.onChange((newState) => {
      setConsent(newState);
    });

    return unsubscribe;
  }, [manager]);

  const acceptAll = useCallback(async () => {
    const newState = await manager.acceptAll();
    setConsent(newState);
  }, [manager]);

  const rejectAll = useCallback(async () => {
    const newState = await manager.rejectAll();
    setConsent(newState);
  }, [manager]);

  const setPreferences = useCallback(
    async (preferences: { analytics: boolean; marketing: boolean; [key: string]: boolean }) => {
      const newState = await manager.setPreferences(preferences);
      setConsent(newState);
    },
    [manager]
  );

  const withdrawConsent = useCallback(async () => {
    await manager.withdrawConsent();
    setConsent(null);
  }, [manager]);

  const hasConsentFor = useCallback(
    (category: string): boolean => {
      return manager.hasConsentForSync(category);
    },
    [manager]
  );

  return {
    consent,
    hasConsent: consent !== null,
    isLoading,
    acceptAll,
    rejectAll,
    setPreferences,
    withdrawConsent,
    hasConsentFor,
    manager,
  };
}
