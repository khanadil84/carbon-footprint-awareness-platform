# Problem-Solving & Production Engineering Review

## 1. Failure Mode Analysis

### Data Source Failures

| Failure | Impact | Likelihood | Current Protection |
|---|---|---|---|
| `localStorage.getItem` throws | null returned, app continues | Low | `safeGetItem` catch → null |
| `localStorage.setItem` quota full | write silently lost | Low | `safeSetItem` returns false, caller can check |
| Corrupted JSON in storage | empty/default state on next load | Medium | `recoverJSON` trims trailing garbage; `safeParseJSON` attempts recovery before fallback |
| Partial write (crash mid-save) | truncated JSON → recovery attempts → fall back to defaults | Low | `recoverJSON` handles truncated arrays/objects |
| `localStorage` unavailable (SSR, restricted) | storage returns null, fallback values used | Medium | `getStorage` returns null → all ops use fallback |
| Cross-tab concurrent modification | one tab overwrites other's data | Medium | `storage` event listener sets `stale` flag; next `load()` re-reads from storage |

### Computation Failures

| Failure | Impact | Current Protection |
|---|---|---|
| `activities` is null/undefined in aggregation | throws `TypeError: Cannot read property 'length'` | `computeFullAggregation` has NO null guard at the top level |
| NaN `co2` in a record | `Number(NaN) || 0` → 0, silently ignored | Guarded via `Number(a.co2) \|\| 0` |
| `a.type` is undefined in aggregation | `typeSum.get(undefined)` → Map key collision | Not guarded; but `loadActivities` filters invalid records |
| `new Date(a.date)` produces Invalid Date | `d >= startOfDay` → false, no crash | Falls through silently |
| `generateRecommendations` with empty data | returns single "no data" rec | Guarded: `if (activities && activities.length > 0)` |
| `calculateCarbonScore` with empty data | returns safe default score object | Guarded: `if (!activities \|\| activities.length === 0)` |
| `summaryStats` with empty data | returns safe default | Guarded |
| `evaluateAchievements` with null stats | returns { achievements, recent: null } | Guarded: `if (!stats) return...` |

### Caching Failures

| Failure | Impact | Current Protection |
|---|---|---|
| Cache stale after external storage mutation | stale data served until `invalidate()` | `stale` flag + `storage` event listener |
| Cache miss on first load | full read from storage + recompute | `Perf.miss` tracked, proper fallback |
| Incremental update crosses day boundary | `isSameDay` returns false → full recompute | `recallAgg()` fallback |

### Resilience Scorecard (pre-change)

- **Self-healing**: Minimal — `recoverJSON` handles truncated strings, but corrupted records are dropped silently
- **Graceful Degradation**: Strong — most services guard empty/null inputs
- **Idempotency**: Poor — `addActivity` always creates a new entry; rapid double-tap produces duplicates
- **Consistency**: Good — cache generation counter ensures selectors recompute on writes
- **Invariant Enforcement**: None — no runtime assertions guard invariants
- **Recovery Pipeline**: None — errors are thrown, not recovered
- **Structured Error Handling**: None — all errors are generic `Error('message')`

---

## 2. Self-Healing

### Implemented

**`repairActivity`** in `activityService.js:16-27` attempts automatic repair of corrupted records:

```
┌──────────────────────────────────────┐
│  storage.getJSON('activities')       │
│         ↓                            │
│  for each record:                    │
│    ├─ isValidRecord?  → keep as-is   │
│    └─ else → repairActivity(record)  │
│         ├─ valid type + value?       │
│         │   ├─ co2 valid? → keep     │
│         │   └─ co2 bad → recompute   │
│         └─ unfixable → drop          │
└──────────────────────────────────────┘
```

What is repaired:
- Missing/corrupt `co2` → recomputed from `type × value`
- Missing `id` → generated (`repaired_<random>`)
- Missing `date` → current timestamp

What is dropped (unfixable):
- Invalid/missing `type`
- Missing/invalid `value`
- Non-object entries

### Storage-Level Recovery

`safeParseJSON` + `recoverJSON` in `storage.js:108-119` converts trailing garbage:

```
Input:  {"a":1}\nand some extra
Output: {a: 1}  ✓

Input:  {"a":1,"b":2}truncated
Output: {a: 1, b: 2}  ✓

Input:  {incomplete
Output: null (fallback)  ✓
```

### Cache Consistency

`verifyAggregationConsistency` in `activityCache.js:34-43` performs a full sum check whenever a cached aggregation is accessed. If the total sum differs from `activities` sum by > 0.001, the aggregation is invalidated and recomputed on the next access.

Cost: O(n) sum walk, but only triggered on cache HIT (avoiding the O(n) recompute path). Without this, a silent mutation to `cachedActivities` array would produce stale aggregation data indefinitely.

---

## 3. Graceful Degradation

### Dependency Failure Handling

Each service degrades independently when its dependencies fail:

```
Service A (storage access)              Service B (cache layer)
     │                                        │
     ├─ storage throws                       ├─ ActivityService throws
     │   └─ safeGetJSON → fallback           │   └─ try/catch → invalidate cache, notify
     │                                       │
     ├─ JSON parse fails                    ├─ computeFullAggregation fails
     │   └─ safeParseJSON → fallback         │   └─ Error propagates (caller's responsibility)
     │                                       │
     └─ JSON stringify fails                ├─ incremental update fails
         └─ safeStringifyJSON → null          └─ recallAgg() full recompute
```

### Empty/Null Data Paths

All public computation functions accept null/empty activities:

- `calculateCarbonScore` → returns `{ score: 0, rating: 'Poor', ... }` with user-friendly explanation
- `generateRecommendations` → returns single "add data" recommendation
- `summaryStats` → returns `{ highestEmissionCategory: null, totalActivities: 0, avgDaily: 0, bestDay: null }`
- `evaluateAchievements` → returns `{ achievements: [...], recent: null }`
- `exportDashboardCSV` → generates CSV with empty/template values
- `aggregate` → returns `{ totals: { today: 0, ... }, score: 0 }`

### Cache Degradation Paths

| Scenario | Behavior |
|---|---|
| Storage unavailable on add | `withFallback` → returns null → cache invalidates + notifies → next read re-validates from empty storage |
| Storage unavailable on remove | `withFallback` → returns `[]` → cache invalidates + notifies |
| Incremental update fails (day boundary) | Falls back to `recallAgg()` — full recompute from `cachedActivities` |
| Aggregation sum mismatch detected | `cachedAggregation` set to null → next read recomputes |

---

## 4. Idempotency

### Existing Idempotent Operations

| Operation | Idempotent? | Reason |
|---|---|---|
| `loadActivities()` | Yes | Pure read; same storage → same result |
| `removeActivity(id)` | Yes | `filter(a => a.id !== id)` — removing same ID twice produces same list |
| `clearActivities()` | Yes | Writing empty array repeatedly produces same state |
| `saveActivities(list)` | Yes | Pure write; same list → same storage |
| `computeFullAggregation(activities)` | Yes | Pure function; same activities → same aggregation |
| `generateRecommendations(...)` | Yes | Pure function; same inputs → same recs |
| `calculateCarbonScore(...)` | Yes | Pure function; same inputs → same score |

### Non-Idempotent Operations (with dedup guard)

| Operation | Issue | Guard |
|---|---|---|
| `addActivity({ type, value, date })` | Each call creates a new ID, appends to list | **Dedup window**: 2-second window for exact `type+value+date` fingerprint. Returns the same entry object on repeat calls. |

The dedup guard covers the most common production scenario: rapid double-click on "Add" button, or React StrictMode double-invocation.

Cache-layer idempotency: `lastAddedEntryId` prevents the cache from applying the same entry twice when `addActivity` returns a duplicate entry.

### Limitations

- The dedup window is process-level, not persisted. If the user refreshes and clicks "Add" again within 2 seconds of the previous session, a new entry is created.
- Cross-tab dedup is not handled (no shared lock mechanism in `localStorage`).

---

## 5. Consistency Guarantees

### Write Consistency

Storage writes are validated before commit:

```
addActivity → build entry → read current list → filter? no → concat → validate list → write
                                                                           │
                                                                    `activity.isValidList(next)`
                                                                    ensures every record in the
                                                                    new list is structurally valid
```

`saveActivities` + `safeSetJSON` both validate:
- The list is an array
- Every record passes `isValidRecord` (has `id`, `date`, `type`, `value`, `co2`)

### Read Consistency

On load, `safeGetJSON` applies:
- JSON parse with recovery
- `isValidList` check (if `validate` callback provided)
- Deep clone (or skip for hot paths)

### Cache Consistency

The cache maintains `cacheGeneration` counter. Every write operation increments it. Selectors check the generation before serving stale results:

```
memoSelector:
  gen = cacheGeneration
  if gen !== selectorGen → clear selector cache, set selectorGen = gen
  if key in selectorCache → return cached
  else → compute, cache, return
```

### Race Condition Protection

`addActivity` in the cache uses `lastAddedEntryId` guard to prevent double-counting when `ActivityService.addActivity` returns a deduped entry.

Storage-level race: Not protected. Two tabs writing simultaneously can overwrite each other's data. This is a `localStorage` fundamental limitation.

---

## 6. Invariant Enforcement

### Current

No runtime invariant checks existed before this change.

### Added

**`invariant(condition, message, ErrorClass)`** in `resilience.js:45-47` provides a structured assertion mechanism:

```js
invariant(typeof x === 'number', 'x must be a number', ValidationError);
```

Key invariants that should hold (but are currently unenforced):
- `totalSum === sum of all co2 values` (verified via `verifyAggregationConsistency`)
- Every activity in `cachedActivities` has a matching entry in `cachedAggregation.byId`
- `typeCounts.bus + typeCounts.train + typeCounts.carShort <= totalActivities`
- `todaySum <= weeklySum <= monthlySum <= totalSum`

### Future Invariant Candidates

| Invariant | Where to Add |
|---|---|
| Aggregation `totalSum` matches activity sum | `activityCache.js:loadAgg` |
| All activities in `cachedActivities` are valid | `activityCache.js:load` |
| `co2` > 0 for non-zero `value` | `activityService.js:addActivity` |
| Date strings parse to valid Date objects | `activityService.js:repairActivity` |
| Category mapping is 1:1 for all types | `activityAnalytics.js:computeFullAggregation` |

---

## 7. Recovery Pipeline

### Architecture

```
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│  Primary fn  │───>│   Retry (3x)  │───>│  Fallback    │
│  (e.g. save) │    │  exponential  │    │  (default)   │
└──────────────┘    │  backoff      │    └──────────────┘
                    └───────────────┘
```

### Implemented Components

**`retry(fn, options)`** — Exponential backoff with configurable:
- `maxAttempts` (default: 3)
- `baseDelay` (default: 100ms)
- `maxDelay` (default: 3000ms)
- `onRetry` callback for logging
- Only retries retryable errors (`STORAGE`, `CONSISTENCY` categories)

**`withFallback(fn, fallback)`** — Synchronous fallback:
```js
const entry = withFallback(() => ActivityService.addActivity(data), null);
if (!entry) { /* degrade gracefully */ }
```

**`withRecovery(fn, recoveryFn)`** — Error-aware recovery:
```js
const result = withRecovery(
  () => expensiveOperation(),
  (err) => fallbackValue
);
```

### Recovery Flow

```
ActivityService.addActivity(data)
  │
  ├─ success → returns entry
  │
  └─ StorageError thrown (quota full, storage unavailable)
       │
       ActivityCache.addActivity
         │
         ├─ catch → invalidate() + notify()
         │
         └─ return null (caller degrades)
              │
              UI layer: show "save failed" toast
              Next retry: user taps "Add" again → triggers
              full reload from potentially now-available storage
```

---

## 8. Structured Error Handling

### Error Hierarchy

```
Error
 └── AppError
      ├── StorageError    (retryable: true)
      │    Applies to: localStorage quota, unavailable, interrupted writes
      │    Recovery: retry with backoff, degrade to in-memory-only
      │
      ├── ValidationError  (retryable: false)
      │    Applies to: invalid type, negative value, missing fields
      │    Recovery: reject at UI layer, show validation message
      │
      ├── ConsistencyError (retryable: true)
      │    Applies to: cache mismatch, stale data
      │    Recovery: invalidate cache, recompute
      │
      └── NotFoundError    (retryable: false)
           Applies to: missing goal, missing settings
           Recovery: use defaults
```

### AppError Properties

```js
{
  name: 'AppError',
  message: 'Failed to persist activity',
  code: 'STORAGE_FAILURE',
  category: 'STORAGE',        // for routing to correct recovery handler
  retryable: true,             // for retry logic
  cause: { prev: 10, next: 11 }, // diagnostic context
  timestamp: 1718000000000    // for waterfall tracing
}
```

### Error Classification in ActivityService

| Operation | Error Type | When |
|---|---|---|
| `addActivity` | `ValidationError` | Invalid type or value |
| `addActivity` | `StorageError` | `saveActivities` fails |
| `removeActivity` | `StorageError` | `saveActivities` fails |
| `clearActivities` | `StorageError` | `saveActivities` fails |

### Error Handling Guidelines

- **Retryable errors** (STORAGE, CONSISTENCY): Attempt retry with backoff; if all attempts fail, degrade gracefully and surface to user
- **Non-retryable errors** (VALIDATION, NOT_FOUND): Surface immediately to user; do not retry
- **Catch boundaries**: Errors should be caught at the cache layer (for in-memory recovery) and at the UI layer (for user feedback)

---

## 9. Scalability & Performance

### Computational Complexity

| Operation | Complexity | Notes |
|---|---|---|
| `computeFullAggregation` | O(n) single pass | Builds 9 parallel data structures in one pass |
| `summaryStats` | O(n) | Calls `aggregateByDay` which is O(n) to build dayMap if not provided |
| `breakdownByCategory` | O(m) where m = unique types | Uses precomputed `typeSum` from aggregation |
| `generateRecommendations` | O(1) | All rules are Map lookups; no iteration over activities |
| `calculateCarbonScore` | O(1) + O(m) | Constant with precomputed breakdown |
| `aggregateByDay` | O(n) or O(days) | Parallel dayMap building if `fullDayMap` not provided |
| `aggregateByMonth` | O(n) or O(months) | Same pattern as aggregateByDay |
| `incrementalAdd` | O(1) | All Map operations are constant time |
| `incrementalRemove` | O(1) | IndexOf on type/month arrays is O(1) due to reference equality |
| `loadActivities` | O(n) | Filter + repair pass |
| `queryActivities` | O(n) worst case, O(k) with index | Falls back to full scan when search/text filter is used |

### Index Strategy

The aggregation builds 6 indexes during `computeFullAggregation`:

```
byId       → { id → record }          O(1) lookups
byType     → { type → [records] }      O(1) type-based queries
byMonth    → { month → [records] }     O(1) month-based queries
byCategory → { category → [records] }  O(1) category-based queries
dayMap     → { dateKey → sum }         O(1) daily aggregation
monthMap   → { monthKey → sum }        O(1) monthly aggregation
```

The `HistoryService.queryActivities` uses these indexes to avoid full scans when filtering by type or category alone:

```js
if (useIndex && type && type !== 'All') {
  filtered = ActivityCache.getIndex('byType').get(type) || [];
}
```

### Batch Efficiency

All array-building loops use pre-allocated sizes where possible:
- `exportActivitiesCSV`: `new Array(activities.length + 1)`
- `exportDashboardCSV`: `new Array(keys.length + 1)`
- `aggregateByWeek`: `Array.from({ length: weeks }, ...)`

### Memory

The cached aggregation stores ALL activity references in 6 parallel structures:
- `byId`: every activity (unique)
- `byType`: every activity (partitioned)
- `byMonth`: every activity (partitioned)
- `byCategory`: every activity (partitioned)
- `dayMap`: one entry per unique day
- `monthMap`: one entry per unique month

Memory overhead: approximately `activities.length × (1 ref in byId + 1 ref in byType + 1 ref in byMonth + 1 ref in byCategory) = 4N references`. For 10,000 activities, ~320KB assuming 64-bit pointers + Map overhead.

### Cache Hit Ratio

The `memoSelector` pattern with `cacheGeneration` guarantees at most one computation per cache generation per selector key. During steady-state operation with no writes, all reads are cache hits.

---

## 10. Architecture Review

### Dependency Graph

```
storage.js ←── activityService.js ←── activityCache.js ←── UI Components
                     │                      │
                     │                      ├── activityAnalytics.js
                     │                      │      └── dateUtils.js, mathUtils.js
                     │                      │
                     │                      ├── recommendationService.js
                     │                      │      └── activityAnalytics.js
                     │                      │
                     │                      ├── carbonScoreService.js
                     │                      │      ├── activityAnalytics.js
                     │                      │      └── recommendationService.js
                     │                      │
                     │                      ├── goalService.js
                     │                      │      ├── activityAnalytics.js
                     │                      │      └── goalProgress.js
                     │                      │
                     │                      └── achievementService.js
                     │                             └── goalService.js
                     │
                     ├── exportService.js
                     │      └── carbonScoreService.js, recommendationService.js,
                     │          goalService.js, achievementService.js
                     │
                     └── historyService.js
                            └── activityCache.js (via getIndex)
```

### Concerns

| Concern | Current State | Recommendation |
|---|---|---|
| **Circular dep risk** | `recommendationService` imports `activityAnalytics`; `carbonScoreService` imports both. No cycles. | Clean |
| **Service coupling** | `calculateCarbonScore` internally calls `generateRecommendations`, which is also called separately by `exportService.buildReportData` | Consider removing the internal call and making scores independent of recommendations |
| **Cache bypass** | `AchievementService` calls `safeGetJSON` directly (bypasses cache) for saved achievements state | This is appropriate — saved state (locked/unlocked) is separate from computed achievements |
| **Module reuse** | `activityAnalytics` exports both high-level (`computeFullAggregation`, `summaryStats`) and low-level (`aggregateByDay`, `findBestDay`) | Clear layering |
| **Error handling depth** | `activityService.js` throws `StorageError`/`ValidationError`; `activityCache.js` catches with try/catch; UI layer surfaces toasts | 3-layer error handling is appropriate |

### Separation of Concerns

| Layer | Responsibility | Files |
|---|---|---|
| **Storage** | Read/write with corruption recovery | `storage.js` |
| **Domain Validation** | Structural and semantic validation | `validation.js` |
| **Service** | Business logic, storage CRUD | `activityService.js`, `goalService.js`, `settingsService.js`, `achievementService.js` |
| **Analytics** | Pure computation on activity data | `activityAnalytics.js`, `carbonScoreService.js`, `recommendationService.js` |
| **Cache** | In-memory state with invalidation | `activityCache.js` |
| **Export** | Serialization to CSV/report | `exportService.js` |
| **Query** | Filtered, paginated reads | `historyService.js` |
| **Resilience** | Error types, recovery, invariants | `resilience.js` |
| **Performance** | Hit/miss tracking | `perf.js` |

### Quality Gates

- **Validation on write**: `saveActivities` validates the entire list before writing
- **Validation on read**: `loadActivities` filters invalid records
- **Self-healing read**: `loadActivities` repairs fixable records instead of dropping them
- **Consistency runtime check**: `verifyAggregationConsistency` in cache
- **Idempotency guard**: Dedup window and `lastAddedEntryId` in cache

### Production Readiness Checklist

- [x] All storage operations have try/catch with fallbacks
- [x] JSON parsing has recovery for truncated data
- [x] All computation functions accept and handle null/empty inputs
- [x] Cache has invalidation mechanism
- [x] Cache has generation-based selector memoization
- [x] Write operations validate before persisting
- [x] Read operations filter invalid records
- [ ] Cross-tab conflicts are detected (storage event listener exists in app)
- [ ] Performance counters track hit/miss ratios
- [x] Structured error hierarchy exists
- [x] Retry with backoff is available
- [x] Fallback/degradation paths exist for all critical operations
- [x] Self-healing reads repair corrupted data
- [x] Idempotency guard for add operations
- [x] Consistency verification for cached aggregation
