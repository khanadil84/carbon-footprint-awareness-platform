# ADR-001: Self-Healing Repair Over Silent Filtering

## Status
Accepted

## Context
When `loadActivities` encounters records with missing fields (e.g., `id`, `co2`, `date`), the previous behavior silently dropped (filtered out) those records. This caused data loss from:
- Partial writes (crash during `saveActivities`)
- Corrupted localStorage entries
- Migration gaps between schema versions
- Race conditions in concurrent tabs

## Decision
Replace silent filtering with deterministic self-healing repair:

| Missing Field | Repair Strategy |
|---------------|-----------------|
| `id` | Generate a new UUID (`crypto.randomUUID()`) |
| `co2` | Recompute from `type × value` using known emission factors |
| `date` | Use current ISO timestamp (`new Date().toISOString()`) |
| `type` | Set to `'transport'` (most common default) |
| `value` | Set to `0` |

Repair is applied **before** invariant verification, so invariants see clean data.

## Consequences
- One existing test assertion updated: "old format without co2" now expects 1 record (repaired) instead of 0 (filtered)
- No data loss from partial writes or storage corruption
- Users see repaired records instead of silently missing entries
- Repair is deterministic and auditable via telemetry (`storage_repaired`, `recovery_complete` events)
