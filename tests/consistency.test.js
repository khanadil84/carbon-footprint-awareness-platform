import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage, setStorageItem } from './lib/storageMock.js';
import './lib/storageMock.js';

let ActivityService, ActivityCache, InvariantEngine, Telemetry;
let STORAGE_KEYS, TYPES;
let computeFullAggregation, breakdownByCategory, calculateCarbonScore, generateRecommendations;
let GoalService, AchievementService, ExportService;

describe('End-to-End Consistency Validation', () => {
  before(async () => {
    const as = await import('../src/utils/activityService.js');
    ActivityService = as.ActivityService;
    const ac = await import('../src/utils/activityCache.js');
    ActivityCache = ac.ActivityCache;
    const ie = await import('../src/utils/invariantEngine.js');
    InvariantEngine = ie.InvariantEngine;
    const tel = await import('../src/utils/telemetry.js');
    Telemetry = tel.Telemetry;
    const cfg = await import('../src/config/securityConfig.js');
    STORAGE_KEYS = cfg.STORAGE_KEYS;
    const fix = await import('./lib/fixtures.js');
    TYPES = fix.TYPES;
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    breakdownByCategory = an.breakdownByCategory;
    const cs = await import('../src/utils/carbonScoreService.js');
    calculateCarbonScore = cs.calculateCarbonScore;
    const rs = await import('../src/utils/recommendationService.js');
    generateRecommendations = rs.generateRecommendations;
    const gs = await import('../src/utils/goalService.js');
    GoalService = gs.GoalService;
    const achs = await import('../src/utils/achievementService.js');
    AchievementService = achs.AchievementService;
    const es = await import('../src/utils/exportService.js');
    ExportService = es.ExportService;
  });

  beforeEach(() => {
    resetStorage();
    Telemetry.reset();
    InvariantEngine.reset();
    GoalService.clearGoal();
  });

  const deterministicActivities = () => [
    { id: 'det_1', date: new Date(Date.now() - 1 * 86400000).toISOString(), type: 'Car', value: 10, co2: 1.92 },
    { id: 'det_2', date: new Date(Date.now() - 2 * 86400000).toISOString(), type: 'Bus', value: 20, co2: 2.1 },
    { id: 'det_3', date: new Date(Date.now() - 3 * 86400000).toISOString(), type: 'Train', value: 50, co2: 2.05 },
    { id: 'det_4', date: new Date(Date.now() - 4 * 86400000).toISOString(), type: 'Electricity', value: 30, co2: 14.25 },
    { id: 'det_5', date: new Date(Date.now() - 5 * 86400000).toISOString(), type: 'Food', value: 2, co2: 5.0 }
  ];

  it('pipeline produces identical state on reload', () => {
    for (let round = 0; round < 5; round++) {
      resetStorage();
      GoalService.clearGoal();
      InvariantEngine.reset();

      const activities = deterministicActivities();

      for (const a of activities) {
        setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(
          JSON.parse(getStorageItem(STORAGE_KEYS.ACTIVITIES) || '[]').concat(a)
        ));
      }

      const reload = () => {
        const stored = JSON.parse(globalThis.localStorage.getItem(STORAGE_KEYS.ACTIVITIES) || '[]');
        const full = computeFullAggregation(stored);
        const breakdown = breakdownByCategory(stored, full);
        const score = calculateCarbonScore(stored, full, breakdown);
        const recs = generateRecommendations(stored, breakdown, full.monthlySum);
        const goal = GoalService.loadGoal();
        const progress = GoalService.computeProgress(stored, goal, full);
        const achievements = AchievementService.evaluateAchievements(stored, goal, full);
        const report = ExportService.makeReportData(stored);
        return { stored, full, score, recs, progress, achievements, report };
      };

      // Two sequential reloads must produce identical state
      const state1 = reload();
      const state2 = reload();

      assert.strictEqual(state1.stored.length, state2.stored.length, 'round ' + round + ': stored length mismatch');
      assert.strictEqual(state1.score.score, state2.score.score, 'round ' + round + ': score mismatch');
      assert.strictEqual(state1.score.rating, state2.score.rating, 'round ' + round + ': rating mismatch');
      assert.strictEqual(state1.recs.length, state2.recs.length, 'round ' + round + ': recs count mismatch');

      const inv = InvariantEngine.verifySystemInvariants(state1.stored, state1.full, state1.score, state1.progress);
      const allPass = Object.values(inv).every(r => r.pass);
      assert.ok(allPass, `round ${round}: invariants failed: ${JSON.stringify(inv)}`);
    }
  });

  it('add-remove-reload produces consistent state', () => {
    for (let round = 0; round < 5; round++) {
      resetStorage();
      ActivityCache.clearActivities();

      const ids = [];
      for (let i = 0; i < 5; i++) {
        const entry = ActivityService.addActivity({
          type: TYPES[i % TYPES.length],
          value: 10 + i
        });
        if (entry) ids.push(entry.id);
      }
      let activities = ActivityService.loadActivities();
      let inv = InvariantEngine.verifySystemInvariants(activities, null, null, null);
      assert.ok(Object.values(inv).every(r => r.pass), `round ${round}: invariants after adds`);

      for (let i = 0; i < 2 && i < ids.length; i++) {
        ActivityService.removeActivity(ids[i]);
      }

      activities = ActivityService.loadActivities();
      inv = InvariantEngine.verifySystemInvariants(activities, null, null, null);
      assert.ok(Object.values(inv).every(r => r.pass), `round ${round}: invariants after removes`);

      const full = computeFullAggregation(activities);
      const score = calculateCarbonScore(activities, full);
      assert.ok(score.score >= 0 && score.score <= 100, `round ${round}: score range`);
    }
  });

  it('cache and storage remain consistent after writes', () => {
    const entry1 = ActivityCache.addActivity({ type: 'Car', value: 10 });
    assert.ok(entry1);

    const cached = ActivityCache.getActivities();
    const stored = ActivityService.loadActivities();
    assert.strictEqual(cached.length, stored.length, 'cache and storage length mismatch');
    assert.strictEqual(cached[0].id, stored[0].id, 'cache and storage id mismatch');

    ActivityCache.removeActivity(entry1.id);
    const cached2 = ActivityCache.getActivities();
    const stored2 = ActivityService.loadActivities();
    assert.strictEqual(cached2.length, stored2.length, 'cache and storage length mismatch after remove');
  });

  it('aggregation is deterministic for same input', () => {
    const activities = deterministicActivities();
    const agg1 = computeFullAggregation(activities);
    const agg2 = computeFullAggregation(activities);
    assert.strictEqual(agg1.totalSum, agg2.totalSum);
    assert.strictEqual(agg1.todaySum, agg2.todaySum);
    assert.strictEqual(agg1.monthlySum, agg2.monthlySum);
    assert.strictEqual(agg1.totalActivities, agg2.totalActivities);
  });

  it('invariant engine detects corrupted data', () => {
    const badActivities = [
      { id: 'dup', date: '2024-01-01', type: 'Car', value: 10, co2: 1.92 },
      { id: 'dup', date: '2024-01-02', type: 'Bus', value: 5, co2: 0.53 },
      { id: 'neg', date: '2024-01-03', type: 'Flight', value: 100, co2: -25.5 }
    ];
    const inv = InvariantEngine.verifySystemInvariants(badActivities, null, null, null);
    assert.strictEqual(inv.idUniqueness.pass, false, 'should detect duplicate ids');
    assert.strictEqual(inv.emissionsNonNegative.pass, false, 'should detect negative emissions');
  });

  it('score invariant detects out-of-range score', () => {
    const badScore = { score: 150, rating: 'Excellent' };
    const inv = InvariantEngine.verify('scoreRange', badScore);
    assert.strictEqual(inv.pass, false, 'should detect score > 100');
  });
});

function getStorageItem(key) {
  return globalThis.localStorage.getItem(key);
}
