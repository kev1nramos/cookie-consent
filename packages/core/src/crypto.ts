/**
 * Cryptographic utilities for consent data integrity
 * Provides HMAC-based integrity verification to prevent tampering
 */

import type { ConsentState } from './types';

/**
 * Generate a simple HMAC-like signature using built-in crypto or fallback
 * This prevents basic tampering with consent data in storage
 */
export async function generateSignature(data: string, secret: string): Promise<string> {
  try {
    // Use Web Crypto API if available (browser/modern environments)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(data);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

      // Convert to hex string
      return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Fallback for environments without Web Crypto API
      // This is a simple hash for integrity checking (not cryptographically secure)
      return await fallbackHash(data + secret);
    }
  } catch (error) {
    console.error('[Crypto] Error generating signature:', error);
    // Use fallback on error
    return await fallbackHash(data + secret);
  }
}

/**
 * Verify signature matches the data
 */
export async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = await generateSignature(data, secret);
    return constantTimeCompare(signature, expectedSignature);
  } catch (error) {
    console.error('[Crypto] Error verifying signature:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Fallback hash function for environments without Web Crypto API
 * Uses a simple but effective hash algorithm
 */
async function fallbackHash(str: string): Promise<string> {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generate a device-specific secret for HMAC
 * This creates a unique key per device/browser for integrity checks
 */
export function getOrCreateSecret(storageKey: string): string {
  const secretKey = `${storageKey}_secret`;

  try {
    // Try to get existing secret from localStorage
    if (typeof localStorage !== 'undefined') {
      let secret = localStorage.getItem(secretKey);

      if (!secret) {
        // Generate new secret
        secret = generateRandomSecret();
        localStorage.setItem(secretKey, secret);
      }

      return secret;
    }
  } catch (error) {
    console.error('[Crypto] Error accessing localStorage for secret:', error);
  }

  // Fallback: generate a session-only secret (won't persist across page loads)
  // This is less secure but better than nothing
  if (!(globalThis as any).__consentSecrets) {
    (globalThis as any).__consentSecrets = {};
  }

  if (!(globalThis as any).__consentSecrets[storageKey]) {
    (globalThis as any).__consentSecrets[storageKey] = generateRandomSecret();
  }

  return (globalThis as any).__consentSecrets[storageKey];
}

/**
 * Generate a cryptographically random secret
 */
function generateRandomSecret(): string {
  try {
    // Use Web Crypto API for secure random values
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (error) {
    console.error('[Crypto] Error generating random secret:', error);
  }

  // Fallback to Math.random (not cryptographically secure)
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
}

/**
 * Extended consent state with integrity signature
 */
export interface SignedConsentState {
  version: number;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  expiresAt: number;
  __signature?: string;
  [key: string]: boolean | number | string | undefined;
}

/**
 * Sign consent state data
 */
export async function signConsentState(
  state: ConsentState,
  secret: string
): Promise<SignedConsentState> {
  // Create a copy without signature field
  const { __signature, ...stateWithoutSig } = state as SignedConsentState;

  // Create canonical JSON representation (sorted keys for consistency)
  const canonical = JSON.stringify(stateWithoutSig, Object.keys(stateWithoutSig).sort());

  // Generate signature
  const signature = await generateSignature(canonical, secret);

  // Return state with signature
  return {
    ...state,
    __signature: signature,
  };
}

/**
 * Verify consent state signature
 */
export async function verifyConsentState(
  signedState: SignedConsentState,
  secret: string
): Promise<{ valid: boolean; state: ConsentState | null }> {
  try {
    const { __signature, ...stateWithoutSig } = signedState;

    if (!__signature) {
      return { valid: false, state: null };
    }

    // Create canonical JSON representation
    const canonical = JSON.stringify(stateWithoutSig, Object.keys(stateWithoutSig).sort());

    // Verify signature
    const valid = await verifySignature(canonical, __signature, secret);

    if (valid) {
      return { valid: true, state: stateWithoutSig as ConsentState };
    } else {
      return { valid: false, state: null };
    }
  } catch (error) {
    console.error('[Crypto] Error verifying consent state:', error);
    return { valid: false, state: null };
  }
}
