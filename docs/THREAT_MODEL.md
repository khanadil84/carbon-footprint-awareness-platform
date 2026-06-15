# Threat Model — EcoTrack

## Document Control

| Field | Value |
|-------|-------|
| Status | Approved |
| Last Review | 2026-06-15 |
| Owner | Security Team |
| Review Cadence | Quarterly |

## Assets

| ID | Asset | Classification | Storage Location | Custodian |
|----|-------|---------------|-----------------|-----------|
| A01 | Activity records (type, value, date, CO2) | Internal | `localStorage` (`eco_activities_v1`) | Client |
| A02 | User settings (units, theme, view prefs) | Internal | `localStorage` (`eco_settings_v1`) | Client |
| A03 | Monthly carbon goal | Internal | `localStorage` (`eco_goal_v1`) | Client |
| A04 | Achievement unlock state | Internal | `localStorage` (`eco_achievements_v1`) | Client |
| A05 | Auth session token | Critical | `localStorage` (`eco_token`) | Client |
| A06 | User profile data (name, email) | Sensitive | `localStorage` (`eco_user`) | Client |
| A07 | Email/password credentials | Critical | Transient (in-memory) | Client |
| A08 | Application source code | Public | Filesystem / CDN | Engineering |
| A09 | CI/CD pipeline configuration | Internal | GitHub Secrets | Engineering |
| A10 | Dependency manifest | Public | `package.json` / lockfile | Engineering |

## Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser Security Context                     │
│                                                                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ React SPA     │───▶│ Domain Layer │───▶│ Storage Wrappers  │   │
│  │ Components    │    │ (validation) │    │ (storage.js)     │   │
│  └──────┬───────┘    └──────┬───────┘    └────────┬─────────┘   │
│         │                   │                      │             │
│         ▼                   ▼                      ▼             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │ AuthContext   │    │ Cache Layer  │    │   localStorage   │   │
│  │ (session mgmt)│    │ (memoization)│    │   (unencrypted)  │   │
│  └──────┬───────┘    └──────────────┘    └──────────────────┘   │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Content Security Policy (meta tag)                      │    │
│  │  Referrer Policy (no-referrer)                           │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │
         │ (future)
         ▼
┌─────────────────────────────────────┐
│          Backend API                 │
│  (not yet implemented)              │
└─────────────────────────────────────┘

Boundary TB-01: Client ↔ localStorage     — Same-origin, no encryption
Boundary TB-02: Client ↔ DOM              — XSS surface, JSX auto-escaped
Boundary TB-03: Client ↔ Network (future) — HTTPS required, CSP enforced
Boundary TB-04: Components ↔ Services     — Input validation gate
```

## Attack Surface

| Surface | Entry Point | Authentication | Authorization |
|---------|------------|----------------|---------------|
| Activity form | `ActivityForm.jsx` | Session check | Self (own data) |
| Settings panel | `SettingsPanel.jsx` | Session check | Self (own data) |
| Goal configuration | `MonthlyGoal.jsx` | Session check | Self (own data) |
| Auth endpoints | `/login`, `/signup`, `/forgot-password` | None | None |
| LocalStorage API | Browser devtools | None (same-origin) | Same-origin policy |
| CSV export | `ExportControls.jsx` | Session check | Self (own data) |
| Route definitions | `App.jsx` | ProtectedRoute guard | Authenticated vs public |

## Abuse Cases

### AC-01: Storage Tampering via DevTools
- **Description**: Attacker uses browser devtools to modify localStorage values directly
- **Impact**: Corrupted activity records, settings, or achievements
- **Likelihood**: High
- **Mitigations**: Schema validation (`activity.isValidList`), self-healing repair (`selfHealActivities`), invariant checks on load, JSON corruption recovery (`recoverJSON`)
- **Residual Risk**: Medium — repaired data may lose semantic accuracy

### AC-02: XSS via Malicious Input
- **Description**: Attacker injects script via activity type/value fields
- **Impact**: Script execution in user's browser context
- **Likelihood**: Low
- **Mitigations**: `sanitizeString()` strips control characters, JSX auto-escapes, zero `dangerouslySetInnerHTML` usage, CSP meta tag
- **Residual Risk**: Low — `'unsafe-inline'` in CSP weakens protection

### AC-03: CSV Injection
- **Description**: Activity data containing formula prefixes (=, +, -, @) exported to CSV
- **Impact**: Formula execution when CSV imported into spreadsheet software
- **Likelihood**: Medium
- **Mitigations**: `escapeCell()` prefixes dangerous leading characters in `exportService.js`
- **Residual Risk**: Low

### AC-04: Session Hijacking via localStorage Access
- **Description**: Malicious extension or XSS reads auth token from localStorage
- **Impact**: Full account access
- **Likelihood**: Medium
- **Mitigations**: Session timeout (30 min inactivity), configurable storage keys, token validation on each route
- **Residual Risk**: Medium — no encryption at rest

### AC-05: Storage Quota Exhaustion
- **Description**: Repeated activity submissions fill localStorage quota (~5-10 MB)
- **Impact**: Write failures, data loss on subsequent writes
- **Likelihood**: Low
- **Mitigations**: try/catch in all storage wrappers, graceful fallback to empty state
- **Residual Risk**: Low

### AC-06: Cross-Tab Data Race
- **Description**: Multiple browser tabs writing simultaneously to localStorage
- **Impact**: Lost updates, inconsistent state
- **Likelihood**: Medium
- **Mitigations**: Cross-tab `storage` event listener invalidates cache, generation-based cache invalidation
- **Residual Risk**: Low

### AC-07: Fuzzed/Corrupted Storage Payload
- **Description**: Attacker corrupts stored JSON via devtools or malicious extension
- **Impact**: Application crash or undefined behavior on load
- **Likelihood**: Medium
- **Mitigations**: `safeParseJSON` with `recoverJSON` fallback, `selfHealActivities` repairs individual records, invariant engine validates on load
- **Residual Risk**: Low

### AC-08: Weak Password Attack
- **Description**: Brute force or dictionary attack on login form
- **Impact**: Unauthorized access
- **Likelihood**: Low (mock auth, no server)
- **Mitigations**: Client-side password strength meter (4 rules), minimum 8 chars
- **Residual Risk**: Medium — no server-side rate limiting

## Mitigations Summary

| ID | Mitigation | Location | Covers Abuse Cases |
|----|-----------|----------|-------------------|
| M01 | Input sanitization | `src/domain/validation.js` | AC-02 |
| M02 | Schema validation | `activity.isValidRecord`, `settings.isValid` | AC-01, AC-07 |
| M03 | Self-healing repair | `src/utils/selfHealing.js` | AC-01, AC-07 |
| M04 | Invariant engine | `src/utils/invariantEngine.js` | AC-01, AC-07 |
| M05 | JSON corruption recovery | `src/utils/storage.js` `recoverJSON` | AC-07 |
| M06 | CSV injection prevention | `src/utils/exportService.js` `escapeCell` | AC-03 |
| M07 | Session timeout | `src/context/AuthContext.jsx` | AC-04 |
| M08 | CSP meta tag | `index.html` | AC-02 |
| M09 | Protected routing | `App.jsx` `ProtectedRoute` | AC-04 |
| M10 | Safety wrappers | `src/utils/storage.js` try/catch | AC-05, AC-06 |
| M11 | Cache generation invalidation | `src/utils/activityCache.js` | AC-06 |
| M12 | Telemetry event monitoring | `src/utils/telemetry.js` | All (detection) |
| M13 | Security event system | `src/security/SecurityEvents.js` | All (detection, unwired) |

## Residual Risks

| Risk | Severity | Notes |
|------|----------|-------|
| No encryption at rest | Medium | localStorage is unencrypted; sensitive token at risk if XSS present |
| `'unsafe-inline'` in CSP | Medium | Required due to no build-time nonce injection |
| No server-side auth enforcement | Medium | Mock auth only; real backend would enforce password policies |
| Unwired security event system | Low | `SecurityEvents.js` available but not integrated into production paths |
| No rate limiting | Low | No server — client-side only; mock auth provides no brute force protection |
| No audit trail for data changes | Medium | Telemetry tracks counts but not individual operations |
| Dependency vulnerabilities | Low | 13 dependencies total; audited in CI (`npm audit --audit-level=high`) |

## Assumptions

1. **Same-origin policy** prevents cross-origin access to localStorage
2. **Browser security model** prevents extensions from accessing localStorage without permissions
3. **No backend server** — all data is client-side; threat model assumes future backend integration
4. **Developer console access** is considered attacker-controlled (defense-in-depth)
5. **React 19 strict mode** provides additional development-time warnings but not runtime protection
6. **All dependencies are trusted** and regularly audited via Dependabot and CI
7. **CSP meta tag** is present and honored by all modern browsers
8. **LocalStorage quota** is sufficient for expected usage patterns (< 1000 activities)
9. **CodeQL analysis** runs weekly and on PRs to detect new vulnerabilities

## Recovery Strategy

### Detection
- `InvariantEngine.verifySystemInvariants()` validates data integrity on every load
- `SystemHealthService.overall()` runs 8 subsystem health checks on demand
- `Telemetry` counters track corruption, repair, and failure events
- `RecoveryLog` records every recovery attempt with subsystem, failure, and success status

### Response
- **Corrupted records**: `selfHealActivities()` repairs individual fields (id, date, co2, type, value)
- **Aggregation inconsistency**: Automatic recompute via `recallAgg()` / `loadAgg()`
- **Cache invalidation**: Generation-based selectors force recompute on mismatch
- **Storage write failure**: Returns null, invalidates cache, notifies subscribers
- **JSON parse failure**: `recoverJSON()` heuristic attempts truncated data recovery

### Recovery Verification
- `InvariantEngine.verify()` confirms repaired data passes all invariant checks
- `InvariantEngine.verifySystemInvariants()` validates complete system state post-recovery
- `RecoveryLog.record()` stores timestamp, subsystem, failure, repair action, and verification result
- Health score reflects recovery success rate via `SystemHealthService.recoveryCount()`

### Continuous Improvement
- `getRecoverySummary()` exposes success rate by subsystem and severity
- Rolling history (500 entries) maintained in `RecoveryLog`
- Dashboard captures build, test, coverage, security, accessibility, and performance status
- Benchmark regression detection alerts on performance degradation

---

*Document maintained by Security Team. Review quarterly or after any significant architecture change.*
