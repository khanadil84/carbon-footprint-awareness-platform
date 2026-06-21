/** In-memory event counter for telemetry and monitoring. */
const counters = new Map();

export const Telemetry = {
  /** Increment a named counter by 1. */
  emit: (name) => {
    counters.set(name, (counters.get(name) || 0) + 1);
  },

  /** Read the current count for a named event. */
  count: (name) => counters.get(name) || 0,

  /** Snapshot of all counters as a plain object. */
  counts: () => {
    const snapshot = {};
    for (const [key, value] of counters) snapshot[key] = value;
    return snapshot;
  },

  /** Aggregated summary grouped by category. */
  summary: () => {
    const events = Telemetry.counts();
    return {
      totalEvents: Object.values(events).reduce((sum, count) => sum + count, 0),
      events,
      byCategory: {
        storage: (events.storage_corruption_detected || 0) + (events.storage_repaired || 0),
        cache: (events.cache_invalidated || 0) + (events.cache_rebuilt || 0),
        retry: (events.retry_attempt || 0) + (events.retry_success || 0) + (events.retry_failed || 0),
        recovery: events.recovery_complete || 0,
        invariant: (events.invariant_failure || 0) + (events.invariant_pass || 0),
        selfHeal: events.self_heal_repair || 0
      }
    };
  },

  /** Clear all counters. */
  reset: () => { counters.clear(); },

  /** Reset a single named counter. */
  resetEvent: (name) => { counters.delete(name); }
};
