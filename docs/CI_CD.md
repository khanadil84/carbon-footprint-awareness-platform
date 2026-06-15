# CI/CD & Release Engineering

## Pipeline Overview

```
Push/PR to main
    │
    ├── lint (eslint)
    ├── build (vite)
    ├── test (24 suites, matrix + chaos + consistency)
    ├── audit (npm audit — fail on high/critical)
    ├── coverage (≥60% per file)
    ├── security-scan (check-security.mjs)
    ├── benchmark (check-performance.mjs)
    │
    └── CodeQL (weekly + PRs)
```

## Workflows

### `.github/workflows/ci.yml` — Continuous Integration

Triggers: push/PR to `main`.

| Job | Purpose |
|-----|---------|
| `lint` | ESLint — fail on any error |
| `build` | Vite production build |
| `test` | 18 suite jobs via matrix (unit + regression + fuzz + mutation + security + property + integration + accessibility) |
| `chaos` | 9 chaos tests with random corruption (10 rounds CI, configurable via `CHAOS_ROUNDS`) |
| `consistency` | 6 end-to-end consistency tests |
| `performance` | 18 performance tests (10/100/1000 activities) |
| `audit` | `npm audit --audit-level=high` — fail on high/critical, upload JSON report |
| `coverage` | Node built-in test coverage, ≥60% threshold per file, upload report artifact |
| `security-scan` | Greps for `dangerouslySetInnerHTML`, `eval(`, `new Function(`, `document.write(`, inline event handlers |
| `benchmark` | Runs `benchmarks/*.bench.js`, fails if any avg exceeds size-based threshold |

All jobs run in parallel after `lint`.

### `.github/workflows/codeql.yml` — CodeQL Analysis

Triggers: push/PR to `main` + weekly Monday 06:00 UTC.

- JavaScript analysis with `security-and-quality` query suite
- Excludes `node_modules`, `dist`, `tests`
- Results posted as PR annotations

### `.github/dependabot.yml` — Dependency Updates

| Ecosystem | Schedule | Grouping |
|-----------|----------|----------|
| npm | Weekly Monday 08:00 UTC | React, ESLint, Vite groups (minor+patch batched) |
| GitHub Actions | Weekly Monday 08:00 UTC | All actions grouped |

### `.github/workflows/release-check.yml` — Release Gate

Triggers: tag push `v*.*.*` or release published.

Verifies before releasing:
- `npm run lint`
- `npm run build`
- `npm audit --audit-level=high`
- `node scripts/check-security.mjs`
- All unit tests
- All regression tests
- Chaos tests (20 rounds)
- Consistency tests
- Coverage ≥60%
- Benchmark thresholds

## Quality Gates

### Gate 1: Lint (CI + Release)
- **Tool**: ESLint 10 with flat config
- **Failure**: Any error (warnings allowed)
- **Scope**: All `.js`/`.jsx` files except `dist/`

### Gate 2: Build (CI + Release)
- **Tool**: Vite
- **Failure**: Build error
- **Output**: `dist/` directory

### Gate 3: Tests (CI + Release)
- **Suite**: 24 test files, 499+ individual tests
- **Runner**: Node.js `node:test` / `node:assert`
- **Failure**: Any failed test
- **Parallelization**: Matrix across 18 suites + chaos + consistency

### Gate 4: Dependency Audit (CI + Release)
- **Tool**: `npm audit --audit-level=high`
- **Failure**: High or critical severity
- **Report**: Uploaded as workflow artifact

### Gate 5: Coverage (CI + Release)
- **Tool**: Node.js `--experimental-test-coverage`
- **Threshold**: ≥60% per test file
- **Failure**: Any file below threshold
- **Report**: Uploaded as workflow artifact

### Gate 6: Security (CI + Release)
- **Tool**: `scripts/check-security.mjs`
- **Checks**:
  - ❌ `dangerouslySetInnerHTML`
  - ❌ `eval(`
  - ❌ `new Function(`
  - ❌ `document.write(`
  - ❌ Inline event handlers (`on*="..."`)

### Gate 7: Benchmark (CI + Release)
- **Tool**: `scripts/check-performance.mjs`
- **Thresholds**:

| Suite | 10 items | 100 items | 1000 items | 5000 items |
|-------|----------|-----------|------------|------------|
| analytics | 1ms | 5ms | 30ms | 150ms |
| aggregation | 1ms | 5ms | 30ms | 150ms |
| recommendation | 5ms | 15ms | 30ms | — |

- **Failure**: Any average exceeds threshold

### Gate 8: CodeQL (Weekly + PR)
- **Tool**: GitHub CodeQL
- **Queries**: `security-and-quality`
- **Failure**: Any security alert

## Release Flow

```
Feature branch → PR → CI (all gates)
    ↓
Merge to main → CI (all gates)
    ↓
Tag v*.*.* → Release Check (all gates + audit + coverage + benchmark)
    ↓
Published release
```

## Branch Strategy

| Branch | Purpose | CI | Protection |
|--------|---------|----|------------|
| `main` | Production-ready | Full pipeline | PR required, status checks |
| `feature/*` | Development | PR CI | Branch off main |

## Merge Requirements

- All CI jobs green
- Lint passes
- No high/critical audit findings
- Coverage ≥60%
- All benchmarks within thresholds
- Security scan clean
- CodeQL clean (new alerts addressed)

## Verification Methodology

### Benchmark Regression Detection

Each benchmark function is run multiple times (50-200 iterations per size). The average execution time is compared against the configured threshold for that data size. Thresholds are set at approximately 3× the observed baseline on a standard CI runner to accommodate noise while catching genuine regressions.

### Coverage Threshold

The 60% threshold was determined by measuring current coverage across all test files. This is a floor — files below 60% indicate insufficient test coverage and must be addressed before release.

### Security Check

The security scanner uses regex-based static analysis. It does not run the code, avoiding false negatives from dynamic patterns while accepting minimal false positives (e.g., `eval` in comments). Any match triggers a CI failure.
