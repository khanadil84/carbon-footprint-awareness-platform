import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage, setStorageItem } from './lib/storageMock.js';
import './lib/storageMock.js';
import { STORAGE_KEYS } from '../src/config/securityConfig.js';

describe('ActivityService', () => {
  let ActivityService;

  before(async () => {
    const mod = await import('../src/utils/activityService.js');
    ActivityService = mod.ActivityService;
  });

  beforeEach(() => { resetStorage(); });

  describe('loadActivities', () => {
    it('returns empty array when no data', () => {
      const r = ActivityService.loadActivities();
      assert.deepEqual(r, []);
    });
    it('returns empty array for non-array data', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, '"string"');
      assert.deepEqual(ActivityService.loadActivities(), []);
    });
    it('filters out records missing required fields', () => {
      const data = JSON.stringify([
        { id: 'a', date: '2024-01-01', type: 'Car', value: 10, co2: 1.92 },
        { id: 'b', date: '2024-01-01', type: 'Plane', value: 10, co2: 2 },
        { id: 'c', date: '2024-01-01', type: 'Car' }
      ]);
      setStorageItem(STORAGE_KEYS.ACTIVITIES, data);
      const r = ActivityService.loadActivities();
      // c missing value and co2; Plane is a valid string so passes isValidRecord
      // But loadActivities uses activity.isValidRecord which only checks field types
      assert.strictEqual(r.length, 2);
    });
    it('returns valid activities', () => {
      const acts = [
        { id: 'a', date: '2024-01-01', type: 'Car', value: 10, co2: 1.92 },
        { id: 'b', date: '2024-01-02', type: 'Bus', value: 5, co2: 0.53 }
      ];
      setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(acts));
      const r = ActivityService.loadActivities();
      assert.strictEqual(r.length, 2);
    });
  });

  describe('saveActivities (module-level)', () => {
    it('is not exposed on ActivityService (saveActivities is internal)', () => {
      // saveActivities is module-private, tested via addActivity
      const entry = ActivityService.addActivity({ type: 'Car', value: 10 });
      assert.ok(entry.id);
      const loaded = ActivityService.loadActivities();
      assert.strictEqual(loaded.length, 1);
    });
  });

  describe('addActivity', () => {
    it('throws for invalid type', () => {
      assert.throws(() => ActivityService.addActivity({ type: 'Plane', value: 10 }), /Invalid activity type/);
    });
    it('throws for invalid value', () => {
      assert.throws(() => ActivityService.addActivity({ type: 'Car', value: 0 }), /Invalid activity value/);
    });
    it('throws for null type', () => {
      assert.throws(() => ActivityService.addActivity({ type: null, value: 10 }), /Invalid activity type/);
    });
    it('throws for negative value', () => {
      assert.throws(() => ActivityService.addActivity({ type: 'Car', value: -5 }), /Invalid activity value/);
    });
    it('creates entry with computed co2', () => {
      const entry = ActivityService.addActivity({ type: 'Car', value: 10 });
      assert.ok(entry.id);
      assert.strictEqual(entry.type, 'Car');
      assert.strictEqual(entry.value, 10);
      assert.ok(entry.co2 > 0);
      assert.ok(entry.date);
    });
    it('adds to storage', () => {
      ActivityService.addActivity({ type: 'Bus', value: 20 });
      const loaded = ActivityService.loadActivities();
      assert.strictEqual(loaded.length, 1);
      assert.strictEqual(loaded[0].type, 'Bus');
    });
    it('prepends new entries', () => {
      ActivityService.addActivity({ type: 'Car', value: 10 });
      ActivityService.addActivity({ type: 'Bus', value: 5 });
      const loaded = ActivityService.loadActivities();
      assert.strictEqual(loaded.length, 2);
      assert.strictEqual(loaded[0].type, 'Bus');
    });
  });

  describe('removeActivity', () => {
    it('returns empty array when no activities', () => {
      const r = ActivityService.removeActivity('nonexistent');
      assert.deepEqual(r, []);
    });
    it('removes by id', () => {
      const e1 = ActivityService.addActivity({ type: 'Car', value: 10 });
      ActivityService.addActivity({ type: 'Bus', value: 5 });
      const r = ActivityService.removeActivity(e1.id);
      assert.strictEqual(r.length, 1);
      assert.strictEqual(r[0].type, 'Bus');
    });
    it('returns unchanged if id not found', () => {
      ActivityService.addActivity({ type: 'Car', value: 10 });
      const r = ActivityService.removeActivity('bad-id');
      assert.strictEqual(r.length, 1);
    });
  });

  describe('clearActivities', () => {
    it('clears all activities', () => {
      ActivityService.addActivity({ type: 'Car', value: 10 });
      ActivityService.clearActivities();
      assert.deepEqual(ActivityService.loadActivities(), []);
    });
  });

  describe('calculateEmission', () => {
    it('returns 0 for unknown type', () => {
      assert.strictEqual(ActivityService.calculateEmission('Unknown', 10), 0);
    });
    it('returns 0 for falsy value', () => {
      assert.strictEqual(ActivityService.calculateEmission('Car', null), 0);
    });
    it('calculates Car emission', () => {
      assert.strictEqual(ActivityService.calculateEmission('Car', 10), 1.92);
    });
    it('calculates Bus emission', () => {
      assert.strictEqual(ActivityService.calculateEmission('Bus', 10), 1.05);
    });
    it('calculates Train emission', () => {
      // 10 * 0.041 = 0.41
      assert.strictEqual(ActivityService.calculateEmission('Train', 10), 0.41);
    });
    it('calculates Flight emission', () => {
      assert.strictEqual(ActivityService.calculateEmission('Flight', 100), 25.5);
    });
    it('calculates Electricity emission', () => {
      assert.strictEqual(ActivityService.calculateEmission('Electricity', 10), 4.75);
    });
    it('calculates Food emission', () => {
      assert.strictEqual(ActivityService.calculateEmission('Food', 1), 2.5);
    });
    it('calculates Waste emission', () => {
      assert.strictEqual(ActivityService.calculateEmission('Waste', 2), 1.0);
    });
  });
});
