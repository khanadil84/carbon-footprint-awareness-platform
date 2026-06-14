# ADR-005: Chaos Testing with Configurable Rounds

## Status
Accepted

## Context
The resilience of the system under repeated random failures needed validation. A fixed number of test iterations would be either too slow for CI or too shallow for thorough validation.

## Decision
Use `$env:CHAOS_ROUNDS` environment variable to control chaos test iterations:

| Setting | Rounds | Use case |
|---------|--------|----------|
| Not set (default) | 50 | Standard CI run |
| `$env:CHAOS_ROUNDS=10` | 10 | Quick smoke test |
| `$env:CHAOS_ROUNDS=200` | 200 | Thorough stress run |
| `$env:CHAOS_ROUNDS=1000` | 1000 | Weekend soak test |

Tests include:
1. Random malformed storage (50 rounds)
2. Duplicate ID injection (50 rounds)
3. Null/undefined storage values (50 rounds)
4. Concurrent add-remove cycles (50 rounds)
5. Cache corruption recovery
6. Score with zero activities
7. System invariants after random modifications (20 rounds)
8. Missing co2 self-healing
9. Full round-trip storage corruption (20 rounds)

## Consequences
- CI runs fast (~50 rounds, ~2s) with meaningful coverage
- Developers can stress-test locally with higher rounds
- Each round uses random data for broad coverage
- Deterministic seed would be a future improvement
