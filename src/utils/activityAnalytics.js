import { pad, toDateKey } from '../domain/dateUtils.js';
import { round3 } from '../domain/mathUtils.js';
import { DEFAULT_ANALYTICS_DAYS } from '../config/securityConfig.js';

/**
 * Aggregate CO₂ by day for the last N days (zero-filled).
 * @param {Array} activities
 * @param {number} [days=30]
 * @returns {Array<{date:string, value:number}>}
 */
export const aggregateByDay = (activities = [], days = 30) => {
  const now = new Date();
  const map = new Map();
  for (let i = 0; i < days; i++) {
    const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i));
    map.set(toDateKey(dt), 0);
  }
  activities.forEach(a => {
    const k = toDateKey(new Date(a.date));
    if (map.has(k)) map.set(k, map.get(k) + Number(a.co2 || 0));
  });
  return Array.from(map.entries()).map(([date, value]) => ({ date, value: parseFloat(value.toFixed(3)) }));
};

/**
 * Aggregate CO₂ by week for the last N weeks.
 * @param {Array} activities
 * @param {number} [weeks=12]
 * @returns {Array<{label:string, value:number}>}
 */
export const aggregateByWeek = (activities = [], weeks = 12) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = new Date(today.getTime() - (weeks - 1 - i) * 7 * 86400000);
    const start = new Date(end.getTime() - 6 * 86400000);
    return { start, end, value: 0 };
  });
  activities.forEach(a => {
    const ad = new Date(a.date);
    for (const b of buckets) {
      if (ad >= b.start && ad <= b.end) {
        b.value += Number(a.co2 || 0);
        break;
      }
    }
  });
  return buckets.map(b => ({ label: `${b.start.getMonth()+1}/${b.start.getDate()}`, value: parseFloat(b.value.toFixed(3)) }));
};

/**
 * Aggregate CO₂ by month for the last N months (zero-filled).
 * @param {Array} activities
 * @param {number} [months=12]
 * @returns {Array<{label:string, value:number}>}
 */
export const aggregateByMonth = (activities = [], months = 12) => {
  const now = new Date();
  const map = new Map();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    map.set(key, { label: `${d.getFullYear()}/${d.getMonth()+1}`, value: 0 });
  }
  activities.forEach(a => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    if (map.has(key)) map.get(key).value += Number(a.co2 || 0);
  });
  return Array.from(map.values()).map(m => ({ label: m.label, value: parseFloat(m.value.toFixed(3)) }));
};

/**
 * Compute CO₂ breakdown by activity type, sorted descending by value.
 * @param {Array} activities
 * @returns {{total:number, list:Array<{type:string, value:number, pct:number}>}}
 */
export const breakdownByCategory = (activities = []) => {
  const map = {};
  activities.forEach(a => {
    map[a.type] = (map[a.type] || 0) + Number(a.co2 || 0);
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  const list = Object.keys(map).map(k => ({ type: k, value: parseFloat(map[k].toFixed(3)), pct: total ? +(map[k] / total * 100).toFixed(1) : 0 }));
  list.sort((a,b) => b.value - a.value);
  return { total: parseFloat(total.toFixed(3)), list };
};

const computeScore = (monthly) => {
  if (monthly <= 50) return 100;
  if (monthly >= 1000) return 0;
  return Math.round(100 - ((monthly - 50) / (1000 - 50)) * 100);
};

/**
 * Aggregate activity totals and compute a simple carbon score.
 * @param {Array} activities
 * @returns {{totals:object,score:number}}
 */
export const aggregate = (activities) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfWeek = new Date(now - 7 * dayMs);
  const startOfMonth = new Date(now - 30 * dayMs);

  let todaySum = 0, weeklySum = 0, monthlySum = 0, totalSum = 0;

  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    const d = new Date(a.date);
    const co2 = Number(a.co2) || 0;
    totalSum += co2;
    if (d >= startOfMonth) monthlySum += co2;
    if (d >= startOfWeek) weeklySum += co2;
    if (d >= startOfDay) todaySum += co2;
  }

  const totals = {
    today: round3(todaySum),
    weekly: round3(weeklySum),
    monthly: round3(monthlySum),
    total: round3(totalSum)
  };

  const score = computeScore(totals.monthly);

  return { totals, score };
};

const findBestDay = (activities) => {
  if (!activities || activities.length === 0) return null;
  const dayMap = new Map();
  activities.forEach(a => {
    const key = toDateKey(new Date(a.date));
    dayMap.set(key, (dayMap.get(key) || 0) + Number(a.co2 || 0));
  });
  const best = Array.from(dayMap.entries()).reduce((bestSoFar, [date, v]) => {
    if (bestSoFar === null) return { date, value: v };
    return v < bestSoFar.value ? { date, value: v } : bestSoFar;
  }, null);
  return best ? { date: best.date, value: parseFloat(best.value.toFixed(3)) } : null;
};

/**
 * Compute summary statistics from activity data.
 * @param {Array} activities
 * @returns {{highestEmissionCategory:string|null, totalActivities:number, avgDaily:number, bestDay:{date:string, value:number}|null}}
 */
export const summaryStats = (activities) => {
  if (!activities || activities.length === 0) {
    return { highestEmissionCategory: null, totalActivities: 0, avgDaily: 0, bestDay: null };
  }
  const breakdown = breakdownByCategory(activities);
  const days = aggregateByDay(activities, DEFAULT_ANALYTICS_DAYS);
  const total30 = days.reduce((s, d) => s + d.value, 0);

  return {
    highestEmissionCategory: breakdown.list.length > 0 ? breakdown.list[0].type : null,
    totalActivities: activities.length,
    avgDaily: parseFloat((total30 / DEFAULT_ANALYTICS_DAYS).toFixed(3)),
    bestDay: findBestDay(activities)
  };
};
