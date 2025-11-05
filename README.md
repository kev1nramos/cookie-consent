# @kev1nramos/cookie-consent

Production-ready, GDPR-compliant cookie consent library for Next.js and React applications.

## Features

- 🎨 **Fully Themeable** - Customize colors, fonts, spacing, and layout
- 🚀 **Framework Agnostic Core** - Works with any JavaScript framework
- ⚛️ **React Components** - Ready-to-use components and hooks
- 🔒 **GDPR/CCPA Compliant** - Built-in consent management and withdrawal
- 🛡️ **Security First** - HMAC integrity verification, XSS protection, rate limiting
- 💾 **Pluggable Storage** - LocalStorage, Cookie, or custom adapters
- 🌍 **i18n Ready** - Bring your own translations
- ⚡ **Cloudflare Workers Compatible** - No Node.js-specific APIs
- 📱 **Fully Responsive** - Works on all devices with SSR support
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 📦 **Tree-shakeable** - Only import what you need
- 🎯 **TypeScript First** - Full type safety

## Packages

This monorepo contains multiple packages:

| Package | Description | Version |
|---------|-------------|---------|
| [@kev1nramos/cookie-consent-core](./packages/core) | Framework-agnostic consent management | 0.1.0 |
| [@kev1nramos/cookie-consent-react](./packages/react) | React components and hooks | 0.1.0 |
| [@kev1nramos/cookie-consent-nextjs](./packages/nextjs) | Next.js optimizations (coming soon) | - |
| [@kev1nramos/cookie-consent-analytics](./packages/analytics) | Analytics integrations (coming soon) | - |

## Quick Start

### Installation

```bash
# For React applications
pnpm add @kev1nramos/cookie-consent-react

# Or with npm
npm install @kev1nramos/cookie-consent-react

# Or with yarn
yarn add @kev1nramos/cookie-consent-react
```

### Basic Usage (React)

```tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';

function App() {
  return (
    <>
      <CookieConsentBanner
        theme={{
          colors: {
            banner: '#8F93FF',
            cta: '#27EAA6',
            ctaText: '#FFFFFF',
            text: '#FFFFFF',
            links: '#27EAA6',
          },
        }}
        content={{
          title: 'We value your privacy',
          description: 'We use cookies to enhance your browsing experience and analyze our traffic.',
          acceptButton: 'Accept All',
          rejectButton: 'Reject All',
          learnMoreText: 'Learn more',
          managePreferencesText: 'Manage preferences',
        }}
        links={{
          cookiePolicy: '/cookies',
          cookieSettings: '/cookies-settings',
        }}
      />

      {/* Your app content */}
    </>
  );
}
```

### Usage with Next.js App Router

```tsx
// app/layout.tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CookieConsentBanner
          theme={{
            colors: {
              banner: '#your-brand-color',
              cta: '#your-cta-color',
              ctaText: '#FFFFFF',
              text: '#FFFFFF',
              links: '#your-link-color',
            },
          }}
          content={{
            title: 'Cookie Consent',
            description: 'We use cookies to improve your experience.',
          }}
          links={{
            cookiePolicy: '/cookies',
            cookieSettings: '/cookies-settings',
          }}
        />
        {children}
      </body>
    </html>
  );
}
```

### Using the Hook

```tsx
import { useConsentManager } from '@kev1nramos/cookie-consent-react';

function MyComponent() {
  const {
    consent,
    hasConsent,
    acceptAll,
    rejectAll,
    hasConsentFor
  } = useConsentManager();

  if (!hasConsent) {
    return <div>No consent decision made yet</div>;
  }

  return (
    <div>
      <p>Analytics: {hasConsentFor('analytics') ? 'Enabled' : 'Disabled'}</p>
      <p>Marketing: {hasConsentFor('marketing') ? 'Enabled' : 'Disabled'}</p>

      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject All</button>
    </div>
  );
}
```

## Core Package Usage

For framework-agnostic usage:

```typescript
import { ConsentManager, LocalStorageAdapter } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager({
  storageKey: 'my_app_consent',
  duration: 365,
  version: 1,
  storage: new LocalStorageAdapter(),
});

// Accept all cookies
await manager.acceptAll();

// Check consent
const hasAnalytics = await manager.hasConsentFor('analytics');

// Listen to changes
manager.onChange((state) => {
  console.log('Consent changed:', state);
});
```

## Configuration

### Theme Options

```typescript
interface CookieConsentTheme {
  colors: {
    banner: string;              // Banner background color
    cta: string;                 // Accept button color
    ctaText: string;             // Accept button text color
    text: string;                // Banner text color
    textSecondary?: string;      // Secondary text color
    links: string;               // Link color
    secondaryButton?: string;    // Reject button background
    secondaryButtonText?: string;// Reject button text
    backdrop?: string;           // Backdrop overlay color
  };
  fonts?: {
    family?: string;             // Font family
  };
  borderRadius?: string;         // Border radius (e.g., '0.5rem')
  spacing?: {
    padding?: string;            // Internal padding
    gap?: string;                // Gap between elements
  };
}
```

### Behavior Options

```typescript
interface CookieConsentBehavior {
  showDelay?: number;            // Delay before showing (ms)
  position?: 'top' | 'bottom' | 'center';
  backdropBlur?: boolean;        // Enable backdrop blur
  closeOnBackdropClick?: boolean;// Allow closing on backdrop click
  animationDuration?: number;    // Animation duration (ms)
}
```

### Storage Adapters

```typescript
import {
  LocalStorageAdapter,   // Browser localStorage
  CookieStorageAdapter,  // Browser cookies
  MemoryStorageAdapter,  // In-memory (testing)
} from '@kev1nramos/cookie-consent-core';

// Use cookie storage for Cloudflare Workers compatibility
const manager = new ConsentManager({
  storage: new CookieStorageAdapter({
    domain: '.yourdomain.com',
    secure: true,
    sameSite: 'Lax',
  }),
});
```

## Security

This library is built with security as a top priority. See [SECURITY.md](./SECURITY.md) for comprehensive security documentation.

### Key Security Features

- **Prototype Pollution Protection** - All stored data is validated with Zod schemas
- **Cookie Injection Prevention** - Strict input validation and sanitization
- **HMAC Integrity Verification** - Detect tampering with consent data (enabled by default)
- **Rate Limiting** - Prevent DoS attacks via rapid consent changes
- **Memory Leak Prevention** - Automatic listener management and cleanup
- **XSS Protection** - No use of `eval()` or `innerHTML`, tamper detection
- **SSR Safe** - Proper handling of browser APIs with hydration support

### Secure Configuration Example

```typescript
import { ConsentManager, CookieStorageAdapter } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager({
  storage: new CookieStorageAdapter({
    secure: true,      // Only send over HTTPS
    sameSite: 'Strict', // CSRF protection
  }),
  enableIntegrity: true, // HMAC signatures (default: true)
  duration: 90,          // Shorter duration = better security
  debug: false,          // Disable in production
});
```

**Read the full [Security Policy](./SECURITY.md) for:**
- Detailed security features and mitigations
- Best practices for production deployments
- Known limitations (e.g., HttpOnly cookies)
- GDPR compliance guidelines
- How to report security vulnerabilities

## Cloudflare Workers Support

The library is fully compatible with Cloudflare Workers and Pages:

```typescript
import { ConsentManager, CookieStorageAdapter } from '@kev1nramos/cookie-consent-core';

// Use cookie storage instead of localStorage
const manager = new ConsentManager({
  storage: new CookieStorageAdapter({
    secure: true,
    sameSite: 'Lax',
  }),
});
```

## Development

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run in development mode
pnpm dev

# Type check
pnpm type-check

# Run tests
pnpm test
```

### Project Structure

```
cookie-consent/
├── packages/
│   ├── core/              # Framework-agnostic core
│   ├── react/             # React components
│   ├── nextjs/            # Next.js package (planned)
│   └── analytics/         # Analytics integrations (planned)
├── examples/              # Example applications
└── docs/                  # Documentation
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © Kevin Ramos

## Why This Library?

Built from experience managing cookie consent across multiple production applications, this library provides:

- **Zero third-party dependencies** in core package
- **Production-tested** patterns and implementations
- **Complete control** over styling and behavior
- **Type-safe** API with full TypeScript support
- **Flexible architecture** supporting multiple frameworks
- **Privacy-first** design with no tracking

## Roadmap

- [x] Core consent management
- [x] React components and hooks
- [x] Pluggable storage adapters
- [ ] Next.js package with SSR support
- [ ] Analytics provider integrations (GA4, FB Pixel, LinkedIn)
- [ ] Vue.js components
- [ ] Svelte components
- [ ] Cookie scanner utility
- [ ] Admin dashboard for consent analytics

## Support

For issues, questions, or contributions:

- GitHub: [https://github.com/kev1nramos/cookie-consent](https://github.com/kev1nramos/cookie-consent)
- Issues: [https://github.com/kev1nramos/cookie-consent/issues](https://github.com/kev1nramos/cookie-consent/issues)

---

Made with ❤️ by [Kevin Ramos](https://github.com/kev1nramos)
