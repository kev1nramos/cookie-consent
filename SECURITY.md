# Security Policy

## Overview

The `@kev1nramos/cookie-consent` library is designed with security as a top priority. This document outlines the security features, best practices, known limitations, and how to report security vulnerabilities.

## Security Features

### 1. Prototype Pollution Protection

**Risk:** Malicious JSON data stored in localStorage/cookies could pollute JavaScript object prototypes.

**Mitigation:**
- All stored data is validated using Zod schema validation
- Parsed objects are created with `Object.create(null)` to prevent prototype pollution
- Only expected properties are copied to the final state object
- Strict type checking with TypeScript

**Example of Protection:**
```typescript
// Malicious payload is rejected
localStorage.setItem('cookie_consent', '{"__proto__": {"isAdmin": true}}');
// The library will detect this as invalid and clear the consent
```

### 2. Cookie Injection Prevention

**Risk:** Unsanitized cookie keys could allow attackers to inject arbitrary cookies.

**Mitigation:**
- Storage keys are validated against a strict regex: `/^[a-zA-Z0-9_-]+$/`
- Only alphanumeric characters, underscores, and hyphens are allowed
- Maximum key length of 256 characters
- Invalid keys are rejected with clear error messages

**Example of Protection:**
```typescript
// This malicious key is rejected
new ConsentManager({
  storageKey: 'consent; HttpOnly; admin=true;' // ❌ Throws error
});

// Only safe keys are accepted
new ConsentManager({
  storageKey: 'cookie_consent' // ✅ Valid
});
```

### 3. Integrity Verification (HMAC)

**Risk:** Consent data in storage could be tampered with by malicious scripts or browser extensions.

**Mitigation:**
- HMAC-SHA256 signatures are added to all stored consent data (enabled by default)
- Each device has a unique secret key stored separately
- Tampering is detected and consent is cleared automatically
- Constant-time signature comparison prevents timing attacks

**Usage:**
```typescript
const manager = new ConsentManager({
  enableIntegrity: true // Default: true
});
```

**How It Works:**
1. Consent state is signed with HMAC-SHA256 before storage
2. On load, signature is verified before accepting the data
3. If verification fails, consent is cleared and user is re-prompted
4. Protects against manual localStorage manipulation and XSS attacks

### 4. Rate Limiting

**Risk:** Malicious scripts could perform DoS attacks by rapidly changing consent state.

**Mitigation:**
- Maximum of 5 consent changes per second
- Sliding window rate limiting
- Exceeding limits throws an error
- Prevents storage exhaustion and performance degradation

**Protection:**
```typescript
// Rapid changes are blocked
for (let i = 0; i < 10; i++) {
  await manager.acceptAll(); // First 5 succeed, rest throw errors
}
```

### 5. Input Validation

**Risk:** Invalid or malicious input data could cause unexpected behavior.

**Mitigation:**
- All configuration values are validated at construction time
- Custom categories are limited to 50 items
- Category names must match: `/^[a-zA-Z0-9_-]+$/`
- Duration limited to 1-3650 days
- Version limited to 1-1000
- Timestamp ranges are validated

### 6. Memory Leak Prevention

**Risk:** Excessive event listeners could cause memory leaks.

**Mitigation:**
- Maximum of 100 listeners with warning at limit
- `removeAllListeners()` method for cleanup
- `getListenerCount()` for debugging
- Automatic cleanup on errors

### 7. XSS Protection

**Risk:** Consent data could be read or modified by XSS attacks.

**Mitigation:**
- HMAC signatures detect unauthorized modifications
- Integrity checks on every load
- No use of `eval()` or `innerHTML`
- All user input is validated and sanitized

**Note:** The library cannot prevent XSS attacks but makes tampering detectable.

### 8. Content Security Policy (CSP) Compatibility

**Current Limitation:** The React component uses inline styles which require `style-src 'unsafe-inline'` in your CSP.

**Recommendation:**
- Use strict CSP policies in your application
- We are working on a CSS-module-based alternative for strict CSP environments

**Temporary Workaround:**
```html
<meta http-equiv="Content-Security-Policy"
      content="style-src 'self' 'unsafe-inline'; ...">
```

### 9. Server-Side Rendering (SSR) Safety

**Protection:**
- All browser APIs are checked for availability before use
- No `window` access during render
- Proper hydration support
- useMediaQuery hook prevents hydration mismatches

## Security Best Practices

### 1. Use Cookie Storage with Secure Flag

**Why:** Cookies with the `Secure` flag are only sent over HTTPS, protecting against man-in-the-middle attacks.

```typescript
import { CookieStorageAdapter, ConsentManager } from '@kev1nramos/cookie-consent-core';

const manager = new ConsentManager({
  storage: new CookieStorageAdapter({
    secure: true, // Default
    sameSite: 'Strict', // Recommended for security
    domain: '.yourdomain.com' // Optional
  })
});
```

### 2. Enable Integrity Verification

**Why:** Detects tampering with consent data.

```typescript
const manager = new ConsentManager({
  enableIntegrity: true // Default, but be explicit
});
```

### 3. Use Short Consent Duration

**Why:** Reduces the window of opportunity for stolen consent tokens.

```typescript
const manager = new ConsentManager({
  duration: 90 // 90 days instead of default 365
});
```

### 4. Implement Audit Logging

**Why:** Required for GDPR compliance and security monitoring.

```typescript
const manager = new ConsentManager({
  onConsentChange: (state) => {
    // Send to your audit log
    fetch('/api/audit/consent', {
      method: 'POST',
      body: JSON.stringify({
        timestamp: state.timestamp,
        preferences: {
          analytics: state.analytics,
          marketing: state.marketing
        },
        userAgent: navigator.userAgent,
        // Do NOT send IP address client-side
      })
    });
  }
});
```

### 5. Validate on Both Client and Server

**Why:** Client-side validation can be bypassed.

```typescript
// Server-side (Node.js/Express example)
app.post('/api/consent', (req, res) => {
  const { analytics, marketing } = req.body;

  // Validate
  if (typeof analytics !== 'boolean' || typeof marketing !== 'boolean') {
    return res.status(400).json({ error: 'Invalid consent data' });
  }

  // Store in database with additional metadata
  db.consents.create({
    userId: req.user.id,
    analytics,
    marketing,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date()
  });

  res.json({ success: true });
});
```

### 6. Monitor Listener Count

**Why:** Detects memory leaks early.

```typescript
const manager = new ConsentManager({ debug: true });

// In development
setInterval(() => {
  console.log('Active listeners:', manager.getListenerCount());
}, 10000);
```

### 7. Clean Up on Unmount

**Why:** Prevents memory leaks in SPAs.

```typescript
// React example
useEffect(() => {
  const unsubscribe = manager.onChange((state) => {
    console.log('Consent changed:', state);
  });

  return () => {
    unsubscribe(); // Clean up
  };
}, []);
```

## Known Security Limitations

### 1. HttpOnly Cookie Limitation

**Issue:** Consent cookies set via `document.cookie` cannot have the `HttpOnly` flag, making them accessible to JavaScript.

**Impact:** If an XSS vulnerability exists in your application, the consent cookie could be read or modified.

**Mitigation:**
- Use HMAC integrity verification (enabled by default)
- Implement server-side consent management for high-security applications
- Use CSP headers to prevent XSS
- Regularly audit your application for XSS vulnerabilities

**Server-Side Implementation (Recommended for High Security):**
```typescript
// Server sets the cookie with HttpOnly
app.post('/api/consent', (req, res) => {
  res.cookie('cookie_consent', JSON.stringify(consentData), {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000
  });
});
```

### 2. localStorage Accessibility

**Issue:** Data in localStorage is accessible to all JavaScript on the same origin.

**Impact:** Malicious scripts (e.g., from compromised dependencies) could read or modify consent.

**Mitigation:**
- Use HMAC integrity verification
- Use cookie storage instead of localStorage for sensitive environments
- Implement Subresource Integrity (SRI) for all third-party scripts
- Regularly audit your dependencies

### 3. No Built-In Encryption

**Issue:** Consent data is stored in plain text (though signed).

**Impact:** If an attacker gains access to storage, they can read consent preferences.

**Risk Level:** Low (consent preferences are not considered highly sensitive)

**Mitigation (if needed):**
```typescript
// Custom encryption wrapper (example)
import { encrypt, decrypt } from 'your-crypto-library';

class EncryptedStorageAdapter implements StorageAdapter {
  constructor(private baseAdapter: StorageAdapter, private key: string) {}

  async getItem(key: string): Promise<string | null> {
    const encrypted = await this.baseAdapter.getItem(key);
    return encrypted ? decrypt(encrypted, this.key) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = encrypt(value, this.key);
    return this.baseAdapter.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    return this.baseAdapter.removeItem(key);
  }
}
```

### 4. Third-Party Script Access

**Issue:** Third-party scripts on your page can access the ConsentManager instance.

**Impact:** They could check consent status before user has decided.

**Mitigation:**
- Load third-party scripts only after consent is given
- Use a tag manager that respects consent state
- Implement script blocking until consent

**Example:**
```typescript
const manager = new ConsentManager();

manager.onChange(async (state) => {
  if (state.analytics && !window.gtag) {
    // Load Google Analytics only after consent
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=YOUR_ID';
    document.head.appendChild(script);
  }
});
```

## GDPR Compliance

### Demonstrable Consent

**Requirement:** You must be able to prove that a user gave consent.

**Implementation:**
```typescript
const manager = new ConsentManager({
  onConsentChange: async (state) => {
    // Store consent proof server-side
    await fetch('/api/gdpr/consent-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: state.timestamp,
        expiresAt: state.expiresAt,
        version: state.version,
        preferences: {
          analytics: state.analytics,
          marketing: state.marketing
        },
        // Additional metadata
        userAgent: navigator.userAgent,
        consentMethod: 'banner', // or 'settings-page'
        // IP address should be logged server-side, not sent from client
      })
    });
  }
});
```

### Consent Withdrawal

**Requirement:** Users must be able to withdraw consent easily.

**Implementation:**
```typescript
// Provide a clear way to withdraw
async function withdrawConsent() {
  await manager.withdrawConsent();
  // Optionally redirect or reload to stop all tracking
  window.location.reload();
}
```

### Data Minimization

**Principle:** Only collect and store necessary data.

**This library:**
- ✅ Stores only boolean consent flags
- ✅ Minimal metadata (timestamps, version)
- ✅ No personal data stored by default
- ✅ Integrity signatures use device-specific keys (not user identifiers)

## Reporting a Vulnerability

If you discover a security vulnerability in this library, please report it responsibly:

### Do NOT:
- ❌ Open a public GitHub issue
- ❌ Discuss it in public forums
- ❌ Exploit it

### DO:
1. ✅ Email security details to: kevinalmeidaramos@gmail.com
2. ✅ Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. ✅ Allow 90 days for a fix before public disclosure

### Response Timeline:
- **24 hours:** Initial response acknowledging receipt
- **7 days:** Assessment and severity classification
- **30 days:** Fix or mitigation plan
- **90 days:** Public disclosure (if appropriate)

### Bug Bounty:
We do not currently offer a bug bounty program, but we will credit researchers who responsibly disclose vulnerabilities.

## Security Checklist for Developers

- [ ] Enable integrity verification (`enableIntegrity: true`)
- [ ] Use cookie storage with `secure` flag for production
- [ ] Implement audit logging for consent changes
- [ ] Set appropriate consent duration (recommended: 90-180 days)
- [ ] Clean up listeners on component unmount
- [ ] Monitor listener count in development
- [ ] Implement CSP headers
- [ ] Regularly update dependencies
- [ ] Audit third-party scripts
- [ ] Test in SSR environments
- [ ] Verify hydration behavior
- [ ] Load tracking scripts only after consent
- [ ] Implement server-side consent verification
- [ ] Set up security monitoring and alerting

## Changelog

### Version 1.0.0 (Current)
- ✅ Zod validation for prototype pollution protection
- ✅ Cookie injection prevention
- ✅ HMAC integrity verification
- ✅ Rate limiting
- ✅ Input validation
- ✅ Memory leak prevention
- ✅ SSR safety
- ⚠️ CSP requires `unsafe-inline` for styles

### Planned Security Enhancements
- [ ] CSS-module-based styling for strict CSP
- [ ] Optional encryption layer
- [ ] Built-in audit logging
- [ ] Advanced rate limiting with exponential backoff
- [ ] Consent versioning and migration tools
- [ ] Security headers recommendations
- [ ] Automated security testing in CI/CD

## License

This security policy is part of the @kev1nramos/cookie-consent project and is licensed under the same terms.

---

**Last Updated:** November 5, 2025
**Next Review:** February 5, 2026
