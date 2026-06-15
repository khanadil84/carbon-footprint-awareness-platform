import { pad, toDateKey, daysKey } from '../domain/dateUtils.js';
import { round3 } from '../domain/mathUtils.js';
import { DEFAULT_ANALYTICS_DAYS } from '../config/securityConfig.js';
import { getCategoryForType } from '../config/constants.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';

const DAY_MS = 86400000;
const WEEK_MS = 7 * DAY_MS;

const computeCarbonScore = (monthlyEmissions) => {
  if (monthlyEmissions <= 50) return 100;
  if (monthlyEmissions >= 1000) return 0;
  return Math.round(100 - ((monthlyEmissions - 50) / (1000 - 50)) * 100);
};

const updateTypeCounts = (counts, activity) => {
  if (activity.type === 'Bus') counts.bus++;
  else if (activity.type === 'Train') counts.train++;
  else if (activity.type === 'Car' && Number(activity.value) <= 2) counts.carShort++;
};

const buildAggregationIndex = (map, key, value) => {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
};

export const computeFullAggregation = (activities) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getTime() - 7 * DAY_MS);
  const startOfMonth = new Date(now.getTime() - 30 * DAY_MS);

  let todaySum = 0, weeklySum = 0, monthlySum = 0, totalSum = 0;
  const typeCounts = { bus: 0, train: 0, carShort: 0 };
  const typeSum = new Map();
  const dayMap = new Map();
  const monthMap = new Map();
  const dateActivityCounts = new Map();
  const byId = new Map();
  const byType = new Map();
  const byMonth = new Map();
  const byCategory = new Map();

  for (const record of activities) {
    const date = new Date(record.date);
    const co2 = Number(record.co2) || 0;
    totalSum += co2;

    if (date >= startOfMonth) monthlySum += co2;
    if (date >= startOfWeek) weeklySum += co2;
    if (date >= startOfDay) todaySum += co2;

    const dateKey = toDateKey(date);
    dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + co2);

    const monthKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + co2);

    const previousTotal = typeSum.get(record.type) || 0;
    typeSum.set(record.type, previousTotal + co2);

    const activityDateKey = daysKey(date);
    dateActivityCounts.set(activityDateKey, (dateActivityCounts.get(activityDateKey) || 0) + 1);

    byId.set(record.id, record);
    buildAggregationIndex(byType, record.type, record);
    buildAggregationIndex(byMonth, monthKey, record);
    buildAggregationIndex(byCategory, getCategoryForType(record.type), record);
    updateTypeCounts(typeCounts, record);
  }

  const result = {
    now, startOfDay, startOfWeek, startOfMonth,
    todaySum, weeklySum, monthlySum, totalSum,
    typeSum, dayMap, monthMap, dateActivityCounts,
    byId, byType, byMonth, byCategory,
    typeCounts,
    totalActivities: activities.length
  };

  const invariantResult = InvariantEngine.verify('aggregationConsistency', activities, result);
  if (!invariantResult.pass) Telemetry.emit('consistency_failure');
  else Telemetry.emit('aggregation_verified');

  return result;
};

export const aggregate = (activities) => {
  const { todaySum, weeklySum, monthlySum, totalSum } = computeFullAggregation(activities);
  const totals = {
    today: round3(todaySum),
    weekly: round3(weeklySum),
    monthly: round3(monthlySum),
    total: round3(totalSum)
  };
  return { totals, score: computeCarbonScore(totals.monthly) };
};

export const breakdownByCategory = (activities, fullAggregation = null) => {
  const aggregation = fullAggregation || computeFullAggregation(activities);
  const total = aggregation.totalSum;
  const breakdown = [];
  for (const [type, value] of aggregation.typeSum) {
    breakdown.push({
      type,
      value: round3(value),
      pct: total ? +((value / total) * 100).toFixed(1) : 0
    });
  }
  breakdown.sort((a, b) => b.value - a.value);
  return { total: round3(total), list: breakdown };
};

const buildDayMap = (activities) => {
  const map = new Map();
  for (const record of activities) {
    const key = toDateKey(new Date(record.date));
    map.set(key, (map.get(key) || 0) + Number(record.co2 || 0));
  }
  return map;
};

const buildMonthMap = (activities) => {
  const map = new Map();
  for (const record of activities) {
    const date = new Date(record.date);
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    map.set(key, (map.get(key) || 0) + Number(record.co2 || 0));
  }
  return map;
};

export const aggregateByDay = (activities = [], days = 30, existingDayMap = null) => {
  const now = new Date();
  const dateValues = new Map();

  for (let i = 0; i < days; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
    dateValues.set(toDateKey(date), 0);
  }

  const dayMap = existingDayMap || buildDayMap(activities);

  for (const [key, value] of dayMap) {
    if (dateValues.has(key)) dateValues.set(key, dateValues.get(key) + value);
  }

  const result = [];
  for (const [date, value] of dateValues) {
    result.push({ date, value: parseFloat(value.toFixed(3)) });
  }
  return result;
};

export const aggregateByWeek = (activities = [], weeks = 12) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const end = new Date(today.getTime() - (weeks - 1 - index) * WEEK_MS);
    return { start: new Date(end.getTime() - 6 * DAY_MS), end, value: 0 };
  });

  for (const record of activities) {
    const activityDate = new Date(record.date);
    const diffFromToday = today - activityDate;
    if (diffFromToday < 0) continue;
    const bucketIndex = Math.floor(diffFromToday / WEEK_MS);
    if (bucketIndex < weeks) {
      buckets[weeks - 1 - bucketIndex].value += Number(record.co2 || 0);
    }
  }

  return buckets.map(bucket => ({
    label: `${bucket.start.getMonth() + 1}/${bucket.start.getDate()}`,
    value: parseFloat(bucket.value.toFixed(3))
  }));
};

export const aggregateByMonth = (activities = [], months = 12, existingMonthMap = null) => {
  const now = new Date();
  const monthValues = new Map();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    monthValues.set(key, { label: `${date.getFullYear()}/${date.getMonth() + 1}`, value: 0 });
  }

  const monthMap = existingMonthMap || buildMonthMap(activities);

  for (const [key, value] of monthMap) {
    if (monthValues.has(key)) monthValues.get(key).value += value;
  }

  const result = [];
  for (const entry of monthValues.values()) {
    result.push({ label: entry.label, value: parseFloat(entry.value.toFixed(3)) });
  }
  return result;
};

const findBestDay = (activities, existingDayMap = null) => {
  if (!activities || activities.length === 0) return null;
  const dayMap = existingDayMap || buildDayMap(activities);
  let best = null;
  for (const [date, value] of dayMap) {
    if (best === null || value < best.value) best = { date, value };
  }
  return best ? { date: best.date, value: round3(best.value) } : null;
};

export const summaryStats = (activities, fullAggregation = null) => {
  if (!activities || activities.length === 0) {
    return { highestEmissionCategory: null, totalActivities: 0, avgDaily: 0, bestDay: null };
  }
  const aggregation = fullAggregation || computeFullAggregation(activities);
  const breakdown = breakdownByCategory(activities, aggregation);
  const days = aggregateByDay(activities, DEFAULT_ANALYTICS_DAYS, aggregation.dayMap);
  const total30 = days.reduce((sum, day) => sum + day.value, 0);
  return {
    highestEmissionCategory: breakdown.list.length > 0 ? breakdown.list[0].type : null,
    totalActivities: activities.length,
    avgDaily: round3(total30 / DEFAULT_ANALYTICS_DAYS),
    bestDay: findBestDay(activities, aggregation.dayMap)
  };
};
