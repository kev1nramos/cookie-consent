/**
 * Custom hook for responsive media queries
 * SSR-safe with proper hydration support
 */

import { useState, useEffect } from 'react';

/**
 * Hook to check if a media query matches
 * Returns false during SSR to prevent hydration mismatches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Update on change
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      // Legacy browsers (Safari < 14)
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
}

/**
 * Hook to check if screen width is below a breakpoint
 * SSR-safe
 */
export function useIsMobile(breakpoint: number = 640): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
