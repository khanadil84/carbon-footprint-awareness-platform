# ADR-004: Fault Injection as Test Utility (Not Production Code)

## Status
Accepted

## Context
The resilience infrastructure needed validation that it actually detects and recovers from real failure modes. Two options:
1. **Production fault injection**: Toggle gates in production code that simulate failures.
2. **Test-only utility**: A `tests/lib/faultInjection.js` module used exclusively in test suites.

## Decision
Implement fault injection as a **test-only utility** in `tests/lib/faultInjection.js`:

| Injector | What it does |
|----------|-------------|
| `injectMalformedStorage()` | Writes non-JSON to localStorage |
| `injectDuplicateIds()` | Creates activities with duplicate IDs |
| `injectBrokenAggregation()` | Corrupts the aggregation cache |
| `injectMissingCo2()` | Strips co2 from activity records |
| `injectMissingId()` | Strips id from activity records |
| `injectInvalidDate()` | Sets date to `'invalid-date'` |
| `injectInvalidScore()` | Sets carbon score to `999` |
| `injectCorruptSettings()` | Overwrites settings with null |
| `injectPartialWrite()` | Writes then deletes a record mid-batch |
| `injectBrokenCache()` | Corrupts the activity cache snapshot |
| `injectMalformedActivity()` | Sets activity to non-array |

Each injector returns `{ name, restore, verify }`.

## Consequences
- Zero risk of fault injection code affecting production behavior
- Test utilities can be aggressive (direct mutation, no guards)
- Injectors self-clean via `restore()` for test isolation
- Coverage of 11 distinct failure modes
