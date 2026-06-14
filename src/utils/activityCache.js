import { ActivityService } from './activityService.js';
import { computeFullAggregation, breakdownByCategory, summaryStats } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { calculateCarbonScore } from './carbonScoreService.js';
import { GoalService } from './goalService.js';
import { AchievementService } from './achievementService.js';
import { toDateKey, pad } from '../domain/dateUtils.js';
import { Perf } from './perf.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';

let cachedActivities = null;
let cachedAggregation = null;
let cacheGeneration = 0;
let stale = false;
let lastAddedEntryId = null;

const listeners = new Set();
const notify = () => { for (const fn of listeners) fn(); };

const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

const isValidAgg = (agg) => agg && agg._cachedAt && agg.startOfDay && agg.startOfWeek && agg.startOfMonth;

const maybeInvalidateStaleBounds = (agg) => {
  if (!isValidAgg(agg)) return true;
  const now = new Date();
  if (!isSameDay(agg._cachedAt, now)) return true;
  if (!isSameMonth(agg._cachedAt, now)) return true;
  return false;
};

const verifyAggregationConsistency = (activities, agg) => {
  if (!agg) return true;
  let sum = 0;
  for (let i = 0; i < activities.length; i++) sum += Number(activities[i].co2) || 0;
  if (Math.abs(agg.totalSum - sum) > 0.001) {
    cachedAggregation = null;
    return false;
  }
  return true;
};

const load = () => {
  if (stale) {
    cachedActivities = null;
    cachedAggregation = null;
    stale = false;
  }
  if (cachedActivities) {
    Perf.hit('getActivities');
    if (cachedAggregation) {
      verifyAggregationConsistency(cachedActivities, cachedAggregation);
    }
    return cachedActivities;
  }
  Perf.miss('getActivities');
  Perf.start('loadActivities');
  cachedActivities = ActivityService.loadActivities();
  Perf.end('loadActivities');
  return cachedActivities;
};

const loadAgg = (activities) => {
  if (cachedAggregation && !maybeInvalidateStaleBounds(cachedAggregation)) {
    Perf.hit('getAggregation');
    return cachedAggregation;
  }
  Perf.miss('getAggregation');
  Perf.fullRecompute();
  Perf.start('computeFullAggregation');
  cachedAggregation = computeFullAggregation(activities);
  cachedAggregation._cachedAt = new Date();
  Perf.end('computeFullAggregation');
  const inv = InvariantEngine.verify('aggregationConsistency', activities, cachedAggregation);
  if (!inv.pass) { Telemetry.emit('consistency_failure'); cachedAggregation = null; return computeFullAggregation(activities); }
  Telemetry.emit('aggregation_verified');
  return cachedAggregation;
};

const recallAgg = () => {
  Perf.fullRecompute();
  Perf.start('computeFullAggregation');
  cachedAggregation = computeFullAggregation(cachedActivities);
  cachedAggregation._cachedAt = new Date();
  Perf.end('computeFullAggregation');
  const inv = InvariantEngine.verify('aggregationConsistency', cachedActivities, cachedAggregation);
  if (!inv.pass) { Telemetry.emit('consistency_failure'); cachedAggregation = computeFullAggregation(cachedActivities); cachedAggregation._cachedAt = new Date(); }
  return cachedAggregation;
};

const incrementalAdd = (agg, entry) => {
  if (!cachedActivities) return false;
  const now = new Date();
  if (!isSameDay(agg._cachedAt, now)) return false;
  if (!isSameMonth(agg._cachedAt, now)) return false;

  Perf.incremental();
  Perf.start('incrementalAdd');
  const a = entry;
  const d = new Date(a.date);
  const co2 = Number(a.co2) || 0;

  if (d >= agg.startOfDay) agg.todaySum += co2;
  if (d >= agg.startOfWeek) agg.weeklySum += co2;
  if (d >= agg.startOfMonth) agg.monthlySum += co2;
  agg.totalSum += co2;

  const dk = toDateKey(d);
  agg.dayMap.set(dk, (agg.dayMap.get(dk) || 0) + co2);

  const mk = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  agg.monthMap.set(mk, (agg.monthMap.get(mk) || 0) + co2);

  const prev = agg.typeSum.get(a.type) || 0;
  agg.typeSum.set(a.type, prev + co2);

  agg.byId.set(a.id, a);

  const byTypeList = agg.byType.get(a.type);
  if (byTypeList) byTypeList.push(a);
  else agg.byType.set(a.type, [a]);

  const byMonthList = agg.byMonth.get(mk);
  if (byMonthList) byMonthList.push(a);
  else agg.byMonth.set(mk, [a]);

  const cat = a.type === 'Car' || a.type === 'Bus' || a.type === 'Train' || a.type === 'Flight' ? 'Travel' : a.type === 'Electricity' || a.type === 'Waste' ? 'Home' : 'Food';
  const byCatList = agg.byCategory.get(cat);
  if (byCatList) byCatList.push(a);
  else agg.byCategory.set(cat, [a]);

  const ak = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  agg.dateActivityCounts.set(ak, (agg.dateActivityCounts.get(ak) || 0) + 1);

  if (a.type === 'Bus') agg.typeCounts.bus++;
  else if (a.type === 'Train') agg.typeCounts.train++;
  else if (a.type === 'Car' && Number(a.value) <= 2) agg.typeCounts.carShort++;
  agg.totalActivities++;

  Perf.end('incrementalAdd');
  return true;
};

const incrementalRemove = (agg, entry) => {
  if (!cachedActivities) return false;
  const now = new Date();
  if (!isSameDay(agg._cachedAt, now)) return false;
  if (!isSameMonth(agg._cachedAt, now)) return false;

  Perf.incremental();
  Perf.start('incrementalRemove');
  const a = entry;
  const d = new Date(a.date);
  const co2 = Number(a.co2) || 0;

  if (d >= agg.startOfDay) agg.todaySum -= co2;
  if (d >= agg.startOfWeek) agg.weeklySum -= co2;
  if (d >= agg.startOfMonth) agg.monthlySum -= co2;
  agg.totalSum -= co2;

  const dk = toDateKey(d);
  const curDay = agg.dayMap.get(dk) || 0;
  if (curDay <= co2) agg.dayMap.delete(dk);
  else agg.dayMap.set(dk, curDay - co2);

  const mk = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
  const curMonth = agg.monthMap.get(mk) || 0;
  if (curMonth <= co2) agg.monthMap.delete(mk);
  else agg.monthMap.set(mk, curMonth - co2);

  const prev = agg.typeSum.get(a.type) || 0;
  if (prev <= co2) agg.typeSum.delete(a.type);
  else agg.typeSum.set(a.type, prev - co2);

  agg.byId.delete(a.id);

  const byTypeList = agg.byType.get(a.type);
  if (byTypeList) {
    const idx = byTypeList.indexOf(a);
    if (idx >= 0) byTypeList.splice(idx, 1);
    if (byTypeList.length === 0) agg.byType.delete(a.type);
  }

  const byMonthList = agg.byMonth.get(mk);
  if (byMonthList) {
    const idx = byMonthList.indexOf(a);
    if (idx >= 0) byMonthList.splice(idx, 1);
    if (byMonthList.length === 0) agg.byMonth.delete(mk);
  }

  const cat = a.type === 'Car' || a.type === 'Bus' || a.type === 'Train' || a.type === 'Flight' ? 'Travel' : a.type === 'Electricity' || a.type === 'Waste' ? 'Home' : 'Food';
  const byCatList = agg.byCategory.get(cat);
  if (byCatList) {
    const idx = byCatList.indexOf(a);
    if (idx >= 0) byCatList.splice(idx, 1);
    if (byCatList.length === 0) agg.byCategory.delete(cat);
  }

  const ak = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  const curAc = agg.dateActivityCounts.get(ak) || 0;
  if (curAc <= 1) agg.dateActivityCounts.delete(ak);
  else agg.dateActivityCounts.set(ak, curAc - 1);

  if (a.type === 'Bus') agg.typeCounts.bus--;
  else if (a.type === 'Train') agg.typeCounts.train--;
  else if (a.type === 'Car' && Number(a.value) <= 2) agg.typeCounts.carShort--;
  agg.totalActivities--;

  Perf.end('incrementalRemove');
  return true;
};

let selectorCache = {};
let selectorGen = -1;

const memoSelector = (key, fn) => {
  const gen = cacheGeneration;
  if (gen !== selectorGen) {
    selectorCache = {};
    selectorGen = gen;
  }
  if (!(key in selectorCache)) {
    Perf.start(key);
    selectorCache[key] = fn();
    Perf.end(key);
  }
  return selectorCache[key];
};

export const ActivityCache = {
  getActivities: () => load(),

  getAggregation: () => {
    const acts = load();
    return loadAgg(acts);
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
      notify();
      return null;
    }
    if (lastAddedEntryId === entry.id) return entry;
    lastAddedEntryId = entry.id;
    if (cachedActivities) {
      cachedActivities = [entry, ...cachedActivities];
      if (cachedAggregation) {
        if (!incrementalAdd(cachedAggregation, entry)) {
          recallAgg();
        }
      }
    }
    cacheGeneration++;
    notify();
    return entry;
  },

  removeActivity: (id) => {
    const removed = cachedAggregation ? (cachedAggregation.byId.get(id) || null) : (cachedActivities ? cachedActivities.find(a => a.id === id) : null);
    let next;
    try {
      next = ActivityService.removeActivity(id);
    } catch {
      ActivityCache.invalidate();
      notify();
      return [];
    }
    if (cachedActivities) {
      cachedActivities = next;
      if (cachedAggregation && removed) {
        cachedAggregation.byId.delete(id);
        if (!incrementalRemove(cachedAggregation, removed)) {
          recallAgg();
        }
      }
    }
    cacheGeneration++;
    notify();
    return next;
  },

  clearActivities: () => {
    try {
      ActivityService.clearActivities();
    } catch {
      ActivityCache.invalidate();
      notify();
      return;
    }
    cachedActivities = [];
    cachedAggregation = null;
    lastAddedEntryId = null;
    cacheGeneration++;
    stale = false;
    notify();
  },

  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  getIndex: (name) => {
    const agg = loadAgg(load());
    return agg[name];
  },

  getRecommendations: () => {
    return memoSelector('recommendations', () => {
      const acts = load();
      const agg = loadAgg(acts);
      const breakdown = breakdownByCategory(acts, agg);
      return generateRecommendations(acts, breakdown, agg.monthlySum);
    });
  },

  getScoreAndMeta: () => {
    return memoSelector('scoreAndMeta', () => {
      const acts = load();
      const agg = loadAgg(acts);
      const breakdown = breakdownByCategory(acts, agg);
      const scoreObj = calculateCarbonScore(acts, agg, breakdown);
      InvariantEngine.verify('scoreRange', scoreObj);
      return scoreObj;
    });
  },

  getGoalProgress: (goal) => {
    const key = 'goalProgress_' + (goal && goal.targetKg ? goal.targetKg : 'none');
    return memoSelector(key, () => {
      const agg = loadAgg(load());
      return GoalService.computeProgress(null, goal, agg);
    });
  },

  getAchievements: (goal) => {
    const key = 'achievements_' + (goal && goal.targetKg ? goal.targetKg : 'none');
    return memoSelector(key, () => {
      const acts = load();
      const agg = loadAgg(acts);
      return AchievementService.evaluateAchievements(acts, goal, agg);
    });
  },

  getSummaryStats: () => {
    return memoSelector('summaryStats', () => {
      const acts = load();
      const agg = loadAgg(acts);
      return summaryStats(acts, agg);
    });
  },

  get generation() { return cacheGeneration; },

  perfReport: () => {
    const r = Perf.report();
    r.selectorCacheSize = Object.keys(selectorCache).length;
    return r;
  },

  perfReset: () => Perf.reset()
};
