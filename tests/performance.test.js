import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import './lib/storageMock.js';

const TYPES = ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Food', 'Waste'];

const generateActivities = (count) => {
  const now = new Date();
  const acts = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - Math.floor(Math.random() * 90));
    acts.push({
      id: `perf_${i}`,
      date: d.toISOString(),
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      value: Math.floor(Math.random() * 100) + 1,
      co2: parseFloat((Math.random() * 15).toFixed(3))
    });
  }
  return acts;
};

const measure = (label, fn, iterations = 10) => {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push(end - start);
  }
  let sum = 0, min = Infinity, max = -Infinity;
  for (const t of times) { sum += t; if (t < min) min = t; if (t > max) max = t; }
  return { avg: sum / times.length, min, max };
};

describe('Performance Tests', () => {
  let computeFullAggregation, breakdownByCategory, summaryStats, aggregateByDay;
  let calculateCarbonScore, generateRecommendations;

  before(async () => {
    const an = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = an.computeFullAggregation;
    breakdownByCategory = an.breakdownByCategory;
    summaryStats = an.summaryStats;
    aggregateByDay = an.aggregateByDay;
    const cs = await import('../src/utils/carbonScoreService.js');
    calculateCarbonScore = cs.calculateCarbonScore;
    const rs = await import('../src/utils/recommendationService.js');
    generateRecommendations = rs.generateRecommendations;
  });

  const sizes = [10, 100, 1000];
  const thresholds = {
    10: { computeFullAggregation: 5, breakdownByCategory: 2, summaryStats: 5, generateRecommendations: 5, calculateCarbonScore: 10, aggregateByDay: 2 },
    100: { computeFullAggregation: 10, breakdownByCategory: 5, summaryStats: 10, generateRecommendations: 5, calculateCarbonScore: 20, aggregateByDay: 5 },
    1000: { computeFullAggregation: 50, breakdownByCategory: 10, summaryStats: 20, generateRecommendations: 10, calculateCarbonScore: 50, aggregateByDay: 10 }
  };

  for (const size of sizes) {
    describe(`${size} activities`, () => {
      let acts, agg;

      before(() => {
        acts = generateActivities(size);
        agg = computeFullAggregation(acts);
      });

      it(`computeFullAggregation avg < ${thresholds[size].computeFullAggregation}ms`, () => {
        const result = measure('', () => computeFullAggregation(acts), 20);
        assert.ok(result.avg < thresholds[size].computeFullAggregation, `avg ${result.avg.toFixed(2)}ms >= ${thresholds[size].computeFullAggregation}ms`);
      });

      it(`breakdownByCategory avg < ${thresholds[size].breakdownByCategory}ms`, () => {
        const result = measure('', () => breakdownByCategory(acts, agg), 50);
        assert.ok(result.avg < thresholds[size].breakdownByCategory, `avg ${result.avg.toFixed(3)}ms`);
      });

      it(`summaryStats avg < ${thresholds[size].summaryStats}ms`, () => {
        const result = measure('', () => summaryStats(acts, agg), 50);
        assert.ok(result.avg < thresholds[size].summaryStats, `avg ${result.avg.toFixed(3)}ms`);
      });

      it(`aggregateByDay avg < ${thresholds[size].aggregateByDay}ms`, () => {
        const result = measure('', () => aggregateByDay(acts, 30, agg.dayMap), 50);
        assert.ok(result.avg < thresholds[size].aggregateByDay, `avg ${result.avg.toFixed(3)}ms`);
      });

      it(`generateRecommendations avg < ${thresholds[size].generateRecommendations}ms`, () => {
        const breakdown = breakdownByCategory(acts, agg);
        const result = measure('', () => generateRecommendations(acts, breakdown, agg.monthlySum), 50);
        assert.ok(result.avg < thresholds[size].generateRecommendations, `avg ${result.avg.toFixed(3)}ms`);
      });

      it(`calculateCarbonScore avg < ${thresholds[size].calculateCarbonScore}ms`, () => {
        const breakdown = breakdownByCategory(acts, agg);
        const result = measure('', () => calculateCarbonScore(acts, agg, breakdown), 30);
        assert.ok(result.avg < thresholds[size].calculateCarbonScore, `avg ${result.avg.toFixed(2)}ms`);
      });
    });
  }
});
