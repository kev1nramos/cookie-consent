# @kev1nramos/cookie-consent-react

React components and hooks for cookie consent management.

## Features

- ⚛️ **React 16.8+** - Works with Hooks
- 🎨 **Fully Themeable** - Customize every aspect
- 📱 **Responsive** - Mobile-first design
- ♿ **Accessible** - WCAG 2.1 AA compliant
- 🚀 **Performant** - Optimized rendering
- 🎯 **TypeScript** - Full type safety
- 🔗 **Router Agnostic** - Works with any routing solution

## Installation

```bash
pnpm add @kev1nramos/cookie-consent-react
# or
npm install @kev1nramos/cookie-consent-react
# or
yarn add @kev1nramos/cookie-consent-react
```

## Components

### CookieConsentBanner

The main banner component with full theming support.

```tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';

function App() {
  return (
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
        description: 'We use cookies to enhance your experience.',
        acceptButton: 'Accept All',
        rejectButton: 'Reject All',
      }}
      links={{
        cookiePolicy: '/cookies',
        cookieSettings: '/cookies-settings',
      }}
    />
  );
}
```

### Props

```typescript
interface CookieConsentBannerProps {
  theme?: Partial<CookieConsentTheme>;
  content: CookieConsentContent;
  links?: CookieConsentLinks;
  behavior?: CookieConsentBehavior;
  accessibility?: CookieConsentAccessibility;
  config?: ConsentManagerConfig;
  onAcceptAll?: () => void;
  onRejectAll?: () => void;
  LinkComponent?: React.ComponentType<any> | 'a';
  className?: string;
  style?: React.CSSProperties;
}
```

## Hooks

### useConsentManager

Hook for managing consent state in your components.

```tsx
import { useConsentManager } from '@kev1nramos/cookie-consent-react';

function CookieSettings() {
  const {
    consent,
    hasConsent,
    isLoading,
    acceptAll,
    rejectAll,
    setPreferences,
    withdrawConsent,
    hasConsentFor,
  } = useConsentManager();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Cookie Preferences</h2>

      <label>
        <input
          type="checkbox"
          checked={hasConsentFor('analytics')}
          onChange={(e) =>
            setPreferences({
              analytics: e.target.checked,
              marketing: hasConsentFor('marketing'),
            })
          }
        />
        Analytics Cookies
      </label>

      <label>
        <input
          type="checkbox"
          checked={hasConsentFor('marketing')}
          onChange={(e) =>
            setPreferences({
              analytics: hasConsentFor('analytics'),
              marketing: e.target.checked,
            })
          }
        />
        Marketing Cookies
      </label>

      <button onClick={acceptAll}>Accept All</button>
      <button onClick={rejectAll}>Reject All</button>
      <button onClick={withdrawConsent}>Withdraw Consent</button>
    </div>
  );
}
```

## Theme Configuration

### Colors

```typescript
theme={{
  colors: {
    banner: '#8F93FF',              // Banner background
    cta: '#27EAA6',                 // Accept button
    ctaText: '#FFFFFF',             // Accept button text
    text: '#FFFFFF',                // Primary text
    textSecondary: 'rgba(255,255,255,0.9)', // Secondary text
    links: '#27EAA6',               // Links
    secondaryButton: 'rgba(255,255,255,0.2)', // Reject button
    secondaryButtonText: '#FFFFFF',  // Reject button text
    backdrop: 'rgba(0,0,0,0.2)',    // Overlay backdrop
  },
}}
```

### Fonts and Spacing

```typescript
theme={{
  fonts: {
    family: 'Inter, system-ui, sans-serif',
  },
  borderRadius: '0.75rem',
  spacing: {
    padding: '1.5rem',
    gap: '1rem',
  },
}}
```

## Behavior Options

```typescript
behavior={{
  showDelay: 1000,               // Delay before showing (ms)
  position: 'bottom',            // 'top' | 'bottom' | 'center'
  backdropBlur: true,            // Enable backdrop blur
  closeOnBackdropClick: false,   // Close on backdrop click
  animationDuration: 300,        // Animation duration (ms)
}}
```

## Framework Integration

### Next.js App Router

```tsx
// app/layout.tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CookieConsentBanner
          theme={{
            colors: {
              banner: '#your-color',
              cta: '#your-cta',
              ctaText: '#fff',
              text: '#fff',
              links: '#your-link-color',
            },
          }}
          content={{
            title: 'Cookie Consent',
            description: 'We use cookies.',
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

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <CookieConsentBanner
        theme={{
          colors: {
            banner: '#8F93FF',
            cta: '#27EAA6',
            ctaText: '#fff',
            text: '#fff',
            links: '#27EAA6',
          },
        }}
        content={{
          title: 'Cookie Consent',
          description: 'We use cookies.',
        }}
      />
      <Component {...pageProps} />
    </>
  );
}
```

### With Next.js Link

```tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';
import Link from 'next/link';

<CookieConsentBanner
  LinkComponent={Link}
  content={{
    title: 'Cookie Consent',
    description: 'We use cookies.',
  }}
  links={{
    cookiePolicy: '/cookies',
    cookieSettings: '/settings',
  }}
/>
```

### React Router

```tsx
import { CookieConsentBanner } from '@kev1nramos/cookie-consent-react';
import { Link } from 'react-router-dom';

<CookieConsentBanner
  LinkComponent={Link}
  links={{
    cookiePolicy: '/cookies',
    cookieSettings: '/settings',
  }}
  content={{
    title: 'Cookie Consent',
    description: 'We use cookies.',
  }}
/>
```

## Advanced Examples

### Custom Styling

```tsx
<CookieConsentBanner
  theme={{
    colors: {
      banner: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cta: '#10b981',
      ctaText: '#ffffff',
      text: '#f9fafb',
      links: '#60a5fa',
    },
    borderRadius: '1rem',
    spacing: {
      padding: '2rem',
      gap: '1.5rem',
    },
  }}
  content={{
    title: 'Your Privacy Matters',
    description: (
      <>
        We use cookies to personalize your experience.
        <strong> We never sell your data.</strong>
      </>
    ),
  }}
/>
```

### With Callbacks

```tsx
<CookieConsentBanner
  content={{
    title: 'Cookie Consent',
    description: 'We use cookies.',
  }}
  onAcceptAll={() => {
    console.log('User accepted all cookies');
    // Initialize analytics
  }}
  onRejectAll={() => {
    console.log('User rejected all cookies');
    // Disable tracking
  }}
/>
```

### Multiple Sites with Different Themes

```tsx
// Site 1 - Purple theme
<CookieConsentBanner
  theme={{
    colors: {
      banner: '#8F93FF',
      cta: '#27EAA6',
      ctaText: '#000',
      text: '#FFF',
      links: '#27EAA6',
    },
  }}
  content={{ title: 'Site 1 Cookies', description: '...' }}
/>

// Site 2 - Blue theme
<CookieConsentBanner
  theme={{
    colors: {
      banner: '#3B82F6',
      cta: '#10B981',
      ctaText: '#FFF',
      text: '#FFF',
      links: '#60A5FA',
    },
  }}
  content={{ title: 'Site 2 Cookies', description: '...' }}
/>
```

## Accessibility

The component is fully accessible with:

- ARIA labels and roles
- Keyboard navigation
- Screen reader support
- Focus management
- Semantic HTML

```tsx
<CookieConsentBanner
  accessibility={{
    bannerLabel: 'Cookie consent notice',
    acceptButtonLabel: 'Accept all cookies',
    rejectButtonLabel: 'Reject all cookies',
  }}
  content={{
    title: 'Cookie Consent',
    description: 'We use cookies.',
  }}
/>
```

## License

MIT © Kevin Ramos
