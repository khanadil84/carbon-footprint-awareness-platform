# ADR-002: Invariant Detection vs Self-Healing — Separation of Concerns

## Status
Accepted

## Context
The system needed both invariant enforcement and data repair. Two approaches were considered:
1. **Tightly coupled**: Invariant engine auto-corrects any violation it finds.
2. **Separation of concerns**: Invariant engine **detects and reports**, self-healing engine **repairs**, telemetry engine **records**.

## Decision
Adopt **separation of concerns**:

| Component | Responsibility | Example |
|-----------|---------------|---------|
| `InvariantEngine` | Detect violations, emit telemetry | score out of range → `invariant_failure` |
| `SelfHealing` | Repair malformed data deterministically | missing co2 → recompute from type × value |
| `Telemetry` | Record every event for audit | `{ storage_repaired: 3, invariant_failure: 1 }` |

**Exception**: Aggregation inconsistency in `activityCache` triggers automatic recompute (because recompute is the natural fix).

## Consequences
- Clear ownership: each engine has one job
- Easier testing: mock one engine at a time
- Audit trail: detection + repair are independently observable
- No risk of self-healing masking invariant violations
