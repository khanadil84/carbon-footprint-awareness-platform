const counters = {
  cacheHits: 0,
  cacheMisses: 0,
  fullRecomputes: 0,
  incrementalUpdates: 0
};

const timers = {};

export const Perf = {
  hit: (label) => {
    counters.cacheHits++;
    if (label) counters[label + 'Hits'] = (counters[label + 'Hits'] || 0) + 1;
  },

  miss: (label) => {
    counters.cacheMisses++;
    if (label) counters[label + 'Misses'] = (counters[label + 'Misses'] || 0) + 1;
  },

  fullRecompute: () => { counters.fullRecomputes++; },

  incremental: () => { counters.incrementalUpdates++; },

  start: (label) => { timers[label] = performance.now(); },

  end: (label) => {
    if (!timers[label]) return;
    const elapsed = performance.now() - timers[label];
    counters[label] = (counters[label] || 0) + elapsed;
    delete timers[label];
  },

  report: () => ({ ...counters }),

  reset: () => {
    for (const key of Object.keys(counters)) counters[key] = 0;
  }
};
