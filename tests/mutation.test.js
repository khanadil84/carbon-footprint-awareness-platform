import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import './lib/storageMock.js';

describe('Mutation Resistance Tests', () => {
  let activity, calculateEmission, computeFullAggregation, generateRecommendations;
  let calculateCarbonScore, evaluateAchievements, ActivityService, STORAGE_KEYS;

  before(async () => {
    const val = await import('../src/domain/validation.js');
    activity = val.activity;
    const calc = await import('../src/domain/emissionCalculator.js');
    calculateEmission = calc.calculateEmission;
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    const rs = await import('../src/utils/recommendationService.js');
    generateRecommendations = rs.generateRecommendations;
    const cs = await import('../src/utils/carbonScoreService.js');
    calculateCarbonScore = cs.calculateCarbonScore;
    const ach = await import('../src/utils/achievementService.js');
    evaluateAchievements = ach.evaluateAchievements;
    const as = await import('../src/utils/activityService.js');
    ActivityService = as.ActivityService;
    const cfg = await import('../src/config/securityConfig.js');
    STORAGE_KEYS = cfg.STORAGE_KEYS;
  });

  describe('Comparison Operators', () => {
    it('aggressive: activity.isValidValue should reject 0 (would fail if > becomes >=)', () => {
      assert.ok(!activity.isValidValue(0), 'isValidValue(0) must be false');
    });
    it('aggressive: activity.isValidValue should reject -1 (would fail if > becomes >=)', () => {
      assert.ok(!activity.isValidValue(-1));
    });
  });

  describe('Arithmetic Operators', () => {
    it('aggressive: emission calculation is multiplication not subtraction', () => {
      const r = calculateEmission('Car', 100);
      assert.strictEqual(r, 19.2);
      assert.notStrictEqual(r, 99.808);
    });
    it('aggressive: aggregation sums are additive (not subtractive)', () => {
      const acts = [
        { id: 'a', date: new Date().toISOString(), type: 'Car', value: 10, co2: 5 },
        { id: 'b', date: new Date().toISOString(), type: 'Bus', value: 10, co2: 3 }
      ];
      const agg = computeFullAggregation(acts);
      assert.strictEqual(agg.totalSum, 8);
      assert.ok(agg.totalSum > 7);
    });
  });

  describe('Logical Operators', () => {
    it('aggressive: recommendation rules use AND correctly', () => {
      const iso = (d) => d.toISOString();
      const acts = [
        { id: 'a', date: iso(new Date()), type: 'Car', value: 300, co2: 60 }
      ];
      const recs = generateRecommendations(acts);
      const hasCarRec = recs.some(r => r.title.includes('High car'));
      assert.ok(hasCarRec, 'High car rec should fire when car.pct >= 30 AND monthly >= 50');
    });
  });

  describe('Validation Removal Detection', () => {
    it('aggressive: invalid records are filtered out', () => {
      assert.ok(!activity.isValidRecord(null));
      assert.ok(!activity.isValidRecord({}));
      assert.ok(!activity.isValidRecord({ id: 'x' }));
      assert.ok(!activity.isValidRecord({ id: 'x', date: 'x' }));
      assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: 'Car' }));
      assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: 'Car', value: 10 }));
    });
    it('aggressive: loadActivities filters invalid records', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([
        { id: 'a', date: 'x', type: 'Car', value: 10, co2: 1 },
        null,
        { id: 'b' },
        'string entry'
      ]));
      const loaded = ActivityService.loadActivities();
      assert.strictEqual(loaded.length, 1);
    });
  });

  describe('Score Calculation Alteration', () => {
    it('aggressive: score is 0 for zero activities', () => {
      const r = calculateCarbonScore([]);
      assert.strictEqual(r.score, 0);
    });
    it('aggressive: score is high for minimal emissions', () => {
      const iso = (d) => d.toISOString();
      const acts = [{ id: 'a', date: iso(new Date()), type: 'Train', value: 10, co2: 0.01 }];
      const r = calculateCarbonScore(acts);
      assert.ok(r.score >= 99, `Score should be near 100 for minimal emissions, got ${r.score}`);
    });
    it('aggressive: bad emissions produce low score', () => {
      const iso = (d) => d.toISOString();
      const acts = [{ id: 'a', date: iso(new Date()), type: 'Flight', value: 100000, co2: 25500 }];
      const r = calculateCarbonScore(acts);
      assert.strictEqual(r.rating, 'Poor');
      assert.ok(r.score <= 50, `Score should be low for huge emissions, got ${r.score}`);
    });
  });

  describe('Achievement Logic', () => {
    it('aggressive: first_activity requires at least 1 activity', () => {
      const r = evaluateAchievements([], null);
      const fa = r.achievements.find(a => a.id === 'first_activity');
      assert.ok(!fa.unlocked);
    });
    it('aggressive: first_activity unlocks with 1 activity', () => {
      const acts = [{ id: 'a', date: new Date().toISOString(), type: 'Car', value: 10, co2: 1 }];
      const agg = computeFullAggregation(acts);
      const r = evaluateAchievements(acts, null, agg);
      const fa = r.achievements.find(a => a.id === 'first_activity');
      assert.ok(fa.unlocked);
    });
  });
});
