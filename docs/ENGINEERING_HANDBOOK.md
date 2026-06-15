# Engineering Handbook — EcoTrack

## Architecture

EcoTrack is a **layered single-page application** built with React 19 and Vite 8. The architecture follows strict separation of concerns with no framework-level state management — only React Context for auth and module-level singletons for cache/telemetry.

### Layer Map

```
┌──────────────────────────────────────────────────────┐
│                  Presentation Layer                    │
│  Pages (LandingPage, DashboardPage, ProfilePage)      │
│  Layout (Navbar, Footer, AuthLayout, SettingsPanel)  │
│  Dashboard Widgets (Forms, Charts, History, Badges)  │
│  UI Primitives (Button, Input, Chart)                │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                   Service Layer                        │
│  ActivityService     CacheService     GoalService     │
│  AnalyticsService    Recommendation   Achievement     │
│  ExportService       HistoryService   Settings        │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                  Domain Layer                          │
│  validation.js     emissionCalculator.js              │
│  dateUtils.js      mathUtils.js      goalProgress.js │
│  achievementDefinitions.js                            │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│               Observability Layer                      │
│  Telemetry      Perf Counters      SystemHealth       │
│  Metrics        Diagnostics        RecoveryLog        │
│  InvariantEngine PerformanceMonitor MetricsCollector  │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│               Resilience Layer                         │
│  Error Hierarchy   Retry w/ Backoff   WithFallback    │
│  Self-Healing      Dedup              Recovery        │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                Storage Layer                           │
│  Safe Wrappers     JSON Recovery     Deep Clone       │
│  Schema Validation  Corruption Detection              │
└──────────────────────┬───────────────────────────────┘
                       │
                   localStorage
```

### Data Flow

```
User Input → Form Component → Service (validate + sanitize)
  → Storage (safeSetJSON → localStorage)
  → Cache (incremental update or full recompute)
  → Selectors (generation-based memoization)
  → React Components (subscription or state)
```

### Key Design Decisions

- **No external state management**: React Context for auth, module singletons for cache/telemetry
- **No testing framework**: Node.js built-in `node:test` / `node:assert`
- **13 total dependencies**: 4 production, 9 development
- **SPA with lazy loading**: Dashboard widgets loaded via dynamic imports
- **Cross-tab sync**: `window.addEventListener('storage')` invalidates cache on external changes

## Resilience

### Error Hierarchy

```
AppError (base)
├── StorageError      — retryable, storage I/O failures
├── ValidationError   — non-retryable, invalid input
├── ConsistencyError  — retryable, data integrity violations
└── NotFoundError     — non-retryable, missing resources
```

### Recovery Patterns

| Pattern | Function | Use Case |
|---------|----------|----------|
| Retry with backoff | `retry(fn, {maxAttempts, baseDelay})` | Storage failures, consistency errors |
| Fallback | `withFallback(fn, fallbackValue)` | Optional computations |
| Recovery | `withRecovery(fn, recoveryFn)` | Known error → graceful recovery |
| Self-healing | `selfHealActivities()` | Corrupted record repair |
| Deduplication | `deduplicateEntries()` | Duplicate prevention (2s window + content hash) |

### Invariant Engine

7 runtime invariants checked on every load and mutation:

| Invariant | Scope | Auto-Fix |
|-----------|-------|----------|
| `idUniqueness` | All activities | No (telemetry only) |
| `emissionsNonNegative` | All activities | No (telemetry only) |
| `validDates` | All activities | Yes (self-healing) |
| `validTypes` | All activities | Yes (self-healing) |
| `scoreRange` (0-100) | Carbon score | No (telemetry only) |
| `aggregationConsistency` | Cache vs storage | Yes (auto-recompute) |
| `goalConsistency` | Goal object | No (telemetry only) |

## Security

### Controls

| Control | Location | Status |
|---------|----------|--------|
| Input sanitization | `src/domain/validation.js` | Active |
| Schema validation | `storage.js` safeGetJSON/safeSetJSON callbacks | Active |
| JSON corruption recovery | `storage.js` recoverJSON | Active |
| CSV injection prevention | `exportService.js` escapeCell | Active |
| Session timeout (30 min) | `AuthContext.jsx` | Active |
| Password strength meter | `validation.js` checkPasswordStrength | Active |
| CSP meta tag | `index.html` | Active (lenient) |
| Protected routing | `App.jsx` ProtectedRoute | Active |
| Security event system | `src/security/SecurityEvents.js` | Available (unwired) |
| Schema integrity | `src/security/SecurityPolicy.js` | Available (unwired) |

### Threat Model

See [THREAT_MODEL.md](./THREAT_MODEL.md) for complete asset inventory, STRIDE analysis, abuse cases, mitigations, and residual risks.

## Accessibility

### WCAG 2.2 AA Compliance

| Principle | Coverage | Tests |
|-----------|----------|-------|
| Perceivable | Color contrast, non-text content, captions | 3 |
| Operable | Keyboard navigation, focus management, skip link | 5 |
| Understandable | Labels, error identification, consistent nav | 8+ |
| Robust | Semantic HTML, ARIA landmarks, roles | 10+ |

### Key Implementations

- Skip-to-content link (`#main-content`)
- ARIA landmarks (`<main>`, `<nav>`, `<footer>`, `<section>`)
- Focus-visible indicators (not just `:focus`)
- Reduced motion media query with disabled animations
- Screen-reader-only data summaries for charts
- Form inputs with `aria-invalid`, `aria-describedby`, `htmlFor`
- Live regions (`role="status"`, `role="alert"`, `aria-live`)
- Proper heading hierarchy (no skipped levels)

### Testing

- 49 accessibility tests covering semantic HTML, ARIA, forms, focus, contrast, motion, charts, images, and landmarks
- Run via `npm run test:accessibility` or as part of `npm run ci`

## Performance

### Cache Architecture

```
┌─────────────────────────────────────┐
│   ActivityCache (module singleton)    │
│                                      │
│  cachedActivities  ← Array           │
│  cachedAggregation ← Object          │
│  cacheGeneration  ← Integer          │
│  stale            ← Boolean          │
│                                      │
│  Selector Cache (generation-keyed)   │
│  ┌─────────────────────────────────┐ │
│  │ recommendations                 │ │
│  │ scoreAndMeta                    │ │
│  │ goalProgress_X                  │ │
│  │ achievements_X                  │ │
│  │ summaryStats                    │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Performance Characteristics

| Operation | Complexity | Caching |
|-----------|-----------|---------|
| Full aggregation | O(n) | Full recompute |
| Incremental add | O(1) | Delta update |
| Incremental remove | O(1) | Delta update |
| Selector memoization | O(1) | Generation-keyed |
| Activity load from storage | O(n) | Cached until invalidated |
| Health checks | O(n) | On-demand |

### Benchmarks

| Suite | Size | Function | Target (ms) |
|-------|------|----------|-------------|
| Analytics | 10 | full | < 1 |
| Analytics | 100 | full | < 5 |
| Analytics | 1000 | full | < 30 |
| Analytics | 5000 | full | < 150 |
| Aggregation | 10 | full/incremental | < 1 |
| Aggregation | 100 | full/incremental | < 5 |
| Aggregation | 1000 | full/incremental | < 30 |
| Aggregation | 5000 | full/incremental | < 150 |
| Recommendation | 10 | generate | < 5 |
| Recommendation | 100 | generate | < 15 |
| Recommendation | 1000 | generate | < 30 |

## Testing

### Test Strategy

| Category | Files | Tests | Scope |
|----------|-------|-------|-------|
| Unit | 10 files | ~280 | Individual service/domain functions |
| Integration | 4 files | ~50 | Cross-service workflows |
| Regression | 1 file | 28 | Historical bug prevention |
| Fuzz | 1 file | 24 | Random/edge-case inputs |
| Mutation | 1 file | 12 | Code mutation resistance |
| Property | 1 file | 11 | Invariant properties |
| Security | 1 file | 18 | Injection, XSS, storage attacks |
| Accessibility | 1 file | 49 | WCAG compliance checks |
| Performance | 1 file | 18 | Operation timing (10/100/1000 items) |
| Chaos | 1 file | 9 | Random corruption, concurrent ops |
| Consistency | 1 file | 6 | End-to-end data integrity |

Total: 24 test files, 499+ individual tests

### Running Tests

```bash
npm run test:all              # All tests (CI mode)
npm run test:<category>       # Specific category
npm run coverage              # Coverage check (threshold: 60%)
npm run bench                 # Run benchmarks
```

### Test Infrastructure

- **Framework**: Node.js built-in `node:test` (no Jest/Mocha/Vitest)
- **Assertions**: `node:assert/strict`
- **Coverage**: `--experimental-test-coverage` flag
- **Fixtures**: `tests/lib/fixtures.js` (activity/goal factories)
- **Fault Injection**: `tests/lib/faultInjection.js` (11 injectors)
- **Storage Mock**: `tests/lib/storageMock.js` (in-memory localStorage)

## CI/CD

### Pipeline (12 phases)

```
Phase  1: Lint (ESLint — fail on errors)
Phase  2: Build (Vite production build)
Phase  3: Unit Tests (10 suites)
Phase  4: Functional Tests (7 suites)
Phase  5: Chaos Tests (9 tests, 10 rounds)
Phase  6: Consistency Tests (6 tests)
Phase  7: Performance Tests (18 tests)
Phase  8: Dependency Audit (npm audit — high/critical)
Phase  9: Coverage Gate (>60% per file)
Phase 10: Security Scan (static analysis)
Phase 11: Benchmark Gate (threshold comparison)
Phase 12: Engineering Dashboard (consolidated report)
```

### Quality Gates

| Gate | Threshold | Action on Failure |
|------|-----------|-------------------|
| ESLint | 0 errors | Pipeline stops |
| Build | Successful | Pipeline stops |
| Tests | 0 failures | Pipeline stops |
| Coverage | >60% line | Pipeline stops |
| Security | 0 violations | Pipeline stops |
| Benchmarks | Within thresholds | Warning (non-blocking) |
| Audit | No high/critical | Pipeline stops |
| Bundle budget | Within limits | Pipeline stops |

### Git Workflow

- Feature branches → PR → CI check → Merge to main
- PRs trigger: lint, build, tests, CodeQL analysis
- Tags trigger: full CI + release check
- Dependabot: weekly updates with grouping

## Recovery

### Recovery Log

Centralized recovery tracking via `src/utils/recoveryLog.js`:

```javascript
RecoveryLog.record({
  subsystem: 'storage',
  failure: 'corrupted_json',
  repairAction: 'recovery_parse',
  recoverySuccess: true,
  invariantVerification: true,
  severity: RecoveryLog.SEVERITY.WARNING
});
```

### Recovery History API

```javascript
RecoveryLog.getRecoveryHistory({ subsystem: 'storage', limit: 10 })
RecoveryLog.getRecoverySummary()
// Returns: { total, successful, failed, successRate, bySubsystem, bySeverity, lastRecovery }
```

### Recovery Flow

```
Failure Detected
  ↓
[Retryable?] → Yes → Retry with exponential backoff (3 attempts)
  ↓ No                               ↓ Success → OK
[Fallback Available?] → Yes → Return fallback value
  ↓ No
[Recovery Handler?] → Yes → Execute recovery function
  ↓ No                            ↓ Record in RecoveryLog
[Propagate Error] ← No           → InvariantEngine.verify()
  ↓                                    ↓ Pass → OK
Record in RecoveryLog                  ↓ Fail → Escalate
```

## Observability

### Telemetry System

16 event counters in `src/utils/telemetry.js`:

```javascript
Telemetry.emit('storage_corruption_detected')
Telemetry.count('recovery_complete')
Telemetry.summary()
// Returns: { totalEvents, events: {...}, byCategory: { storage, cache, retry, recovery, invariant, selfHeal } }
```

### Performance Counters

```javascript
Perf.hit('getActivities')      // Cache hit
Perf.miss('getAggregation')    // Cache miss
Perf.fullRecompute()           // Full aggregation rebuild
Perf.incremental()             // Incremental update
Perf.start('computeAgg')       // Timer start
Perf.end('computeAgg')         // Timer end (records duration)
Perf.report()                  // All counters snapshot
```

### System Health

8 subsystem health checks in `src/utils/systemHealth.js`:

| Check | Type | What It Validates |
|-------|------|-------------------|
| Storage | Read/write | localStorage accessibility |
| Aggregation | Computation | Aggregation consistency invariant |
| Cache | State | Cache/activity alignment |
| Recommendations | Execution | Non-array result detection |
| Achievements | Execution | Achievement evaluation integrity |
| Goal | State | Goal consistency invariant |
| Settings | State | Settings object validity |
| Validation | Invariant | System-wide invariant pass |

### Metrics Consolidation

```javascript
Metrics.diagnostics()
// Returns consolidated view of health, performance, telemetry, invariants, recovery
Metrics.highlight(state)
// Returns human-readable operational metrics
```

## Diagnostics

Runtime diagnostics subsystem at `src/utils/diagnostics.js` — **read-only** introspection:

| Method | Returns |
|--------|---------|
| `Diagnostics.cache()` | Hits, misses, hit rate, recompute counts, memory estimate |
| `Diagnostics.selectors()` | Cached selector count, hit/recompute rates |
| `Diagnostics.aggregation()` | Activity count, sums, timing |
| `Diagnostics.recommendation()` | Count, timing |
| `Diagnostics.storage()` | Per-key health checks, activity count |
| `Diagnostics.invariants()` | Pass/fail counts, full detail |
| `Diagnostics.recovery()` | RecoveryLog summary + recent entries |
| `Diagnostics.repair()` | Self-healing repair count |
| `Diagnostics.duplicatePrevention()` | Dedup prevention count |
| `Diagnostics.telemetry()` | Full telemetry summary + counts |
| `Diagnostics.all()` | Complete diagnostic snapshot |

## ADR Index

| ADR | Title | Decision |
|-----|-------|----------|
| ADR-001 | Self-Healing Repair Over Filtering | Repair corrupt records instead of filtering them out |
| ADR-002 | Invariant Detection vs Self-Healing | Separate concerns: detection (invariant) vs repair (self-healing) |
| ADR-003 | ES6 Classes for Error Hierarchy | Use ES6 class hierarchy for typed errors |
| ADR-004 | Fault Injection as Test Utility | Fault injectors are test-only, never in production |
| ADR-005 | Chaos Testing with Configurable Rounds | Chaos rounds controlled via `CHAOS_ROUNDS` env var |

## Release Process

### Release Checklist

1. All CI phases pass (lint, build, tests, coverage, security, benchmarks, audit)
2. Engineering dashboard generated and reviewed
3. Benchmark comparison against previous baseline
4. CodeQL analysis completed (weekly or per-PR)
5. Dependabot PRs reviewed and merged
6. `npm audit --audit-level=high` passes
7. Tag release and create GitHub Release

### Versioning

- Current: 0.0.0 (pre-release)
- Schema versioned storage keys (`eco_activities_v1`)
- Breaking changes increment storage key version

## Quality Gates

| Gate | Standard | Enforcement |
|------|----------|-------------|
| Code quality | 0 ESLint errors | `npm run lint` |
| Build | Successful production build | `npm run build` |
| Test pass rate | 100% (0 failures) | `npm run test:all` |
| Line coverage | >60% | `npm run coverage` |
| Branch coverage | >60% | `npm run coverage` |
| Security violations | 0 static analysis findings | `npm run security-scan` |
| Benchmark regression | Within defined thresholds | `npm run bench-check` |
| Bundle budget | Total JS < 180 KB gzip | `node scripts/check-budget.mjs` |
| Dependency audit | No high/critical | `npm audit --audit-level=high` |
| Accessibility | 0 failures (49 tests) | `npm run test:accessibility` |

---

*Last updated: 2026-06-15*
