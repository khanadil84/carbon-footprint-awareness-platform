import { activityService } from './activityService.js';

const pad = (n) => n.toString().padStart(2, '0');

const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export const aggregateByDay = (activities, days = 30) => {
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

export const aggregateByWeek = (activities, weeks = 12) => {
  // week buckets ending on current day, each 7-day period
  const now = new Date();
  const buckets = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i*7);
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6);
    buckets.push({ start, end, key: `${toDateKey(start)}_${toDateKey(end)}`, value: 0 });
  }
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

export const aggregateByMonth = (activities, months = 12) => {
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

export const breakdownByCategory = (activities) => {
  const map = {};
  activities.forEach(a => {
    map[a.type] = (map[a.type] || 0) + Number(a.co2 || 0);
  });
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  const list = Object.keys(map).map(k => ({ type: k, value: parseFloat(map[k].toFixed(3)), pct: total ? +(map[k] / total * 100).toFixed(1) : 0 }));
  list.sort((a,b) => b.value - a.value);
  return { total: parseFloat(total.toFixed(3)), list };
};

export const summaryStats = (activities) => {
  if (!activities || activities.length === 0) return {
    highestEmissionCategory: null,
    totalActivities: 0,
    avgDaily: 0,
    bestDay: null
  };
  const breakdown = breakdownByCategory(activities);
  const highestEmissionCategory = breakdown.list.length > 0 ? breakdown.list[0].type : null;
  const totalActivities = activities.length;
  // average daily over last 30 days
  const days = aggregateByDay(activities, 30);
  const total30 = days.reduce((s, d) => s + d.value, 0);
  const avgDaily = parseFloat((total30 / 30).toFixed(3));
  // best day (lowest non-null emissions) in recorded activities
  const dayMap = new Map();
  activities.forEach(a => {
    const key = toDateKey(new Date(a.date));
    dayMap.set(key, (dayMap.get(key) || 0) + Number(a.co2 || 0));
  });
  const best = Array.from(dayMap.entries()).reduce((bestSoFar, [date, v]) => {
    if (bestSoFar === null) return { date, value: v };
    return v < bestSoFar.value ? { date, value: v } : bestSoFar;
  }, null);

  return {
    highestEmissionCategory,
    totalActivities,
    avgDaily,
    bestDay: best ? { date: best.date, value: parseFloat(best.value.toFixed(3)) } : null
  };
};

export default {
  aggregateByDay,
  aggregateByWeek,
  aggregateByMonth,
  breakdownByCategory,
  summaryStats
};
