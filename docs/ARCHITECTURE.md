# Architecture Visualization — EcoTrack

## System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Browser Context                                     │
│                                                                               │
│  ┌─────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  User    │──▶│ Validation│──▶│  Invariant   │──▶│ Self Healing │             │
│  │  Input   │  │  (domain) │  │  Engine      │  │  (repair)    │             │
│  └─────────┘  └───────────┘  └──────┬───────┘  └──────┬───────┘             │
│                                     │                  │                      │
│                                     ▼                  ▼                      │
│                              ┌──────────────────────────────────┐             │
│                              │           Storage                │             │
│                              │  (safe wrappers → localStorage)  │             │
│                              └────────────────┬─────────────────┘             │
│                                               │                               │
│                                               ▼                               │
│                              ┌──────────────────────────────────┐             │
│                              │       Incremental Cache           │             │
│                              │  (generation-based invalidation)  │             │
│                              └────────────────┬─────────────────┘             │
│                                               │                               │
│                                               ▼                               │
│                              ┌──────────────────────────────────┐             │
│                              │        Memo Selectors             │             │
│                              │  (5 cached selectors, gen-keyed)  │             │
│                              └────────────────┬─────────────────┘             │
│                                               │                               │
│              ┌────────────────────────────────┼─────────────────────────┐     │
│              ▼                                ▼                         ▼     │
│    ┌──────────────────┐          ┌────────────────────┐    ┌────────────────┐ │
│    │   Analytics       │          │  Recommendations   │    │   Dashboard    │ │
│    │  (aggregation,    │          │  (8 rules,         │    │   (widgets,    │ │
│    │   breakdown,      │          │   scored)          │    │   charts)      │ │
│    │   trends)         │          └────────────────────┘    └────────────────┘ │
│    └──────────────────┘                                                     │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       Observability Layer                                │ │
│  │                                                                          │ │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │ │
│  │  │Telemetry │  │ Diagnostics│  │ Recovery │  │  System  │  │ Metrics │ │ │
│  │  │(16 evts) │  │(read-only) │  │   Log    │  │  Health  │  │(consolid│ │ │
│  │  └──────────┘  └───────────┘  └──────────┘  └──────────┘  └─────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      CI Reports (external)                               │ │
│  │                                                                          │ │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌───────────┐              │ │
│  │  │Dashboard │  │   Build   │  │   Test   │  │  Coverage  │              │ │
│  │  │.md/.json │  │  (dist/)  │  │ Reports  │  │  Reports   │              │ │
│  │  └──────────┘  └───────────┘  └──────────┘  └───────────┘              │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Dependency Graph

```
                              ┌──────────────┐
                              │   storage.js  │
                              └──────┬───────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ activityService  │  │   goalService    │  │  settingsService  │
    └────────┬─────────┘  └────────┬─────────┘  └──────────────────┘
             │                      │
             ▼                      │
    ┌──────────────────┐            │
    │  activityCache   │            │
    └──────┬───────────┘            │
           │                        │
           ├────────────────────────┤
           ▼                        ▼
    ┌──────────────┐      ┌──────────────────┐
    │  Analytics   │      │ recommendation   │
    │  (computeAgg,│◄─────│ Service          │
    │   breakdown) │      └──────────────────┘
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ carbonScore  │
    │ Service      │
    └──────────────┘

    ┌──────────────┐
    │ achievement  │
    │ Service      │
    └──────────────┘
```

## Data Flow Sequence Diagram

### Activity Creation

```
User         ActivityForm     ActivityCache    ActivityService    Storage(localStorage)
 │                │                 │                │                    │
 │── fill form ──▶│                 │                │                    │
 │                │── addActivity ─▶│                │                    │
 │                │                 │── addActivity ─▶                    │
 │                │                 │                │── safeGetJSON ────▶│
 │                │                 │                │◁── raw data ──────│
 │                │                 │                │                    │
 │                │                 │                │── sanitize/validate│
 │                │                 │                │── calcEmission     │
 │                │                 │                │                    │
 │                │                 │                │── safeSetJSON ────▶│
 │                │                 │                │◁── success ───────│
 │                │                 │◁── entry ─────│                    │
 │                │                 │                    │                │
 │                │                 │── incrementalAdd  │                │
 │                │                 │── cacheGen++      │                │
 │                │                 │── notify()        │                │
 │                │◁── entry ──────│                    │                │
 │                │                    │                │                │
 │                │ (re-render via     │                │                │
 │                │  subscription)     │                │                │
 │◁── UI update ──│                    │                │                │
```

### Cache Invalidation Cycle

```
Storage Event     ActivityCache     Selector Cache     UI Components
 (cross-tab)           │                  │                  │
      │                │                  │                  │
      │── 'storage' ──▶                  │                  │
      │                │── stale=true ───▶                  │
      │                │                  │                  │
      │                │                  │                  │
 ... later request ... │                  │                  │
      │                │                  │                  │
      │                │── load()         │                  │
      │                │  (stale→reload)  │                  │
      │                │                  │                  │
      │                │── getSelector()  │                  │
      │                │  (gen changed)   │                  │
      │                │  → recompute ───▶│                  │
      │                │                  │── render ──────▶│
```

### Recovery Log Flow

```
Error Detected       Recovery Log        Invariant Engine    System Health
      │                  │                     │                  │
      │── record() ─────▶                     │                  │
      │                  │                     │                  │
      │ (repair action)  │                     │                  │
      │                  │                     │                  │
      │── verify() ──────│────────────────────▶│                  │
      │                  │                     │── check inv ────▶│
      │                  │                     │                  │
      │◁── result ──────│◁────────────────────│                  │
      │                  │                     │                  │
      │ (if verify fail) │                     │                  │
      │── escalate ─────▶│                     │                  │
```

## Architecture Decisions

See [docs/ADRS/](./ADRS/) for all Architecture Decision Records:

| ADR | Decision |
|-----|----------|
| [ADR-001](./ADRS/ADR-001-self-healing-repair-over-filtering.md) | Repair corrupt records rather than filtering silently |
| [ADR-002](./ADRS/ADR-002-invariant-detection-vs-self-healing.md) | Separate invariant detection from self-healing repair |
| [ADR-003](./ADRS/ADR-003-es6-classes-for-error-hierarchy.md) | ES6 class hierarchy for typed errors |
| [ADR-004](./ADRS/ADR-004-fault-injection-as-test-utility.md) | Fault injectors are test-only utilities |
| [ADR-005](./ADRS/ADR-005-chaos-testing-with-configurable-rounds.md) | Configurable chaos test rounds via env var |

## Layer Responsibilities

| Layer | Responsibility | Key Files |
|-------|---------------|-----------|
| **Presentation** | UI rendering, event handling, state derivation | `src/components/`, `src/pages/` |
| **Service** | Business logic, orchestration | `src/utils/activityService.js`, `goalService.js` |
| **Cache** | In-memory caching, generation management | `src/utils/activityCache.js` |
| **Domain** | Pure functions, validation, calculation | `src/domain/validation.js`, `emissionCalculator.js` |
| **Storage** | Safe localStorage I/O, corruption recovery | `src/utils/storage.js` |
| **Resilience** | Error handling, retry, self-healing, invariants | `src/utils/resilience.js`, `selfHealing.js`, `invariantEngine.js` |
| **Observability** | Telemetry, health, diagnostics, recovery log | `src/utils/telemetry.js`, `systemHealth.js`, `diagnostics.js`, `recoveryLog.js`, `metrics.js` |
| **Performance** | Slice timing, metric collection, cache stats | `src/performance/PerformanceMonitor.js`, `MetricsCollector.js`, `CacheStats.js` |
| **Security** | Events, policy, constants | `src/security/SecurityEvents.js`, `SecurityPolicy.js` |

---

*This document is a living artifact. Update when architecture changes.*
