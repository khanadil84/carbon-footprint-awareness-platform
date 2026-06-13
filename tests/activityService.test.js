import assert from 'assert';

// Polyfill localStorage for Node test environment
let _store = {};
globalThis.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { _store = {}; }
};

console.log('Running activityService tests...');

import { ActivityService } from '../src/utils/activityService.js';
import { aggregate } from '../src/utils/activityAnalytics.js';

// Ensure clean state
ActivityService.clearActivities();
assert.deepStrictEqual(ActivityService.loadActivities(), [], 'Should start with empty activities');

// Emission calculations
assert.strictEqual(ActivityService.calculateEmission('Car', 10), 1.92);
assert.strictEqual(ActivityService.calculateEmission('Bus', 50), parseFloat((50 * 0.105).toFixed(3)));
assert.strictEqual(ActivityService.calculateEmission('Electricity', 100), parseFloat((100 * 0.475).toFixed(3)));

// Add activity and persistence
const a1 = ActivityService.addActivity({ type: 'Car', value: 10 });
let list = ActivityService.loadActivities();
assert.strictEqual(list.length, 1, 'Should have one activity after add');
assert.strictEqual(list[0].id, a1.id);
assert.strictEqual(list[0].co2, ActivityService.calculateEmission('Car', 10));

// Add multiple activities, including an older one
const a2 = ActivityService.addActivity({ type: 'Bus', value: 20 });
// older than 10 days
const oldDate = new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString();
ActivityService.addActivity({ type: 'Train', value: 100, date: oldDate });

list = ActivityService.loadActivities();
assert.strictEqual(list.length, 3, 'Should have three activities');

// Aggregate totals
const agg = aggregate(list);
assert.ok(agg.totals.total >= 0, 'Total should be numeric');
assert.strictEqual(agg.totals.total, parseFloat(list.reduce((s, it) => s + (Number(it.co2) || 0), 0).toFixed(3)));

// Weekly should exclude the old one
assert.strictEqual(agg.totals.weekly, parseFloat([a1, a2].reduce((s, it) => s + (Number(it.co2) || 0), 0).toFixed(3)));

// Delete activity
ActivityService.removeActivity(a2.id);
list = ActivityService.loadActivities();
assert.strictEqual(list.length, 2, 'Should have two activities after delete');
assert(!list.find(x => x.id === a2.id), 'Deleted activity should be gone');

// Ensure localStorage key exists and is JSON
const raw = globalThis.localStorage.getItem('eco_activities_v1');
assert.ok(raw, 'localStorage should contain eco_activities_v1');
const parsed = JSON.parse(raw);
assert.strictEqual(Array.isArray(parsed), true, 'localStorage value should be an array');

console.log('All activityService tests passed.');
