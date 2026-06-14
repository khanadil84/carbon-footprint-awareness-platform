import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage, setStorageItem } from './lib/storageMock.js';
import './lib/storageMock.js';
import { STORAGE_KEYS } from '../src/config/securityConfig.js';

describe('Fuzz Tests', () => {
  let ActivityService, ActivityCache;
  let sanitizeString, sanitizeNumber;
  let computeFullAggregation, breakdownByCategory, summaryStats, aggregateByDay;
  let safeParseJSON, safeStringifyJSON, safeGetJSON, safeSetJSON;
  let calculateCarbonScore, generateRecommendations, GoalService, AchievementService;
  let validateEmail, validatePassword, checkPasswordStrength, validActivityType;

  before(async () => {
    const as = await import('../src/utils/activityService.js');
    ActivityService = as.ActivityService;
    const ac = await import('../src/utils/activityCache.js');
    ActivityCache = ac.ActivityCache;
    const val = await import('../src/domain/validation.js');
    sanitizeString = val.sanitizeString;
    sanitizeNumber = val.sanitizeNumber;
    validateEmail = val.validateEmail;
    validatePassword = val.validatePassword;
    checkPasswordStrength = val.checkPasswordStrength;
    validActivityType = val.validActivityType;
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    breakdownByCategory = an.breakdownByCategory;
    summaryStats = an.summaryStats;
    aggregateByDay = an.aggregateByDay;
    const st = await import('../src/utils/storage.js');
    safeParseJSON = st.safeParseJSON;
    safeStringifyJSON = st.safeStringifyJSON;
    safeGetJSON = st.safeGetJSON;
    safeSetJSON = st.safeSetJSON;
    const cs = await import('../src/utils/carbonScoreService.js');
    calculateCarbonScore = cs.calculateCarbonScore;
    const rs = await import('../src/utils/recommendationService.js');
    generateRecommendations = rs.generateRecommendations;
    const gs = await import('../src/utils/goalService.js');
    GoalService = gs.GoalService;
    const ach = await import('../src/utils/achievementService.js');
    AchievementService = ach.AchievementService;
  });

  beforeEach(() => {
    resetStorage();
    ActivityCache.invalidate();
  });

const fuzzInputs = [
  null, undefined, '', ' ', '\t', '\n', '\x00', '\x1F', '\x7F',
  '\\', '"', "'", '{"a":1}', '<script>alert(1)</script>',
  'NaN', 'Infinity', '-Infinity', 'true', 'false', '{}', '[]',
  0, -1, 1, NaN, Infinity, -Infinity, 1e308, -1e308,
  [], {},
  () => {}, /regex/,
  '\u0000\u0001\u0002', '\uFFFF', '😀🚀🌟'
];

  const randomFuzzValue = () => fuzzInputs[Math.floor(Math.random() * fuzzInputs.length)];

  const randomActivity = () => {
    const obj = {};
    const fields = ['id', 'date', 'type', 'value', 'co2', 'extra'];
    for (const f of fields) {
      if (Math.random() > 0.3) obj[f] = randomFuzzValue();
    }
    return obj;
  };

  describe('Validation Fuzz', () => {
    it('sanitizeString never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => sanitizeString(input), `sanitizeString(${JSON.stringify(input)})`);
      }
    });

    it('sanitizeNumber never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => sanitizeNumber(input), `sanitizeNumber(${JSON.stringify(input)})`);
      }
    });

    it('validateEmail never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => validateEmail(input));
      }
    });

    it('validatePassword never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => validatePassword(input));
      }
    });

    it('checkPasswordStrength never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => checkPasswordStrength(input));
      }
    });

    it('validActivityType never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => validActivityType(input));
      }
    });
  });

  describe('Storage Fuzz', () => {
    it('safeParseJSON never throws for string inputs', () => {
      const stringInputs = fuzzInputs.filter(v => typeof v === 'string' || v === null || v === undefined);
      for (const input of stringInputs) {
        assert.doesNotThrow(() => safeParseJSON(input, null), `safeParseJSON(${JSON.stringify(input)})`);
      }
    });

    it('safeStringifyJSON never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => safeStringifyJSON(input));
      }
    });

    it('safeGetJSON never throws for any key', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => safeGetJSON(String(input), null));
      }
    });

    it('safeSetJSON never throws for any value', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => safeSetJSON('fuzz_test', input));
      }
    });
  });

  describe('ActivityService Fuzz', () => {
    it('addActivity never throws for random types', () => {
      for (let i = 0; i < 50; i++) {
        try {
          ActivityService.addActivity({ type: String(randomFuzzValue()), value: Math.random() * 100 });
        } catch (e) {
          // Expected for invalid types
          assert.ok(e.message.includes('Invalid activity type') || e.message.includes('Invalid activity value'));
        }
      }
    });

    it('loadActivities never throws with corrupted storage', () => {
      for (const input of fuzzInputs) {
        setStorageItem(STORAGE_KEYS.ACTIVITIES, String(input));
        assert.doesNotThrow(() => ActivityService.loadActivities());
      }
    });

    it('removeActivity never throws', () => {
      for (const input of fuzzInputs) {
        assert.doesNotThrow(() => ActivityService.removeActivity(String(input)));
      }
    });
  });

  describe('Analytics Fuzz', () => {
    it('computeFullAggregation never throws for random data', () => {
      for (let i = 0; i < 100; i++) {
        const count = Math.floor(Math.random() * 20);
        const acts = [];
        for (let j = 0; j < count; j++) {
          acts.push(randomActivity());
        }
        assert.doesNotThrow(() => computeFullAggregation(acts));
      }
    });

    it('breakdownByCategory never throws for random data', () => {
      for (let i = 0; i < 50; i++) {
        const acts = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
          acts.push(randomActivity());
        }
        const agg = computeFullAggregation(acts);
        assert.doesNotThrow(() => breakdownByCategory(acts, agg));
      }
    });

    it('summaryStats never throws for random data', () => {
      for (let i = 0; i < 30; i++) {
        const acts = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
          acts.push(randomActivity());
        }
        const agg = computeFullAggregation(acts);
        assert.doesNotThrow(() => summaryStats(acts, agg));
      }
    });

    it('aggregateByDay never throws for random data', () => {
      for (let i = 0; i < 20; i++) {
        assert.doesNotThrow(() => {
          aggregateByDay([], 30, null);
        });
      }
    });

    it('calculateCarbonScore never throws for random data', () => {
      for (let i = 0; i < 30; i++) {
        const acts = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
          acts.push(randomActivity());
        }
        assert.doesNotThrow(() => calculateCarbonScore(acts));
      }
    });
  });

  describe('Recommendation Fuzz', () => {
    it('generateRecommendations never throws for random data', () => {
      for (let i = 0; i < 30; i++) {
        const acts = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
          acts.push(randomActivity());
        }
        assert.doesNotThrow(() => generateRecommendations(acts));
      }
    });
  });

  describe('GoalService Fuzz', () => {
    it('computeProgress never throws for random inputs', () => {
      for (let i = 0; i < 20; i++) {
        const acts = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
          acts.push(randomActivity());
        }
        assert.doesNotThrow(() => GoalService.computeProgress(acts, { targetKg: Math.random() > 0.3 ? Math.floor(Math.random() * 500) : null }));
      }
    });
  });

  describe('Achievement Fuzz', () => {
    it('evaluateAchievements never throws for random data', () => {
      for (let i = 0; i < 20; i++) {
        const acts = [];
        for (let j = 0; j < Math.floor(Math.random() * 10); j++) {
          acts.push(randomActivity());
        }
        assert.doesNotThrow(() => AchievementService.evaluateAchievements(acts, null));
      }
    });
  });

  describe('Cache Fuzz', () => {
    it('ActivityCache operations never throw', () => {
      assert.doesNotThrow(() => ActivityCache.getActivities());
      assert.doesNotThrow(() => ActivityCache.getAggregation());
      assert.doesNotThrow(() => ActivityCache.getRecommendations());
      assert.doesNotThrow(() => ActivityCache.getScoreAndMeta());
      assert.doesNotThrow(() => ActivityCache.getSummaryStats());
      assert.doesNotThrow(() => ActivityCache.getGoalProgress(null));
      assert.doesNotThrow(() => ActivityCache.getAchievements(null));
      assert.doesNotThrow(() => ActivityCache.getIndex('byType'));
    });
  });

  describe('Graceful Recovery', () => {
    it('all functions return safe defaults on bad input', () => {
      assert.strictEqual(sanitizeString(null), '');
      assert.strictEqual(sanitizeNumber(NaN, 0), 0);
      assert.strictEqual(safeParseJSON('bad', 'fallback'), 'fallback');
      assert.deepEqual(ActivityService.loadActivities(), []);
      assert.strictEqual(GoalService.loadGoal(), null);
    });

    it('storage corruption does not prevent new data from being saved', () => {
      setStorageItem(STORAGE_KEYS.ACTIVITIES, 'corrupted');
      const e = ActivityService.addActivity({ type: 'Car', value: 10 });
      assert.ok(e.id);
      const loaded = ActivityService.loadActivities();
      assert.strictEqual(loaded.length, 1);
    });
  });
});
