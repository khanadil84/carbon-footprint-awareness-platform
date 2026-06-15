# Performance History — EcoTrack

## Benchmark Evolution

This document tracks performance benchmark results across builds to detect regressions and improvements over time.

## Latest Results

Generated automatically. See [benchmark-baseline.json](../benchmark-baseline.json) for raw data.

### Aggregation Benchmarks

| Size | Function | Avg (ms) | Status |
|------|----------|----------|--------|
| 10 | fullRecompute | — | — |
| 100 | fullRecompute | — | — |
| 1000 | fullRecompute | — | — |
| 5000 | fullRecompute | — | — |
| 10 | incrementalAdd | — | — |
| 100 | incrementalAdd | — | — |
| 1000 | incrementalAdd | — | — |
| 5000 | incrementalAdd | — | — |

### Analytics Benchmarks

| Size | Function | Avg (ms) | Status |
|------|----------|----------|--------|
| 10 | — | — | — |
| 100 | — | — | — |
| 1000 | — | — | — |
| 5000 | — | — | — |

### Recommendation Benchmarks

| Size | Function | Avg (ms) | Status |
|------|----------|----------|--------|
| 10 | generateRecommendations | — | — |
| 100 | generateRecommendations | — | — |
| 1000 | generateRecommendations | — | — |

## Historical Comparison

| Date | Suite | Size | Function | Previous (ms) | Current (ms) | Delta |
|------|-------|------|----------|---------------|---------------|-------|

*Historical comparison data is generated on each CI run when a previous baseline exists.*

## Latency Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Aggregation (avg) | — | < 50 ms | — |
| Recommendation (avg) | — | < 30 ms | — |
| Analytics (avg) | — | < 30 ms | — |

## Cache Performance

| Metric | Current |
|--------|---------|
| Hit Rate | — |
| Full Recomputes | — |
| Incremental Updates | — |
| Selector Cache Size | — |

## Storage Performance

| Metric | Current |
|--------|---------|
| Activity Load Time | — |
| Activity Write Time | — |

---

*This document is automatically updated by the CI pipeline. Run `node scripts/check-performance.mjs` to regenerate benchmark data and `node scripts/generate-dashboard.mjs` to regenerate the full engineering dashboard.*
