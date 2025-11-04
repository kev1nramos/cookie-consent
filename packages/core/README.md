# @kev1nramos/cookie-consent-core

Framework-agnostic cookie consent management library with GDPR compliance.

## Features

- 🚀 **Zero Dependencies** - Pure TypeScript implementation
- 💾 **Pluggable Storage** - LocalStorage, Cookies, or custom adapters
- 🔒 **GDPR Compliant** - Built-in consent versioning and expiration
- ⚡ **Async/Sync APIs** - Use what fits your needs
- 🎯 **TypeScript First** - Full type safety
- 🌍 **Universal** - Works in any JavaScript environment
- ⚙️ **Configurable** - Custom categories, duration, and more

## Installation

```bash
pnpm add @kev1nramos/cookie-consent-core
# or
npm install @kev1nramos/cookie-consent-core
# or
yarn add @kev1nramos/cookie-consent-core
```

## Quick Start

```typescript
import { ConsentManager } from '@kev1nramos/cookie-consent-core';

// Create manager instance
const manager = new ConsentManager({
  storageKey: 'my_consent',
  duration: 365, // days
  version: 1,
});

// Accept all cookies
await manager.acceptAll();

// Check consent
const hasConsent = await manager.hasConsent();
const hasAnalytics = await manager.hasConsentFor('analytics');

// Listen to changes
manager.onChange((state) => {
  console.log('Consent changed:', state);
});
```

## API Reference

### ConsentManager

#### Constructor

```typescript
new ConsentManager(config?: ConsentManagerConfig)
```

**Config Options:**

```typescript
interface ConsentManagerConfig {
  storageKey?: string;           // Storage key (default: 'cookie_consent')
  duration?: number;             // Consent duration in days (default: 365)
  version?: number;              // Consent version (default: 1)
  storage?: StorageAdapter;      // Storage adapter (default: LocalStorageAdapter)
  customCategories?: string[];   // Additional categories beyond analytics/marketing
  onConsentChange?: (state: ConsentState) => void;
  debug?: boolean;               // Enable debug logging
}
```

#### Methods

**`acceptAll(): Promise<ConsentState>`**
Accept all cookie categories.

**`rejectAll(): Promise<ConsentState>`**
Reject all non-essential cookies.

**`setPreferences(preferences: ConsentPreferences): Promise<ConsentState>`**
Set custom consent preferences.

**`getConsent(): Promise<ConsentState | null>`**
Get current consent state (async).

**`getConsentSync(): ConsentState | null`**
Get current consent state (sync).

**`hasConsent(): Promise<boolean>`**
Check if user has made a consent decision.

**`hasConsentFor(category: string): Promise<boolean>`**
Check if specific category is consented.

**`withdrawConsent(): Promise<void>`**
Withdraw all consent (GDPR requirement).

**`onChange(listener: ConsentChangeListener): () => void`**
Subscribe to consent changes. Returns unsubscribe function.

**`getDebugInfo(): Promise<ConsentDebugInfo>`**
Get debug information.

## Storage Adapters

### LocalStorage (Default)

```typescript
import { LocalStorageAdapter } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager({
  storage: new LocalStorageAdapter(),
});
```

### Cookie Storage

Perfect for Cloudflare Workers and edge environments:

```typescript
import { CookieStorageAdapter } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager({
  storage: new CookieStorageAdapter({
    domain: '.yourdomain.com',
    path: '/',
    secure: true,
    sameSite: 'Lax',
  }),
});
```

### Memory Storage

Useful for testing:

```typescript
import { MemoryStorageAdapter } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager({
  storage: new MemoryStorageAdapter(),
});
```

### Custom Storage Adapter

```typescript
import type { StorageAdapter } from '@kev1nramos/cookie-consent-core';

class MyCustomAdapter implements StorageAdapter {
  getItem(key: string): string | null | Promise<string | null> {
    // Your implementation
  }

  setItem(key: string, value: string): void | Promise<void> {
    // Your implementation
  }

  removeItem(key: string): void | Promise<void> {
    // Your implementation
  }
}

const manager = new ConsentManager({
  storage: new MyCustomAdapter(),
});
```

## Custom Categories

Add categories beyond the default analytics/marketing:

```typescript
const manager = new ConsentManager({
  customCategories: ['preferences', 'advertising', 'social-media'],
});

await manager.setPreferences({
  analytics: true,
  marketing: false,
  preferences: true,
  advertising: false,
  'social-media': true,
});
```

## Consent State

```typescript
interface ConsentState {
  version: number;
  essential: boolean;  // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;   // When consent was given
  expiresAt: number;   // When consent expires
  [key: string]: boolean | number; // Custom categories
}
```

## Examples

### Vanilla JavaScript

```javascript
import { ConsentManager } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager();

document.getElementById('accept-all').addEventListener('click', async () => {
  await manager.acceptAll();
  hideBanner();
});

document.getElementById('reject-all').addEventListener('click', async () => {
  await manager.rejectAll();
  hideBanner();
});

// Check on page load
const hasConsent = await manager.hasConsent();
if (!hasConsent) {
  showBanner();
}
```

### Node.js / Cloudflare Workers

```typescript
import { ConsentManager, CookieStorageAdapter } from '@kev1nramos/cookie-consent-core';

// Use cookie storage for edge compatibility
const manager = new ConsentManager({
  storage: new CookieStorageAdapter(),
});

// In your request handler
export async function onRequest(context) {
  const consent = await manager.getConsent();

  if (consent?.analytics) {
    // Enable analytics
  }

  return new Response('Hello');
}
```

## License

MIT © Kevin Ramos
