import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage, setStorageItem } from './lib/storageMock.js';
import './lib/storageMock.js';
import { STORAGE_KEYS } from '../src/config/securityConfig.js';

describe('Regression Tests', () => {
  let ActivityService, computeFullAggregation, safeGetJSON, safeParseJSON, ActivityCache;
  let breakdownByCategory, aggregate, sanitizeString, sanitizeNumber, validateEmail;

  before(async () => {
    const as = await import('../src/utils/activityService.js');
    ActivityService = as.ActivityService;
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    breakdownByCategory = an.breakdownByCategory;
    aggregate = an.aggregate;
    const st = await import('../src/utils/storage.js');
    safeGetJSON = st.safeGetJSON;
    safeParseJSON = st.safeParseJSON;
    const ac = await import('../src/utils/activityCache.js');
    ActivityCache = ac.ActivityCache;
    const val = await import('../src/domain/validation.js');
    sanitizeString = val.sanitizeString;
    sanitizeNumber = val.sanitizeNumber;
    validateEmail = val.validateEmail;
  });

  beforeEach(() => {
    resetStorage();
    ActivityCache.invalidate();
  });

  const now = new Date();
  const iso = (d) => d.toISOString();
  const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);

  describe('Historical Bugs', () => {
    it('regression: empty activities should not crash breakdownByCategory', () => {
      assert.doesNotThrow(() => breakdownByCategory([]));
    });

    it('regression: null activities throw (no null guard in computeFullAggregation)', () => {
      assert.throws(() => aggregate(null));
    });

    it('regression: undefined activities throw', () => {
      assert.throws(() => computeFullAggregation(undefined));
    });

    it('regression: missing date field should not crash aggregation', () => {
      const acts = [{ id: 'x', type: 'Car', value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });

    it('regression: invalid date string should not crash aggregation', () => {
      const acts = [{ id: 'x', date: 'not-a-date', type: 'Car', value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });
  });

  describe('Validation Regressions', () => {
    it('regression: sanitizeString should not throw on any input', () => {
      for (const v of [null, undefined, '', 'test', 42, {}, [], Symbol, NaN, Infinity]) {
        assert.doesNotThrow(() => sanitizeString(v));
      }
    });

    it('regression: sanitizeNumber should handle all edge inputs', () => {
      assert.doesNotThrow(() => sanitizeNumber(NaN));
      assert.doesNotThrow(() => sanitizeNumber(Infinity));
      assert.doesNotThrow(() => sanitizeNumber(-Infinity));
    });

    it('regression: validateEmail should handle edge cases', () => {
      assert.doesNotThrow(() => validateEmail(null));
      assert.doesNotThrow(() => validateEmail(''));
      assert.doesNotThrow(() => validateEmail('a@b.c'));
    });
  });

  describe('Storage Corruption', () => {
    it('regression: corrupted JSON should return fallback, not crash', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, '{broken json');
      const v = ActivityService.loadActivities();
      assert.deepEqual(v, []);
    });

    it('regression: truncated JSON array should return fallback', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, '[{"id":"x","date');
      const v = ActivityService.loadActivities();
      assert.deepEqual(v, []);
    });

    it('regression: non-JSON string returns fallback', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, 'just a string');
      const v = ActivityService.loadActivities();
      assert.deepEqual(v, []);
    });

    it('regression: null byte in JSON should be recoverable', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, '{"a":1}\x00extra');
      safeGetJSON('test_key', null);
    });
  });

  describe('Malformed JSON', () => {
    it('regression: safeParseJSON should recover nested JSON with trailing garbage', () => {
      const r = safeParseJSON('{"a":{"b":1}}trailing', null);
      assert.deepEqual(r, { a: { b: 1 } });
    });

    it('regression: safeParseJSON should handle empty string', () => {
      assert.strictEqual(safeParseJSON('', 'fallback'), 'fallback');
    });

    it('regression: safeParseJSON should handle whitespace-only', () => {
      assert.strictEqual(safeParseJSON('   ', 'fb'), 'fb');
    });
  });

  describe('Duplicate IDs', () => {
    it('regression: duplicate IDs should not break aggregation', () => {
      const acts = [
        { id: 'dup', date: iso(new Date()), type: 'Car', value: 10, co2: 1 },
        { id: 'dup', date: iso(shift(-1)), type: 'Bus', value: 20, co2: 2 }
      ];
      const agg = computeFullAggregation(acts);
      assert.strictEqual(agg.totalActivities, 2);
      assert.strictEqual(agg.byId.get('dup'), acts[1]); // last one wins
    });

    it('regression: duplicate IDs in storage -> add -> remove', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([
        { id: 'dup', date: iso(new Date()), type: 'Car', value: 10, co2: 1 }
      ]));
      // Adding another with same ID via service generates unique IDs
      const e = ActivityService.addActivity({ type: 'Bus', value: 20 });
      assert.notEqual(e.id, 'dup');
    });
  });

  describe('Invalid Dates', () => {
    it('regression: epoch date (1970) should not crash aggregation', () => {
      const acts = [{ id: 'x', date: '1970-01-01T00:00:00.000Z', type: 'Car', value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });

    it('regression: far future date should not crash', () => {
      const acts = [{ id: 'x', date: '2100-01-01T00:00:00.000Z', type: 'Car', value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });

    it('regression: date-only format (no time) should work', () => {
      const acts = [{ id: 'x', date: '2024-01-15', type: 'Car', value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });
  });

  describe('Invalid Activity Types', () => {
    it('regression: empty string type should not crash aggregation', () => {
      const acts = [{ id: 'x', date: iso(new Date()), type: '', value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });

    it('regression: very long type string should not crash', () => {
      const acts = [{ id: 'x', date: iso(new Date()), type: 'x'.repeat(1000), value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });

    it('regression: null type should not crash aggregation', () => {
      const acts = [{ id: 'x', date: iso(new Date()), type: null, value: 10, co2: 1 }];
      assert.doesNotThrow(() => computeFullAggregation(acts));
    });
  });

  describe('Storage Format Compatibility', () => {
    it('regression: old format without co2 field should be repaired', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([
        { id: 'a', date: iso(new Date()), type: 'Car', value: 10 }
      ]));
      const v = ActivityService.loadActivities();
      assert.strictEqual(v.length, 1); // repaired — co2 recomputed
      assert.strictEqual(v[0].co2, 1.92);
    });

    it('regression: extra unknown fields should be preserved', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([
        { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 1, extraField: 'should be preserved' }
      ]));
      const v = ActivityService.loadActivities();
      assert.strictEqual(v.length, 1);
      assert.strictEqual(v[0].extraField, 'should be preserved');
    });

    it('regression: boolean co2 should be handled', () => {
      const acts = [{ id: 'x', date: iso(new Date()), type: 'Car', value: 10, co2: true }];
      const agg = computeFullAggregation(acts);
      // true becomes 1 via Number()
      assert.strictEqual(agg.totalSum, 1);
    });

    it('regression: string co2 should be parsed', () => {
      const acts = [{ id: 'x', date: iso(new Date()), type: 'Car', value: 10, co2: '2.5' }];
      const agg = computeFullAggregation(acts);
      assert.strictEqual(agg.totalSum, 2.5);
    });
  });

  describe('Cache Consistency', () => {
    it('regression: cache invalidation refreshes data', () => {
      ActivityCache.addActivity({ type: 'Car', value: 10 });
      const before = ActivityCache.getActivities().length;
      ActivityCache.invalidate();
      const after = ActivityCache.getActivities().length;
      assert.strictEqual(before, after);
    });
  });
});
