/** In-memory performance counters and labeled timers for cache/aggregation instrumentation. */
const counters = {
  cacheHits: 0,
  cacheMisses: 0,
  fullRecomputes: 0,
  incrementalUpdates: 0
};

const timers = {};

export const Perf = {
  /** Record a cache hit for an optional label. */
  hit: (label) => {
    counters.cacheHits++;
    if (label) counters[label + 'Hits'] = (counters[label + 'Hits'] || 0) + 1;
  },

  /** Record a cache miss for an optional label. */
  miss: (label) => {
    counters.cacheMisses++;
    if (label) counters[label + 'Misses'] = (counters[label + 'Misses'] || 0) + 1;
  },

  /** Record a full recompute event. */
  fullRecompute: () => { counters.fullRecomputes++; },

  /** Record an incremental update event. */
  incremental: () => { counters.incrementalUpdates++; },

  /** Start a labeled timer. */
  start: (label) => { timers[label] = performance.now(); },

  /** End a labeled timer and accumulate elapsed ms into counters. */
  end: (label) => {
    if (!timers[label]) return;
    const elapsed = performance.now() - timers[label];
    counters[label] = (counters[label] || 0) + elapsed;
    delete timers[label];
  },

  /** Return a snapshot of all counter values. */
  report: () => ({ ...counters }),

  /** Reset all counters to zero. */
  reset: () => {
    for (const key of Object.keys(counters)) counters[key] = 0;
  }
};
