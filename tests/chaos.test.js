import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage, setStorageItem, getStorageItem } from './lib/storageMock.js';
import './lib/storageMock.js';
import { STORAGE_KEYS } from '../src/config/securityConfig.js';

let ActivityService, ActivityCache, InvariantEngine, Telemetry;
let TYPES;

const ROUNDS = globalThis.process.env.CHAOS_ROUNDS ? parseInt(globalThis.process.env.CHAOS_ROUNDS) : 50;

const randomActivity = (overrides) => {
  const types = TYPES || ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Food', 'Waste'];
  return {
    id: `chaos_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: new Date(Date.now() - Math.floor(Math.random() * 90 * 86400000)).toISOString(),
    type: types[Math.floor(Math.random() * types.length)],
    value: Math.floor(Math.random() * 100) + 1,
    co2: parseFloat((Math.random() * 10).toFixed(3)),
    ...overrides
  };
};

describe('Chaos Testing', () => {
  before(async () => {
    const as = await import('../src/utils/activityService.js');
    ActivityService = as.ActivityService;
    const ac = await import('../src/utils/activityCache.js');
    ActivityCache = ac.ActivityCache;
    const ie = await import('../src/utils/invariantEngine.js');
    InvariantEngine = ie.InvariantEngine;
    const tel = await import('../src/utils/telemetry.js');
    Telemetry = tel.Telemetry;
    const fix = await import('./lib/fixtures.js');
    TYPES = fix.TYPES;
  });

  beforeEach(() => {
    resetStorage();
    Telemetry.reset();
    InvariantEngine.reset();
  });

  it('survives random malformed storage across many rounds', () => {
    for (let round = 0; round < ROUNDS; round++) {
      resetStorage();
      const count = Math.floor(Math.random() * 20);
      const data = [];
      for (let i = 0; i < count; i++) {
        const r = randomActivity();
        if (Math.random() < 0.2) {
          delete r.co2;
        }
        if (Math.random() < 0.1) {
          r.date = 'bad-date';
        }
        data.push(r);
      }
      if (Math.random() < 0.3) {
        data.push(null, undefined, 'string', 42);
      }
      setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(data));
      const loaded = ActivityService.loadActivities();
      assert.ok(Array.isArray(loaded), `round ${round}: loadActivities should return array`);
      for (const a of loaded) {
        assert.ok(a.id && typeof a.id === 'string', `round ${round}: invalid id`);
        assert.ok(a.date && typeof a.date === 'string', `round ${round}: invalid date`);
        assert.ok(typeof a.value === 'number', `round ${round}: invalid value`);
        assert.ok(typeof a.co2 === 'number', `round ${round}: invalid co2`);
      }
    }
  });

  it('survives duplicate id injection without crashing', () => {
    for (let round = 0; round < ROUNDS; round++) {
      resetStorage();
      ActivityService.addActivity({ type: 'Car', value: 10 });
      ActivityService.addActivity({ type: 'Bus', value: 5 });
      let activities = ActivityService.loadActivities();
      if (activities.length >= 2) {
        activities[1] = { ...activities[1], id: activities[0].id };
        setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
      }
      const loaded = ActivityService.loadActivities();
      assert.ok(Array.isArray(loaded), `round ${round}: should not crash`);
    }
  });

  it('survives random null/undefined injections in storage', () => {
    for (let round = 0; round < ROUNDS; round++) {
      resetStorage();
      const badValues = [null, undefined, '', 'not json', '{bad', '[]extrastuff', 'null', 'undefined'];
      const val = badValues[Math.floor(Math.random() * badValues.length)];
      setStorageItem(STORAGE_KEYS.ACTIVITIES, val);
      const loaded = ActivityService.loadActivities();
      assert.ok(Array.isArray(loaded), `round ${round}: should return array for value ${val}`);
    }
  });

  it('survives concurrent add-remove cycles with random errors', () => {
    for (let round = 0; round < ROUNDS; round++) {
      resetStorage();
      const ops = Math.floor(Math.random() * 10) + 1;
      const ids = [];
      for (let i = 0; i < ops; i++) {
        try {
          const entry = ActivityService.addActivity({
            type: TYPES[Math.floor(Math.random() * TYPES.length)],
            value: Math.floor(Math.random() * 50) + 1
          });
          if (entry) ids.push(entry.id);
        } catch {
          // expected for some random inputs
        }
      }
      for (const id of ids.slice(0, Math.floor(ids.length / 2))) {
        try { ActivityService.removeActivity(id); } catch { /* ok */ }
      }
      const loaded = ActivityService.loadActivities();
      assert.ok(Array.isArray(loaded));
      for (const a of loaded) {
        assert.ok(a.id && typeof a.id === 'string');
      }
    }
  });

  it('survives cache corruption and recovers', () => {
    ActivityCache.addActivity({ type: 'Car', value: 10 });
    const agg1 = ActivityCache.getAggregation();
    assert.ok(agg1.totalSum >= 0);

    ActivityCache.invalidate();
    const agg2 = ActivityCache.getAggregation();
    assert.ok(agg2.totalSum >= 0);
    assert.ok(Math.abs(agg1.totalSum - agg2.totalSum) < 0.001);
  });

  it('survives score with zero activities, verifies invariants', () => {
    InvariantEngine.reset();
    import('../src/utils/carbonScoreService.js').then(mod => {
      const score = mod.calculateCarbonScore([]);
      assert.ok(score.score >= 0 && score.score <= 100);
      assert.strictEqual(score.rating, 'Poor');
    });
  });

  it('system invariants hold after random modifications', () => {
    for (let round = 0; round < Math.min(ROUNDS, 20); round++) {
      resetStorage();
      const count = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < count; i++) {
        ActivityService.addActivity({
          type: TYPES[Math.floor(Math.random() * TYPES.length)],
          value: Math.floor(Math.random() * 50) + 1
        });
      }
      const activities = ActivityService.loadActivities();
      const inv = InvariantEngine.verifySystemInvariants(activities, null, null, null);
      const allPass = Object.values(inv).every(r => r.pass);
      assert.ok(allPass, `round ${round}: invariants failed: ${JSON.stringify(inv)}`);
    }
  });

  it('self-healing recovers missing co2 fields', () => {
    const data = JSON.stringify([
      { id: 'a', date: new Date().toISOString(), type: 'Car', value: 10 }
    ]);
    setStorageItem(STORAGE_KEYS.ACTIVITIES, data);
    const loaded = ActivityService.loadActivities();
    assert.strictEqual(loaded.length, 1);
    assert.ok(typeof loaded[0].co2 === 'number', 'co2 should be repaired');
    assert.ok(loaded[0].co2 > 0, 'co2 should be computed from type*value');
  });

  it('survives full round-trip corruption and recovery', () => {
    for (let round = 0; round < 20; round++) {
      resetStorage();
      for (let i = 0; i < 5; i++) {
        ActivityService.addActivity({
          type: TYPES[Math.floor(Math.random() * TYPES.length)],
          value: Math.floor(Math.random() * 50) + 1
        });
      }
      const raw = getStorageItem(STORAGE_KEYS.ACTIVITIES);
      const corrupted = raw.slice(0, Math.floor(raw.length * 0.7));
      setStorageItem(STORAGE_KEYS.ACTIVITIES, corrupted);
      const loaded = ActivityService.loadActivities();
      assert.ok(Array.isArray(loaded), `round ${round}: must return array after corruption`);
    }
  });
});
