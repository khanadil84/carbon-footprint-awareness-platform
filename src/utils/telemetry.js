const counters = new Map();

const ensure = (name) => { if (!counters.has(name)) counters.set(name, 0); };

export const Telemetry = {
  emit: (name) => {
    ensure(name);
    counters.set(name, counters.get(name) + 1);
  },

  count: (name) => counters.get(name) || 0,

  counts: () => {
    const out = {};
    for (const [k, v] of counters) out[k] = v;
    return out;
  },

  summary: () => {
    const c = Telemetry.counts();
    return {
      totalEvents: Object.values(c).reduce((s, v) => s + v, 0),
      events: c,
      byCategory: {
        storage: (c.storage_corruption_detected || 0) + (c.storage_repaired || 0),
        cache: (c.cache_invalidated || 0) + (c.cache_rebuilt || 0),
        retry: (c.retry_attempt || 0) + (c.retry_success || 0) + (c.retry_failed || 0),
        recovery: c.recovery_complete || 0,
        invariant: (c.invariant_failure || 0) + (c.invariant_pass || 0),
        selfHeal: c.self_heal_repair || 0
      }
    };
  },

  reset: () => { counters.clear(); },

  resetEvent: (name) => { counters.delete(name); }
};
