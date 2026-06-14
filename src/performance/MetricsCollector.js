import { Perf } from '../utils/perf.js';

const metricCounters = new Map();
const metricValues = new Map();
const tickHistory = [];

export const MetricsCollector = {
  increment(name) {
    metricCounters.set(name, (metricCounters.get(name) || 0) + 1);
  },

  record(name, value) {
    if (!metricValues.has(name)) {
      metricValues.set(name, []);
    }
    const values = metricValues.get(name);
    values.push(value);
    if (values.length > 100) {
      values.shift();
    }
  },

  tick() {
    const snapshot = {
      timestamp: Date.now(),
      perf: Perf.report(),
      metrics: Object.fromEntries(metricCounters),
    };
    tickHistory.push(snapshot);
    if (tickHistory.length > 60) {
      tickHistory.shift();
    }
  },

  getHistory() {
    return tickHistory;
  },

  getCacheHitRate() {
    const r = Perf.report();
    const hits = r.cacheHits || 0;
    const misses = r.cacheMisses || 0;
    const total = hits + misses;
    return total === 0 ? 0 : hits / total;
  },

  getSelectorReuseRate() {
    const r = Perf.report();
    const selectors = r.selectorCacheSize || 0;
    return selectors;
  },

  report() {
    const perf = Perf.report();
    const hitRate = this.getCacheHitRate();
    const total = (perf.cacheHits || 0) + (perf.cacheMisses || 0);
    return {
      cache: {
        hits: perf.cacheHits || 0,
        misses: perf.cacheMisses || 0,
        total,
        hitRate,
        fullRecomputes: perf.fullRecomputes || 0,
        incrementalUpdates: perf.incrementalUpdates || 0,
      },
      selectors: {
        cached: this.getSelectorReuseRate(),
      },
      counters: Object.fromEntries(metricCounters),
    };
  },

  reset() {
    metricCounters.clear();
    metricValues.clear();
    tickHistory.length = 0;
  }
};
