# Security Audit Report — EcoTrack

**Date:** 2026-06-13
**Scope:** Client-side application (React SPA, localStorage-only)
**Methodology:** Manual code review + static analysis

---

## Executive Summary

EcoTrack is a single-page React application that stores all user data in browser localStorage. No backend API exists. The application has been reviewed for common client-side security vulnerabilities. Overall risk is **low** due to the limited attack surface (no backend, no user-to-user interaction). However, several hardening opportunities exist.

**Risk Rating:** Low
**Finding Count:** 8 (2 Low, 4 Info, 2 Enhancement)

---

## Findings

### F-01: localStorage Data is Unencrypted (Info)

**Severity:** Info
**Component:** `src/utils/storage.js`
**Description:** All user data (activities, settings, goals, achievements, auth token, user profile) is stored as plaintext JSON in browser localStorage. Any browser extension or same-origin script can read it.
**Risk:** Low — localStorage is same-origin isolated; cross-site scripting is the only practical exfiltration vector.
**Recommendation:** For sensitive fields like auth tokens, consider `SessionStorage` (cleared on tab close) or encrypted storage.

---

### F-02: CSP Uses `'unsafe-inline'` (Low)

**Severity:** Low
**Component:** `index.html` (meta tag)
**Description:** `script-src` and `style-src` include `'unsafe-inline'`, which weakens XSS protection. A nonce or hash-based approach would be more secure.
**Risk:** Low — React's JSX auto-escaping and zero `dangerouslySetInnerHTML` usage mitigate XSS risk.
**Recommendation:** Move CSP to HTTP response headers; adopt `vite-plugin-csp` for nonce injection; test with report-only mode first.

---

### F-03: No Audit Trail / Security Event Logging (Info)

**Severity:** Info
**Component:** Application-wide
**Description:** No structured logging of security-relevant events (login, logout, data corruption, validation failures). Ad-hoc `console.error`/`console.warn` calls exist but are inconsistent.
**Risk:** Low — no backend means no centralized audit; local console logs are invisible to attackers.
**Recommendation:** Adopt `src/security/SecurityEvents.js` for structured events; wire into storage wrappers and auth flows.

---

### F-04: Schema Validation Not Universal (Low)

**Severity:** Low
**Component:** `src/utils/storage.js` / Service layer
**Description:** `safeGetJSON` and `safeSetJSON` support optional `validate` callbacks, but not all callers use them:
- `goalService.js` loads goal data without schema validation in `safeGetJSON`
- `AuthContext.jsx` loads user/token without schema validation
**Risk:** Low — `safeGetJSON` already handles non-JSON and null gracefully via `safeParseJSON`.
**Recommendation:** Add `validate` callbacks to all `safeGetJSON`/`safeSetJSON` calls. Use `src/security/SecurityPolicy.checkSchemaIntegrity` for centralized schema definitions.

---

### F-05: Password Check is Client-Side Only (Info)

**Severity:** Info
**Component:** `src/domain/validation.js` / `SignUpPage.jsx`
**Description:** Password strength is evaluated entirely on the client. There is no server-side validation or hashing (no backend exists).
**Risk:** Info — acceptable for a client-only app; users should be aware that passwords are not encrypted in transit (no backend).
**Recommendation:** If a backend is added, enforce the same policies server-side and use bcrypt/Argon2 for hashing.

---

### F-06: Auth Token is a Mock String (Info)

**Severity:** Info
**Component:** `AuthContext.jsx`
**Description:** The authentication token is a static/fake string. There is no real JWT issuance, validation, or refresh mechanism.
**Risk:** Info — expected for a client-side demo app with no backend.
**Recommendation:** When integrating with a real auth provider, validate tokens server-side, implement refresh token rotation, and store tokens in `SessionStorage` or HTTP-only cookies.

---

### F-07: No Rate Limiting or Brute-Force Protection (Info)

**Severity:** Info
**Component:** `LoginPage.jsx`, `SignUpPage.jsx`
**Description:** There is no rate limiting on login or registration attempts. Since there is no backend, this is not exploitable currently.
**Risk:** Info — not exploitable without a backend.
**Recommendation:** If a backend is added, implement rate limiting (e.g., exponential backoff, CAPTCHA after N failures).

---

### F-08: Storage Corruption Detection Available but Unwired (Enhancement)

**Severity:** Enhancement
**Component:** `src/security/SecurityPolicy.js`, `src/utils/storage.js`
**Description:** `detectStorageCorruption()` and `recoverJSON()` exist but are not connected. `detectStorageCorruption` is not called before `recoverJSON` attempts recovery.
**Recommendation:** Wire `detectStorageCorruption` into `safeParseJSON` to log corruption events before attempting recovery.

---

## Risk Matrix

| ID | Finding | Severity | Likelihood | Impact | Risk |
|----|---------|----------|-----------|--------|------|
| F-01 | localStorage unencrypted | Info | Low | Medium | Low |
| F-02 | CSP unsafe-inline | Low | Low | Medium | Low |
| F-03 | No audit trail | Info | Low | Low | Info |
| F-04 | Schema validation gaps | Low | Low | Low | Low |
| F-05 | Client-only password check | Info | N/A | N/A | Info |
| F-06 | Mock auth token | Info | N/A | N/A | Info |
| F-07 | No rate limiting | Info | N/A | N/A | Info |
| F-08 | Corruption detection unwired | Enhancement | N/A | N/A | Enhancement |

---

## Recommendations (Priority Order)

1. **Adopt strict CSP** — Remove `'unsafe-inline'` via nonce-based CSP using `vite-plugin-csp` or server-middleware nonce injection. Test with `Report-Only` first.
2. **Wire security events** — Integrate `SecurityEvents.js` into `storage.js` and auth flows for structured logging.
3. **Universal schema validation** — Add `validate` callbacks to all `safeGetJSON`/`safeSetJSON` calls; define centralized schemas in `SecurityPolicy.js`.
4. **Connect corruption detection** — Call `detectStorageCorruption` before `recoverJSON` to enable event logging on corruption.
5. **Add security headers** — Deploy HSTS, X-Content-Type-Options, X-Frame-Options as HTTP response headers on the deployment server.
6. **Future: Backend security** — If a backend is added, implement server-side validation, rate limiting, real JWT with refresh rotation, and bcrypt/Argon2 password hashing.

---

## Appendix: Security-Relevant Files

| File | Purpose |
|------|---------|
| `src/config/securityConfig.js` | Security constants, storage keys, limits |
| `src/domain/validation.js` | Input sanitization, validation, password strength |
| `src/utils/storage.js` | Safe localStorage wrappers with recovery |
| `src/utils/exportService.js` | CSV injection prevention |
| `src/context/AuthContext.jsx` | Session timeout, activity tracking |
| `src/security/SecurityConstants.js` | Event types, schema versions, trust boundaries |
| `src/security/SecurityEvents.js` | Publish/subscribe security event system |
| `src/security/SecurityPolicy.js` | CSP policy, schema integrity, corruption detection |
| `docs/SECURITY.md` | Threat model, trust boundaries, CSP guide |
| `docs/security-report.md` | This audit report |
