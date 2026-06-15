import { Perf } from '../utils/perf.js';

const sliceHistories = new Map();

export const PerformanceMonitor = {
  start(name) {
    Perf.start(name);
  },

  end(name) {
    Perf.end(name);
    const stats = this.getStats(name);
    return stats ? stats.avg : undefined;
  },

  getStats(name) {
    const history = sliceHistories.get(name);
    if (!history || history.length === 0) return null;

    let sum = 0;
    let minValue = Infinity;
    let maxValue = -Infinity;

    for (const value of history) {
      sum += value;
      if (value < minValue) minValue = value;
      if (value > maxValue) maxValue = value;
    }

    return {
      count: history.length,
      total: sum,
      avg: sum / history.length,
      min: minValue,
      max: maxValue
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
