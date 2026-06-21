import { ActivityService } from './activityService.js';
import { computeFullAggregation, breakdownByCategory, summaryStats } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { calculateCarbonScore } from './carbonScoreService.js';
import { GoalService } from './goalService.js';
import { AchievementService } from './achievementService.js';
import { toDateKey, pad } from '../domain/dateUtils.js';
import { getCategoryForType } from '../config/constants.js';
import { updateTypeCounts } from './metrics.js';
import { Perf } from './perf.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';

let cachedActivities = null;
let cachedAggregation = null;
let cacheGeneration = 0;
let stale = false;
let lastAddedEntryId = null;

const subscribers = new Set();
const notifySubscribers = () => { for (const handler of subscribers) handler(); };

let selectorCache = {};
let selectorGeneration = -1;

const isSameDay = (date1, date2) =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();

const isSameMonth = (date1, date2) =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth();

const isValidAggregation = (aggregation) =>
  aggregation && aggregation._cachedAt && aggregation.startOfDay &&
  aggregation.startOfWeek && aggregation.startOfMonth;

const isAggregationStaleByTime = (aggregation) => {
  if (!isValidAggregation(aggregation)) return true;
  const now = new Date();
  return !isSameDay(aggregation._cachedAt, now) || !isSameMonth(aggregation._cachedAt, now);
};

const recomputeAggregation = () => {
  Perf.fullRecompute();
  Perf.start('computeFullAggregation');
  const aggregation = computeFullAggregation(cachedActivities);
  aggregation._cachedAt = new Date();
  Perf.end('computeFullAggregation');
  const invariantResult = InvariantEngine.verify('aggregationConsistency', cachedActivities, aggregation);
  if (!invariantResult.pass) {
    Telemetry.emit('consistency_failure');
    const recomputed = computeFullAggregation(cachedActivities);
    recomputed._cachedAt = new Date();
    return recomputed;
  }
  return aggregation;
};

const updateIndexEntry = (map, key, entry, operation) => {
  if (operation === 'add') {
    const existing = map.get(key);
    if (existing) existing.push(entry);
    else map.set(key, [entry]);
  } else {
    const existing = map.get(key);
    if (!existing) return;
    const index = existing.indexOf(entry);
    if (index >= 0) existing.splice(index, 1);
    if (existing.length === 0) map.delete(key);
  }
};

const updateNumericIndex = (map, key, delta) => {
  const current = map.get(key) || 0;
  const newValue = current + delta;
  if (newValue <= 0) map.delete(key);
  else map.set(key, newValue);
};

const updateAggregationSums = (aggregation, entry, multiplier) => {
  const date = new Date(entry.date);
  const co2 = Number(entry.co2) || 0;
  const delta = co2 * multiplier;

  if (date >= aggregation.startOfDay) aggregation.todaySum += delta;
  if (date >= aggregation.startOfWeek) aggregation.weeklySum += delta;
  if (date >= aggregation.startOfMonth) aggregation.monthlySum += delta;
  aggregation.totalSum += delta;

  updateNumericIndex(aggregation.dayMap, toDateKey(date), delta);

  const monthKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  updateNumericIndex(aggregation.monthMap, monthKey, delta);

  const previousTypeSum = aggregation.typeSum.get(entry.type) || 0;
  const newTypeSum = previousTypeSum + delta;
  if (newTypeSum <= 0) aggregation.typeSum.delete(entry.type);
  else aggregation.typeSum.set(entry.type, newTypeSum);

  const activityKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  updateNumericIndex(aggregation.dateActivityCounts, activityKey, delta > 0 ? 1 : -1);
};

const updateTypeCounters = (aggregation, entry, increment) => {
  const change = increment ? 1 : -1;
  updateTypeCounts(aggregation.typeCounts, entry, change);
  aggregation.totalActivities += change;
};

const incrementallyUpdate = (aggregation, entry, operation) => {
  if (!cachedActivities) return false;
  const now = new Date();
  if (!isSameDay(aggregation._cachedAt, now)) return false;
  if (!isSameMonth(aggregation._cachedAt, now)) return false;

  const isAdd = operation === 'add';
  const multiplier = isAdd ? 1 : -1;

  Perf.incremental();
  Perf.start('incremental' + (isAdd ? 'Add' : 'Remove'));

  updateAggregationSums(aggregation, entry, multiplier);
  updateTypeCounters(aggregation, entry, isAdd);

  const date = new Date(entry.date);
  const monthKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
  const category = getCategoryForType(entry.type);

  if (isAdd) {
    aggregation.byId.set(entry.id, entry);
    updateIndexEntry(aggregation.byType, entry.type, entry, 'add');
    updateIndexEntry(aggregation.byMonth, monthKey, entry, 'add');
    updateIndexEntry(aggregation.byCategory, category, entry, 'add');
  } else {
    aggregation.byId.delete(entry.id);
    updateIndexEntry(aggregation.byType, entry.type, entry, 'remove');
    updateIndexEntry(aggregation.byMonth, monthKey, entry, 'remove');
    updateIndexEntry(aggregation.byCategory, category, entry, 'remove');
  }

  Perf.end('incremental' + (isAdd ? 'Add' : 'Remove'));
  return true;
};

const loadActivities = () => {
  if (stale) {
    cachedActivities = null;
    cachedAggregation = null;
    stale = false;
  }
  if (cachedActivities) {
    Perf.hit('getActivities');
    if (cachedAggregation) {
      const computedSum = cachedActivities.reduce((sum, a) => sum + (Number(a.co2) || 0), 0);
      if (Math.abs(cachedAggregation.totalSum - computedSum) > 0.001) {
        cachedAggregation = null;
      }
    }
    return cachedActivities;
  }
  Perf.miss('getActivities');
  Perf.start('loadActivities');
  cachedActivities = ActivityService.loadActivities();
  Perf.end('loadActivities');
  return cachedActivities;
};

const loadAggregation = () => {
  if (cachedAggregation && !isAggregationStaleByTime(cachedAggregation)) {
    Perf.hit('getAggregation');
    return cachedAggregation;
  }
  Perf.miss('getAggregation');
  cachedAggregation = recomputeAggregation();
  Telemetry.emit('aggregation_verified');
  return cachedAggregation;
};

const memoizedSelector = (key, computeFn) => {
  const currentGeneration = cacheGeneration;
  if (currentGeneration !== selectorGeneration) {
    selectorCache = {};
    selectorGeneration = currentGeneration;
  }
  if (!(key in selectorCache)) {
    Perf.start(key);
    selectorCache[key] = computeFn();
    Perf.end(key);
  }
  return selectorCache[key];
};

/** Central activity cache providing in-memory caching over ActivityService,
 *  memoized selectors, incremental aggregation updates, and subscriber
 *  notifications. */
export const ActivityCache = {
  getActivities: () => loadActivities(),

  getAggregation: () => {
    loadActivities();
    return loadAggregation();
  },

  invalidate: () => {
    stale = true;
    cacheGeneration++;
  },

  addActivity: (data) => {
    let entry;
    try {
      entry = ActivityService.addActivity(data);
    } catch {
      ActivityCache.invalidate();
      notifySubscribers();
      return null;
    }
    if (lastAddedEntryId === entry.id) return entry;
    lastAddedEntryId = entry.id;
    if (cachedActivities) {
      cachedActivities = [entry, ...cachedActivities];
      if (cachedAggregation) {
        if (!incrementallyUpdate(cachedAggregation, entry, 'add')) {
          cachedAggregation = recomputeAggregation();
        }
      }
    }
    cacheGeneration++;
    notifySubscribers();
    return entry;
  },

  removeActivity: (id) => {
    const removed = cachedAggregation
      ? (cachedAggregation.byId.get(id) || null)
      : (cachedActivities ? cachedActivities.find(a => a.id === id) : null);
    let next;
    try {
      next = ActivityService.removeActivity(id);
    } catch {
      ActivityCache.invalidate();
      notifySubscribers();
      return [];
    }
    if (cachedActivities) {
      cachedActivities = next;
      if (cachedAggregation && removed) {
        if (!incrementallyUpdate(cachedAggregation, removed, 'remove')) {
          cachedAggregation = recomputeAggregation();
        }
      }
    }
    cacheGeneration++;
    notifySubscribers();
    return next;
  },

  clearActivities: () => {
    try {
      ActivityService.clearActivities();
    } catch {
      ActivityCache.invalidate();
      notifySubscribers();
      return;
    }
    cachedActivities = [];
    cachedAggregation = null;
    lastAddedEntryId = null;
    cacheGeneration++;
    stale = false;
    notifySubscribers();
  },

  subscribe: (handler) => {
    subscribers.add(handler);
    return () => subscribers.delete(handler);
  },

  getIndex: (name) => {
    const aggregation = loadAggregation();
    return aggregation[name];
  },

  getRecommendations: () => {
    return memoizedSelector('recommendations', () => {
      const activities = loadActivities();
      const aggregation = loadAggregation();
      const breakdown = breakdownByCategory(activities, aggregation);
      return generateRecommendations(activities, breakdown, aggregation.monthlySum);
    });
  },

  getScoreAndMeta: () => {
    return memoizedSelector('scoreAndMeta', () => {
      const activities = loadActivities();
      const aggregation = loadAggregation();
      const breakdown = breakdownByCategory(activities, aggregation);
      const scoreObject = calculateCarbonScore(activities, aggregation, breakdown);
      InvariantEngine.verify('scoreRange', scoreObject);
      return scoreObject;
    });
  },

  getGoalProgress: (goal) => {
    const selectorKey = 'goalProgress_' + (goal && goal.targetKg ? goal.targetKg : 'none');
    return memoizedSelector(selectorKey, () => {
      const aggregation = loadAggregation();
      return GoalService.computeProgress(null, goal, aggregation);
    });
  },

  getAchievements: (goal) => {
    const selectorKey = 'achievements_' + (goal && goal.targetKg ? goal.targetKg : 'none');
    return memoizedSelector(selectorKey, () => {
      const activities = loadActivities();
      const aggregation = loadAggregation();
      return AchievementService.evaluateAchievements(activities, goal, aggregation);
    });
  },

  getSummaryStats: () => {
    return memoizedSelector('summaryStats', () => {
      const activities = loadActivities();
      const aggregation = loadAggregation();
      return summaryStats(activities, aggregation);
    });
  },

  get generation() { return cacheGeneration; },

  perfReport: () => {
    const report = Perf.report();
    report.selectorCacheSize = Object.keys(selectorCache).length;
    return report;
  },

  perfReset: () => Perf.reset()
};
