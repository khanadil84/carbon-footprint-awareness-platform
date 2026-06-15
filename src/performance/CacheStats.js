import { Perf } from '../utils/perf.js';
import { ActivityCache } from '../utils/activityCache.js';

const estimateMapMemory = (map) => {
  if (!map) return 0;
  let bytes = 0;
  for (const [key, value] of map) {
    bytes += key ? key.length * 2 : 0;
    bytes += typeof value === 'object' ? 64 : 8;
  }
  return bytes;
};

const estimateActivityMemory = (activity) => {
  if (!activity) return 0;
  let bytes = 64;
  for (const key of Object.keys(activity)) {
    const value = activity[key];
    bytes += key.length * 2;
    bytes += typeof value === 'string' ? value.length * 2 : 8;
  }
  return bytes;
};

export const CacheStats = {
  snapshot() {
    const aggregation = ActivityCache.getAggregation();
    const activities = ActivityCache.getActivities();
    const perf = Perf.report();

    const activityMemory = activities
      ? activities.reduce((sum, activity) => sum + estimateActivityMemory(activity), 0)
      : 0;

    const indexMemory = aggregation ? (
      estimateMapMemory(aggregation.byId) +
      estimateMapMemory(aggregation.byType) +
      estimateMapMemory(aggregation.byMonth) +
      estimateMapMemory(aggregation.byCategory) +
      estimateMapMemory(aggregation.dayMap) +
      estimateMapMemory(aggregation.monthMap)
    ) : 0;

    const totalRequests = perf.cacheHits + perf.cacheMisses;
    const hitRate = totalRequests === 0 ? 0 : perf.cacheHits / totalRequests;

    return {
      activityCount: activities ? activities.length : 0,
      memoryEstimate: {
        activities: activityMemory,
        indexes: indexMemory,
        total: activityMemory + indexMemory,
      },
      hitRate,
      fullRecomputes: perf.fullRecomputes || 0,
      incrementalUpdates: perf.incrementalUpdates || 0,
      selectorCacheSize: perf.selectorCacheSize || 0,
    };
  }
};
