import { pad, toDateKey, daysKey } from '../domain/dateUtils.js';
import { round3 } from '../domain/mathUtils.js';
import { DEFAULT_ANALYTICS_DAYS } from '../config/securityConfig.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';


const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

const computeScore = (monthly) => {
  if (monthly <= 50) return 100;
  if (monthly >= 1000) return 0;
  return Math.round(100 - ((monthly - 50) / (1000 - 50)) * 100);
};

export const computeFullAggregation = (activities) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * DAY_MS);
  const startOfMonth = new Date(now.getTime() - 30 * DAY_MS);

  let todaySum = 0, weeklySum = 0, monthlySum = 0, totalSum = 0;
  let busCount = 0, trainCount = 0, shortCarCount = 0;
  const typeSum = new Map();
  const dayMap = new Map();
  const monthMap = new Map();
  const dateActivityCounts = new Map();
  const byId = new Map();
  const byType = new Map();
  const byMonth = new Map();
  const byCategory = new Map();

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    const d = new Date(a.date);
    const co2 = Number(a.co2) || 0;
    totalSum += co2;

    if (d >= startOfMonth) monthlySum += co2;
    if (d >= startOfWeek) weeklySum += co2;
    if (d >= startOfDay) todaySum += co2;

    const dk = toDateKey(d);
    dayMap.set(dk, (dayMap.get(dk) || 0) + co2);

    const mk = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    monthMap.set(mk, (monthMap.get(mk) || 0) + co2);

    const prev = typeSum.get(a.type) || 0;
    typeSum.set(a.type, prev + co2);

    const ak = daysKey(d);
    dateActivityCounts.set(ak, (dateActivityCounts.get(ak) || 0) + 1);

    byId.set(a.id, a);

    const byTypeList = byType.get(a.type);
    if (byTypeList) byTypeList.push(a);
    else byType.set(a.type, [a]);

    const byMonthList = byMonth.get(mk);
    if (byMonthList) byMonthList.push(a);
    else byMonth.set(mk, [a]);

    const cat = a.type === 'Car' || a.type === 'Bus' || a.type === 'Train' || a.type === 'Flight' ? 'Travel' : a.type === 'Electricity' || a.type === 'Waste' ? 'Home' : 'Food';
    const byCatList = byCategory.get(cat);
    if (byCatList) byCatList.push(a);
    else byCategory.set(cat, [a]);

    if (a.type === 'Bus') busCount++;
    else if (a.type === 'Train') trainCount++;
    else if (a.type === 'Car' && Number(a.value) <= 2) shortCarCount++;
  }

  const result = { now, startOfDay, startOfWeek, startOfMonth, todaySum, weeklySum, monthlySum, totalSum, typeSum, dayMap, monthMap, dateActivityCounts, byId, byType, byMonth, byCategory, typeCounts: { bus: busCount, train: trainCount, carShort: shortCarCount }, totalActivities: activities.length };
  const inv = InvariantEngine.verify('aggregationConsistency', activities, result);
  if (!inv.pass) Telemetry.emit('consistency_failure');
  else Telemetry.emit('aggregation_verified');
  return result;
};

export const aggregate = (activities) => {
  const { todaySum, weeklySum, monthlySum, totalSum } = computeFullAggregation(activities);
  const totals = { today: round3(todaySum), weekly: round3(weeklySum), monthly: round3(monthlySum), total: round3(totalSum) };
  return { totals, score: computeScore(totals.monthly) };
};

export const breakdownByCategory = (activities, fullAgg = null) => {
  const agg = fullAgg || computeFullAggregation(activities);
  const total = agg.totalSum;
  const list = [];
  for (const [type, value] of agg.typeSum) {
    list.push({ type, value: round3(value), pct: total ? +((value / total) * 100).toFixed(1) : 0 });
  }
  list.sort((a, b) => b.value - a.value);
  return { total: round3(total), list };
};

export const aggregateByDay = (activities = [], days = 30, fullDayMap = null) => {
  const now = new Date();
  const map = new Map();
  for (let i = 0; i < days; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
    map.set(toDateKey(dt), 0);
  }
  const dayMap = fullDayMap || (() => {
    const dm = new Map();
    for (let i = 0; i < activities.length; i++) {
      const d = new Date(activities[i].date);
      const k = toDateKey(d);
      dm.set(k, (dm.get(k) || 0) + Number(activities[i].co2 || 0));
    }
    return dm;
  })();
  for (const [k, v] of dayMap) {
    if (map.has(k)) map.set(k, map.get(k) + v);
  }
  const result = [];
  for (const [date, value] of map) {
    result.push({ date, value: parseFloat(value.toFixed(3)) });
  }
  return result;
};

export const aggregateByWeek = (activities = [], weeks = 12) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = new Date(today.getTime() - (weeks - 1 - i) * WEEK_MS);
    return { start: new Date(end.getTime() - 6 * DAY_MS), end, value: 0 };
  });
  for (let i = 0; i < activities.length; i++) {
    const ad = new Date(activities[i].date);
    const diff = today - ad;
    if (diff < 0) continue;
    const idx = Math.floor(diff / WEEK_MS);
    if (idx < weeks) buckets[weeks - 1 - idx].value += Number(activities[i].co2 || 0);
  }
  return buckets.map(b => ({ label: `${b.start.getMonth()+1}/${b.start.getDate()}`, value: parseFloat(b.value.toFixed(3)) }));
};

export const aggregateByMonth = (activities = [], months = 12, fullMonthMap = null) => {
  const now = new Date();
  const map = new Map();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    map.set(key, { label: `${d.getFullYear()}/${d.getMonth()+1}`, value: 0 });
  }
  const monthMap = fullMonthMap || (() => {
    const mm = new Map();
    for (let i = 0; i < activities.length; i++) {
      const d = new Date(activities[i].date);
      const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
      mm.set(key, (mm.get(key) || 0) + Number(activities[i].co2 || 0));
    }
    return mm;
  })();
  for (const [k, v] of monthMap) {
    if (map.has(k)) map.get(k).value += v;
  }
  const result = [];
  for (const entry of map.values()) {
    result.push({ label: entry.label, value: parseFloat(entry.value.toFixed(3)) });
  }
  return result;
};

const findBestDay = (activities, fullDayMap = null) => {
  if (!activities || activities.length === 0) return null;
  const dayMap = fullDayMap || (() => {
    const dm = new Map();
    for (let i = 0; i < activities.length; i++) {
      const key = toDateKey(new Date(activities[i].date));
      dm.set(key, (dm.get(key) || 0) + Number(activities[i].co2 || 0));
    }
    return dm;
  })();
  let best = null;
  for (const [date, v] of dayMap) {
    if (best === null || v < best.value) best = { date, value: v };
  }
  return best ? { date: best.date, value: round3(best.value) } : null;
};

export const summaryStats = (activities, fullAgg = null) => {
  if (!activities || activities.length === 0) {
    return { highestEmissionCategory: null, totalActivities: 0, avgDaily: 0, bestDay: null };
  }
  const agg = fullAgg || computeFullAggregation(activities);
  const breakdown = breakdownByCategory(activities, agg);
  const days = aggregateByDay(activities, DEFAULT_ANALYTICS_DAYS, agg.dayMap);
  const total30 = days.reduce((s, d) => s + d.value, 0);
  return {
    highestEmissionCategory: breakdown.list.length > 0 ? breakdown.list[0].type : null,
    totalActivities: activities.length,
    avgDaily: round3(total30 / DEFAULT_ANALYTICS_DAYS),
    bestDay: findBestDay(activities, agg.dayMap)
  };
};
