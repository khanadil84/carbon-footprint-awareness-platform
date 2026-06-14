import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import './lib/storageMock.js';

const TYPES = ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Food', 'Waste'];
const randomType = () => TYPES[Math.floor(Math.random() * TYPES.length)];
const randomCo2 = () => parseFloat((Math.random() * 100).toFixed(3));
const randomValue = () => Math.floor(Math.random() * 500) + 1;

const generateRandomActivities = (count) => {
  const acts = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 365));
    acts.push({
      id: `prop_${i}_${Math.random().toString(36).slice(2, 8)}`,
      date: d.toISOString(),
      type: randomType(),
      value: randomValue(),
      co2: randomCo2()
    });
  }
  return acts;
};

describe('Property-Based Tests', () => {
  let computeFullAggregation, breakdownByCategory, aggregateByDay, aggregateByMonth;
  let calculateCarbonScore, generateRecommendations, GoalService, AchievementService;

  before(async () => {
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    breakdownByCategory = an.breakdownByCategory;
    aggregateByDay = an.aggregateByDay;
    aggregateByMonth = an.aggregateByMonth;
    const cs = await import('../src/utils/carbonScoreService.js');
    calculateCarbonScore = cs.calculateCarbonScore;
    const rs = await import('../src/utils/recommendationService.js');
    generateRecommendations = rs.generateRecommendations;
    const gs = await import('../src/utils/goalService.js');
    GoalService = gs.GoalService;
    const ach = await import('../src/utils/achievementService.js');
    AchievementService = ach.AchievementService;
  });

  const invariants = (acts) => {
    const agg = computeFullAggregation(acts);
    const breakdown = breakdownByCategory(acts, agg);

    // totals >= 0
    assert.ok(agg.totalSum >= 0, `totalSum >= 0 (got ${agg.totalSum})`);
    assert.ok(agg.todaySum >= 0);
    assert.ok(agg.weeklySum >= 0);
    assert.ok(agg.monthlySum >= 0);

    // emissions >= 0
    assert.ok(agg.totalSum >= 0);

    // activity counts match
    assert.strictEqual(agg.totalActivities, acts.length);

    // byId size matches
    assert.strictEqual(agg.byId.size, acts.length);

    // all activities in byId
    for (const a of acts) {
      assert.ok(agg.byId.has(a.id), `byId has ${a.id}`);
    }

    // typeSum non-negative
    for (const [, v] of agg.typeSum) {
      assert.ok(v >= 0, `typeSum value ${v} >= 0`);
    }

    // dayMap non-negative
    for (const [, v] of agg.dayMap) {
      assert.ok(v >= 0);
    }

    // monthMap non-negative
    for (const [, v] of agg.monthMap) {
      assert.ok(v >= 0);
    }

    // breakdown totals
    const breakdownTotal = breakdown.list.reduce((s, x) => s + x.value, 0);
    assert.ok(Math.abs(breakdownTotal - agg.totalSum) < 0.01);

    // breakdown percentages sum to ~100
    if (breakdown.list.length > 0) {
      const pctSum = breakdown.list.reduce((s, x) => s + x.pct, 0);
      assert.ok(Math.abs(pctSum - 100) < 1 || pctSum === 0);
    }

    // score is valid
    const score = calculateCarbonScore(acts, agg, breakdown);
    assert.ok(score.score >= 0 && score.score <= 100, `score ${score.score} in [0,100]`);
    assert.ok(['Excellent', 'Good', 'Fair', 'Poor'].includes(score.rating));

    // recommendations never crash
    const recs = generateRecommendations(acts, breakdown, agg.monthlySum);
    assert.ok(Array.isArray(recs));
    for (const r of recs) {
      assert.ok(typeof r.title === 'string');
      assert.ok(typeof r.estimatedSavingsKg === 'number');
    }

    // deterministic: same input produces same output
    const agg2 = computeFullAggregation(acts);
    assert.strictEqual(agg2.totalSum, agg.totalSum);
    assert.strictEqual(agg2.totalActivities, agg.totalActivities);
  };

  for (const size of [0, 1, 10, 50, 100, 500]) {
    it(`invariants hold for ${size} random activities (3 runs)`, () => {
      for (let run = 0; run < 3; run++) {
        const acts = generateRandomActivities(size);
        invariants(acts);
      }
    });
  }

  it('aggregateByDay returns constant size for any input', () => {
    for (let run = 0; run < 20; run++) {
      const acts = generateRandomActivities(Math.floor(Math.random() * 200));
      const agg = computeFullAggregation(acts);
      const days = aggregateByDay(acts, 30, agg.dayMap);
      assert.strictEqual(days.length, 30);
    }
  });

  it('aggregateByMonth returns requested month count', () => {
    for (let run = 0; run < 10; run++) {
      const acts = generateRandomActivities(Math.floor(Math.random() * 100));
      const agg = computeFullAggregation(acts);
      const months = aggregateByMonth(acts, 12, agg.monthMap);
      assert.strictEqual(months.length, 12);
    }
  });

  it('goal progress never has NaN values', () => {
    for (let run = 0; run < 20; run++) {
      const acts = generateRandomActivities(Math.floor(Math.random() * 50));
      const goal = Math.random() > 0.3 ? { targetKg: Math.floor(Math.random() * 200) + 10 } : null;
      const p = GoalService.computeProgress(acts, goal);
      assert.ok(!Number.isNaN(p.current));
      assert.ok(!Number.isNaN(p.percent));
      assert.ok(typeof p.daysRemaining === 'number');
      assert.ok(!Number.isNaN(p.daysRemaining));
    }
  });

  it('achievements never crash for random data', () => {
    for (let run = 0; run < 20; run++) {
      const acts = generateRandomActivities(Math.floor(Math.random() * 50));
      const goal = Math.random() > 0.3 ? { targetKg: Math.floor(Math.random() * 200) + 10 } : null;
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, goal, agg);
      assert.strictEqual(r.achievements.length, 10);
      assert.ok(Array.isArray(r.achievements));
    }
  });

  it('aggregation is deterministic (same input = same output)', () => {
    const acts = generateRandomActivities(100);
    const r1 = computeFullAggregation(acts);
    const r2 = computeFullAggregation(acts);
    assert.strictEqual(r1.totalSum, r2.totalSum);
    assert.strictEqual(r1.todaySum, r2.todaySum);
    assert.strictEqual(r1.weeklySum, r2.weeklySum);
    assert.strictEqual(r1.monthlySum, r2.monthlySum);
    assert.strictEqual(r1.totalActivities, r2.totalActivities);
    assert.strictEqual(r1.typeCounts.bus, r2.typeCounts.bus);
    assert.strictEqual(r1.typeCounts.carShort, r2.typeCounts.carShort);
  });
});
