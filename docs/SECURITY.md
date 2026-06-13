# Security Policy — EcoTrack

## Threat Model

### Asset Inventory

| Asset | Classification | Storage | Risk |
|-------|---------------|---------|------|
| Activity records | Internal | localStorage (`eco_activities_v1`) | Low |
| User settings | Internal | localStorage (`eco_settings_v1`) | Low |
| Monthly goal | Internal | localStorage (`eco_goal_v1`) | Low |
| Achievements | Internal | localStorage (`eco_achievements_v1`) | Low |
| Auth token | Critical | localStorage (`eco_token`) | High |
| User profile | Sensitive | localStorage (`eco_user`) | Medium |
| Email/password | Critical | Transient (in-memory during auth) | High |

### STRIDE Analysis

#### Client-Side Storage (`localStorage`)

| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Spoofing: malicious extension writes fake data | Schema validation via `safeGetJSON` validate callbacks | Low |
| Tampering: attacker modifies stored data via devtools | Defensive parsing, `recoverJSON` on corrupted data | Medium (no encryption) |
| Repudiation: no audit trail of data changes | SecurityEvents infrastructure available (not yet wired) | Medium |
| Information disclosure: XSS reads localStorage | CSP, no `innerHTML`, JSX auto-escaping | Low |
| DoS: fill localStorage to trigger quota error | try/catch in all storage wrappers | Low |
| Elevation of privilege: forged token in storage | Token validation on each request | Medium (mock backend) |

#### DOM / Rendering

| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| XSS via user input | `sanitizeString()` strips control chars; JSX auto-escapes; zero `dangerouslySetInnerHTML` | Low |
| XSS via CSV export | `escapeCell()` prefixes dangerous leading chars; formula injection blocked | Low |
| DOM clobbering | React virtual DOM, no global name conflicts | Low |

#### Authentication

| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Session fixation | Token stored under configurable key (`eco_token`); session timeout after inactivity | Low |
| Weak password | Client-side strength meter; min 8 chars; complexity requirements | Medium (no server enforcement) |
| CSRF on mock backend | No backend — localStorage-only | N/A |

#### Network (future backend)

| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Man-in-the-middle | CSP `upgrade-insecure-requests`; HTTPS-only `connect-src` | Low (meta tag only) |
| Data exfiltration via CDN | Font CDN whitelisted; no third-party scripts in strict policy | Low |

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────┐
│                   Browser Tab                            │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ React     │───▶│ Validation   │───▶│ Storage       │  │
│  │ Components│    │ Domain Layer │    │ Wrapper       │  │
│  └──────────┘    └──────────────┘    └───────┬───────┘  │
│       │                                       │          │
│       ▼                                       ▼          │
│  ┌──────────┐                          ┌──────────┐     │
│  │ Auth     │                          │localStorage│    │
│  │ Context  │                          │ (unencrypt)│    │
│  └──────────┘                          └──────────┘     │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────┐                                            │
│  │ CSP      │                                            │
│  │ Meta Tag │                                            │
│  └──────────┘                                            │
└─────────────────────────────────────────────────────────┘
         │
         ▼ (future)
┌──────────────────┐
│   Backend API    │
│  (not implemented)│
└──────────────────┘

Boundary 1: Client ↔ localStorage     — No encryption, same-origin
Boundary 2: Client ↔ DOM              — XSS surface, JSX-escaped
Boundary 3: Client ↔ Network (future) — HTTPS required, CSP enforced
```

## Content Security Policy

### Current (meta tag in `index.html`)

```http
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self';
           script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
           style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
           font-src 'self' https://fonts.gstatic.com;
           img-src 'self' data:;
           connect-src 'self' https:;">
```

`'unsafe-inline'` is required because no build-time nonce injection is configured. This weakens XSS protection.

### Recommended Strict Policy (for production deployment)

```http
Content-Security-Policy: default-src 'self';
                          script-src 'self';
                          style-src 'self';
                          font-src 'self' https://fonts.gstatic.com;
                          img-src 'self' data:;
                          connect-src 'self' https:;
                          base-uri 'self';
                          form-action 'self';
                          frame-ancestors 'none';
                          upgrade-insecure-requests
```

### Migration to Strict CSP

1. Replace meta-tag CSP with HTTP response header (server-level).
2. Remove `'unsafe-inline'` by adopting nonce-based or hash-based inline script/style allowlisting.
3. Use Vite plugin (`vite-plugin-csp`) or server middleware to inject nonces at build/serve time.
4. Test with `Content-Security-Policy-Report-Only` before enforcing.

## Security Controls Inventory

| Control | Location | Status |
|---------|----------|--------|
| Input sanitization | `src/domain/validation.js` | Active |
| Input validation | `src/domain/validation.js` | Active |
| Safe storage wrappers | `src/utils/storage.js` | Active |
| Schema validation (optional) | `safeGetJSON/safeSetJSON` validate callbacks | Active (partial adoption) |
| JSON corruption recovery | `recoverJSON` in `storage.js` | Active |
| CSV injection prevention | `exportService.js` `escapeCell` | Active |
| Session timeout (30 min) | `AuthContext.jsx` | Active |
| Password strength meter | `checkPasswordStrength` in `validation.js` | Active |
| CSP (meta tag) | `index.html` | Active (lenient) |
| Referrer Policy | `index.html` | Active |
| Protected routing | `App.jsx` `ProtectedRoute` | Active |
| Security event system | `src/security/SecurityEvents.js` | Available (unwired) |
| Schema integrity checks | `src/security/SecurityPolicy.js` | Available (unwired) |
| Storage corruption detection | `src/security/SecurityPolicy.js` | Available (unwired) |
| HTTP security headers | `src/security/SecurityPolicy.js` | Documented (not deployed) |

## Data Flow

```
User Input → ActivityForm / SettingsPanel / SignUpPage
    ↓ sanitizeString / sanitizeNumber
    ↓ validateEmail / validatePassword / activity.isValid
Domain Layer (validation.js)
    ↓
Service Layer → safeGetJSON / safeSetJSON (storage.js)
    ↓ try/catch → recoverJSON on corruption
localStorage (unencrypted, same-origin)
```
