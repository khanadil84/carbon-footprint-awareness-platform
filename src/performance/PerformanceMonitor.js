import { Perf } from '../utils/perf.js';

const sliceHistories = new Map();
const MAX_HISTORY = 100;

const record = (name, duration) => {
  if (!sliceHistories.has(name)) {
    sliceHistories.set(name, []);
  }
  const history = sliceHistories.get(name);
  history.push(duration);
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
};

export const PerformanceMonitor = {
  start(name) {
    Perf.start(name);
  },

  end(name) {
    const duration = Perf.end(name);
    if (duration !== undefined) {
      record(name, duration);
    }
    return duration;
  },

  getStats(name) {
    const history = sliceHistories.get(name);
    if (!history || history.length === 0) return null;
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < history.length; i++) {
      const v = history[i];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return {
      count: history.length,
      total: sum,
      avg: sum / history.length,
      min,
      max
    };
  },

  report() {
    const slices = {};
    for (const [name] of sliceHistories) {
      slices[name] = this.getStats(name);
    }
    return slices;
  },

  reset() {
    sliceHistories.clear();
  }
};
