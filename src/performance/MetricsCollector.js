import { Perf } from '../utils/perf.js';

const MAX_VALUES = 100;
const MAX_TICKS = 60;

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
    if (values.length > MAX_VALUES) {
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
    if (tickHistory.length > MAX_TICKS) {
      tickHistory.shift();
    }
  },

  getHistory() {
    return tickHistory;
  },

  getCacheHitRate() {
    const report = Perf.report();
    const hits = report.cacheHits || 0;
    const misses = report.cacheMisses || 0;
    const total = hits + misses;
    return total === 0 ? 0 : hits / total;
  },

  getSelectorCacheSize() {
    const report = Perf.report();
    return report.selectorCacheSize || 0;
  },

  report() {
    const perf = Perf.report();
    const hits = perf.cacheHits || 0;
    const misses = perf.cacheMisses || 0;
    return {
      cache: {
        hits,
        misses,
        total: hits + misses,
        hitRate: this.getCacheHitRate(),
        fullRecomputes: perf.fullRecomputes || 0,
        incrementalUpdates: perf.incrementalUpdates || 0,
      },
      selectors: {
        cached: this.getSelectorCacheSize(),
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
