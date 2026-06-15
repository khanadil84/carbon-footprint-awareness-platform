const counters = new Map();

export const Telemetry = {
  emit: (name) => {
    counters.set(name, (counters.get(name) || 0) + 1);
  },

  count: (name) => counters.get(name) || 0,

  counts: () => {
    const snapshot = {};
    for (const [key, value] of counters) snapshot[key] = value;
    return snapshot;
  },

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

  reset: () => { counters.clear(); },

  resetEvent: (name) => { counters.delete(name); }
};
