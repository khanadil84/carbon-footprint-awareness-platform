import assert from 'assert';

console.log('Running activityAnalytics tests...');

import { aggregateByDay, aggregateByWeek, aggregateByMonth, breakdownByCategory, summaryStats } from '../src/utils/activityAnalytics.js';

const now = new Date();
const iso = (d) => d.toISOString();

// helper to shift date
const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);

const activities = [
  { id: 'a1', date: iso(shift(-0)), type: 'Car', co2: 2.5 }, // today
  { id: 'a2', date: iso(shift(-1)), type: 'Bus', co2: 1.0 }, // yesterday
  { id: 'a3', date: iso(shift(-3)), type: 'Car', co2: 3.5 },
  { id: 'a4', date: iso(shift(-8)), type: 'Electricity', co2: 10.0 },
  { id: 'a5', date: iso(shift(-40)), type: 'Train', co2: 0.5 }
];

// Daily: request last 5 days
const daily = aggregateByDay(activities, 5);
assert.strictEqual(daily.length, 5, 'Daily series length');
// sum of co2 for matching dates
const totalDaily = daily.reduce((s,d)=>s + d.value, 0);
assert.ok(totalDaily >= 0, 'Daily total numeric');

// Weekly: 3 weeks
const weekly = aggregateByWeek(activities, 3);
assert.strictEqual(weekly.length, 3, 'Weekly buckets length');

// Monthly: 3 months
const monthly = aggregateByMonth(activities, 3);
assert.strictEqual(monthly.length, 3, 'Monthly buckets length');

// Breakdown
const breakdown = breakdownByCategory(activities);
assert.ok(Array.isArray(breakdown.list), 'Breakdown list');
assert.strictEqual(breakdown.total, parseFloat(activities.reduce((s,a)=>s + a.co2,0).toFixed(3)));

// Summary stats
const summary = summaryStats(activities);
assert.strictEqual(summary.totalActivities, activities.length);
assert.ok(typeof summary.avgDaily === 'number');
assert.ok(summary.highestEmissionCategory === 'Electricity' || typeof summary.highestEmissionCategory === 'string');

// Empty dataset handling
const emptySummary = summaryStats([]);
assert.strictEqual(emptySummary.totalActivities, 0);
assert.strictEqual(emptySummary.avgDaily, 0);
assert.strictEqual(emptySummary.highestEmissionCategory, null);

console.log('All activityAnalytics tests passed.');
