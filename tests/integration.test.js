import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage, setStorageItem } from './lib/storageMock.js';
import './lib/storageMock.js';
import { STORAGE_KEYS } from '../src/config/securityConfig.js';

describe('Full Pipeline Integration', () => {
  let ActivityService, ActivityCache, computeFullAggregation, breakdownByCategory;
  let calculateCarbonScore, generateRecommendations, GoalService, AchievementService;

  before(async () => {
    const as = await import('../src/utils/activityService.js');
    ActivityService = as.ActivityService;
    const ac = await import('../src/utils/activityCache.js');
    ActivityCache = ac.ActivityCache;
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    breakdownByCategory = an.breakdownByCategory;
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

  const now = new Date();
  const iso = (d) => d.toISOString();
  const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);

  it('add activity -> analytics -> score -> recommendations -> achievements -> goal -> storage', () => {
    // 1. Add activities
    const e1 = ActivityService.addActivity({ type: 'Car', value: 50, date: iso(shift(0)) });
    const e2 = ActivityService.addActivity({ type: 'Bus', value: 30, date: iso(shift(-1)) });
    const e3 = ActivityService.addActivity({ type: 'Train', value: 100, date: iso(shift(-2)) });
    const e4 = ActivityService.addActivity({ type: 'Electricity', value: 20, date: iso(shift(-3)) });

    assert.ok(e1.id);
    assert.ok(e2.id);
    assert.ok(e3.id);
    assert.ok(e4.id);

    // 2. Verify storage
    const loaded = ActivityService.loadActivities();
    assert.strictEqual(loaded.length, 4);

    // 3. Compute analytics
    const agg = computeFullAggregation(loaded);
    assert.ok(agg.totalSum > 0);
    assert.ok(agg.byId.size === 4);
    assert.ok(agg.byType.has('Car'));
    assert.ok(agg.byType.has('Bus'));

    // 4. Breakdown
    const breakdown = breakdownByCategory(loaded, agg);
    assert.ok(breakdown.total > 0);
    assert.ok(breakdown.list.length >= 1);
    const sumPct = breakdown.list.reduce((s, x) => s + x.pct, 0);
    assert.ok(Math.abs(sumPct - 100) < 1 || breakdown.list.length === 0);

    // 5. Carbon score
    const score = calculateCarbonScore(loaded, agg, breakdown);
    assert.ok(typeof score.score === 'number');
    assert.ok(score.score >= 0 && score.score <= 100);
    assert.ok(['Excellent', 'Good', 'Fair', 'Poor'].includes(score.rating));
    assert.ok(score.biggestContributor);

    // 6. Recommendations
    const recs = generateRecommendations(loaded, breakdown, agg.monthlySum);
    assert.ok(recs.length >= 1);
    for (const r of recs) {
      assert.ok(typeof r.title === 'string');
      assert.ok(typeof r.priority === 'string');
    }

    // 7. Goal progress
    GoalService.saveGoal({ targetKg: 100 });
    const goal = GoalService.loadGoal();
    const progress = GoalService.computeProgress(loaded, goal, agg);
    assert.ok(typeof progress.current === 'number');
    assert.ok(progress.current > 0);
    assert.ok(progress.percent >= 0);
    assert.ok(['On Track', 'Behind', 'Goal Achieved', 'Slightly Behind'].includes(progress.status) || progress.status === 'No Goal');

    // 8. Achievements
    const achResult = AchievementService.evaluateAchievements(loaded, goal, agg);
    assert.strictEqual(achResult.achievements.length, 10);
    const firstActivity = achResult.achievements.find(a => a.id === 'first_activity');
    assert.ok(firstActivity.unlocked);

    // 9. Verify saved achievements persist
    const saved = AchievementService.loadSaved();
    assert.ok(Object.keys(saved).length > 0);
  });

  it('empty pipeline returns safe defaults', () => {
    const agg = computeFullAggregation([]);
    assert.strictEqual(agg.totalSum, 0);
    assert.strictEqual(agg.totalActivities, 0);

    const score = calculateCarbonScore([]);
    assert.strictEqual(score.score, 0);
    assert.strictEqual(score.rating, 'Poor');

    const recs = generateRecommendations([]);
    assert.strictEqual(recs.length, 1);
    assert.ok(recs[0].title.includes('No activity'));

    const progress = GoalService.computeProgress([], null);
    assert.strictEqual(progress.status, 'No Goal');

    const ach = AchievementService.evaluateAchievements([], null);
    assert.ok(!ach.achievements.find(a => a.id === 'first_activity').unlocked);
  });

  it('add -> cache -> read -> remove -> verify consistency', () => {
    const e1 = ActivityCache.addActivity({ type: 'Car', value: 25 });
    ActivityCache.addActivity({ type: 'Bus', value: 15 });
    assert.strictEqual(ActivityCache.getActivities().length, 2);

    const agg = ActivityCache.getAggregation();
    assert.strictEqual(agg.totalActivities, 2);
    assert.ok(agg.totalSum > 0);

    const score = ActivityCache.getScoreAndMeta();
    assert.ok(score.score >= 0);

    const recs = ActivityCache.getRecommendations();
    assert.ok(recs.length >= 1);

    ActivityCache.removeActivity(e1.id);
    assert.strictEqual(ActivityCache.getActivities().length, 1);
    const agg2 = ActivityCache.getAggregation();
    assert.strictEqual(agg2.totalActivities, 1);
  });

  it('cross-module totals consistency', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 1.92 },
      { id: 'b', date: iso(shift(-1)), type: 'Bus', value: 20, co2: 2.1 },
      { id: 'c', date: iso(shift(-2)), type: 'Train', value: 50, co2: 2.05 }
    ];
    const agg = computeFullAggregation(acts);
    const breakdown = breakdownByCategory(acts, agg);
    const totalFromBreakdown = breakdown.list.reduce((s, x) => s + x.value, 0);
    assert.ok(Math.abs(totalFromBreakdown - agg.totalSum) < 0.01);
  });

  it('storage survives round-trip for complex data', () => {
    ActivityService.addActivity({ type: 'Flight', value: 1000 });
    ActivityService.addActivity({ type: 'Food', value: 5 });
    const loaded = ActivityService.loadActivities();
    assert.strictEqual(loaded.length, 2);

    // Re-import (simulate page reload)
    resetStorage();
    setStorageItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(loaded));
    const reloaded = ActivityService.loadActivities();
    assert.strictEqual(reloaded.length, 2);
  });
});
