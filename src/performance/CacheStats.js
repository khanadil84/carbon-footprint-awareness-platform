import { Perf } from '../utils/perf.js';
import { ActivityCache } from '../utils/activityCache.js';

const estimateMapSize = (map) => {
  if (!map) return 0;
  let bytes = 0;
  for (const [key, value] of map) {
    bytes += key ? key.length * 2 : 0;
    bytes += typeof value === 'object' ? 64 : 8;
  }
  return bytes;
};

const estimateActivitySize = (activity) => {
  if (!activity) return 0;
  let bytes = 64;
  for (const key of Object.keys(activity)) {
    const val = activity[key];
    bytes += key.length * 2;
    bytes += typeof val === 'string' ? val.length * 2 : 8;
  }
  return bytes;
};

export const CacheStats = {
  snapshot() {
    const agg = ActivityCache.getAggregation();
    const activities = ActivityCache.getActivities();
    const perf = Perf.report();

    const activityBytes = activities ? activities.reduce((sum, a) => sum + estimateActivitySize(a), 0) : 0;
    const indexBytes = agg ? (
      estimateMapSize(agg.byId) +
      estimateMapSize(agg.byType) +
      estimateMapSize(agg.byMonth) +
      estimateMapSize(agg.byCategory) +
      estimateMapSize(agg.dayMap) +
      estimateMapSize(agg.monthMap)
    ) : 0;

    const hitRate = perf.cacheHits + perf.cacheMisses === 0
      ? 0
      : perf.cacheHits / (perf.cacheHits + perf.cacheMisses);

    return {
      activityCount: activities ? activities.length : 0,
      memoryEstimate: {
        activities: activityBytes,
        indexes: indexBytes,
        total: activityBytes + indexBytes,
      },
      hitRate,
      fullRecomputes: perf.fullRecomputes || 0,
      incrementalUpdates: perf.incrementalUpdates || 0,
      selectorCacheSize: perf.selectorCacheSize || 0,
    };
  }
};
