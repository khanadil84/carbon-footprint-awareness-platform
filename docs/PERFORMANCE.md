# Performance Architecture

## Cache Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      Memory Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            ActivityCache (singleton)                  │  │
│  │  ┌─────────────┐  ┌──────────────────────────────┐   │  │
│  │  │ cachedArray  │  │    cachedAggregation         │   │  │
│  │  │ (Activity[]) │  │  ┌────────────────────────┐  │   │  │
│  │  │              │  │  │ totals:                │  │   │  │
│  │  │              │  │  │  today/ week/ month/   │  │   │  │
│  │  │              │  │  │  totalSum               │  │   │  │
│  │  │              │  │  │ typeSum (Map)           │  │   │  │
│  │  │              │  │  │ dayMap (Map)            │  │   │  │
│  │  │              │  │  │ monthMap (Map)          │  │   │  │
│  │  │              │  │  │ byId (Map)              │  │   │  │
│  │  │              │  │  │ byType (Map)            │  │   │  │
│  │  │              │  │  │ byMonth (Map)           │  │   │  │
│  │  │              │  │  │ byCategory (Map)        │  │   │  │
│  │  │              │  │  │ dateActivityCounts(Map) │  │   │  │
│  │  │              │  │  │ typeCounts (Object)     │  │   │  │
│  │  │              │  │  │ totalActivities (num)   │  │   │  │
│  │  │              │  │  └────────────────────────┘  │   │  │
│  │  └─────────────┘  └──────────────────────────────┘   │  │
│  │  ┌────────────────────────────────────────────┐      │  │
│  │  │      Selector Cache (generation-based)      │      │  │
│  │  │  getScoreAndMeta() → { score, rating, … }   │      │  │
│  │  │  getRecommendations() → recs[]              │      │  │
│  │  │  getGoalProgress(goal) → { current, … }     │      │  │
│  │  │  getAchievements(goal) → achievements[]     │      │  │
│  │  │  getSummaryStats() → { total, byType, … }   │      │  │
│  │  └────────────────────────────────────────────┘      │  │
│  └──────────────────────────────────────────────────────┘  │
┌────────────────────────────────────────────────────────────┐
│                    Storage Layer                            │
│  ActivityService.loadActivities() / .saveActivities()      │
│  (chrome.storage.local / localStorage)                     │
└────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Action → ActivityCache.add/remove
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
   ActivityService       incrementalAdd/Remove
   (persist)             (delta update O(1))
         │                     │
         └──────────┬──────────┘
                    ▼
           cacheGeneration++
           (invalidates selectors)
                    │
                    ▼
         Component re-renders
         (reads from selectors)
```

## Big-O Complexity

### Pre-Optimization (Before)
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `computeFullAggregation` | O(n) | Single traversal |
| `collectStats` | O(n) | Separate full traversal |
| `breakdownByCategory` | O(n) | Iterated breakdown list |
| `summaryStats` | O(n) | Iterated activities |
| `aggregateByDay(30)` | O(n + 30) | Built dayMap from scratch |
| `evaluateAchievements` | O(n) | Separate traversal |
| `evaluateGoalAchiever` | O(n) | Separate `computeFullAggregation` call |
| `generateRecommendations` | O(breakdown) | Small constant |
| `queryActivities` (filter) | O(n) | Filter + sort full list |
| `removeActivity` (find) | O(n) | `cachedActivities.find()` |
| `exportActivitiesCSV` | O(n) | Map + concat (3 temp arrays) |

### Post-Optimization (After)
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `computeFullAggregation` | O(n) | Single traversal (same cost, 5 extra Map writes) |
| `collectStats` | O(1) | 6 Map/object lookups from pipeline |
| `breakdownByCategory` | O(k) | k = breakdown list (~7 types) |
| `summaryStats` | O(days) | days = 30, reads from dayMap |
| `aggregateByDay(30)` | O(30) | Uses precomputed dayMap, no activity iteration |
| `evaluateAchievements` | O(1) | Reads typeCounts, totalActivities |
| `evaluateGoalAchiever` | O(1) | Uses precomputed agg, no recompute |
| `generateRecommendations` | O(k) | k = breakdown list (~7 types) |
| `queryActivities` (type filter) | O(k) | k = results in byType Map bucket |
| `queryActivities` (category filter) | O(k) | k = results in byCategory Map bucket |
| `queryActivities` (complex filter) | O(n) | Falls back to full iteration |
| `removeActivity` (find) | O(1) | `byId.get(id)` Map lookup |
| `exportActivitiesCSV` | O(n) | Single pass, 1 array, no intermediate objects |

### Selectors
| Selector | Complexity | Invocation Cost |
|----------|-----------|-----------------|
| `getScoreAndMeta()` | O(k) | k = breakdown list size |
| `getRecommendations()` | O(k) | k = breakdown list size |
| `getGoalProgress(goal)` | O(1) | Reads from aggregation |
| `getAchievements(goal)` | O(1) | Reads typeCounts, totalActivities |
| `getSummaryStats()` | O(1) | Reads from aggregation |

## Memory Tradeoffs

The indexed architecture trades ~O(n) additional memory (n = activity count) for O(1) lookups:

| Index | Entries | Memory Per Entry |
|-------|---------|-----------------|
| `byId` | n | ~100 bytes (key: UUID string, val: object ref) |
| `byType` | 7 (types) | Array of refs per type |
| `byMonth` | ~months active | Array of refs per month |
| `byCategory` | 3 (categories) | Array of refs per category |
| `dayMap` | ~days active | ~80 bytes per (key: date string, val: number) |
| `monthMap` | ~12 | ~80 bytes per (key: month string, val: number) |
| `typeSum` | ~7 (types) | ~80 bytes per |
| `dateActivityCounts` | ~days active | ~80 bytes per |
| `typeCounts` | 3 | Object with 3 numbers |

Total overhead for 1000 activities: ~100 KB (mostly duplicate refs in index arrays).
Activities themselves are ~200-400 bytes each → ~200-400 KB for 1000 activities.
Total index overhead: ~30-50% of activity data size.

## Benchmark Results

### Aggregation Strategy (5000 activities)
```
fullRecompute:         avg=17.99ms  min=15.76ms  max=26.58ms
incrementalAdd:        avg= 1.50ms  min= 0.96ms  max= 3.40ms
```
Incremental is ~12× faster at 5000 items.

### Analytics Operations (5000 activities)
```
computeFullAggregation:  avg=21.79ms  min=15.74ms  max=62.05ms
breakdownByCategory:     avg= 0.01ms  min= 0.01ms  max= 0.14ms  (O(1))
summaryStats:            avg= 0.08ms  min= 0.06ms  max= 1.03ms  (O(1))
aggregateByDay(30):      avg= 0.05ms  min= 0.04ms  max= 0.41ms  (O(30))
```

### Key Speedups
| Operation | Before | After | Speedup |
|-----------|--------|-------|---------|
| `collectStats` (1000 items) | ~0.8ms | ~0.001ms | ~800× |
| `aggregateByDay` (1000 items) | ~0.5ms | ~0.05ms | ~10× |
| `removeActivity` find | O(n) | O(1) | n× |
| Full page render (aggregation) | 2× O(n) traversal | 1× O(n) + O(1) reads | ~2× |

## Cache Efficiency

The generation-based selector cache prevents recomputation when:
- Component re-renders without data changes
- Multiple components consume the same selector
- Cross-tab storage event triggers invalidation

Cache statistics available via `ActivityCache.perfReport()`:
- `cacheHits` / `cacheMisses` — activity array cache
- `fullRecomputes` / `incrementalUpdates` — aggregation strategy distribution
- `selectorCacheSize` — number of cached selector results
