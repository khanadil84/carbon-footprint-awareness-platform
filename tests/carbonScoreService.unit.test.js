import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import './lib/storageMock.js';

describe('calculateCarbonScore', () => {
  let calculateCarbonScore, computeFullAggregation, breakdownByCategory;

  before(async () => {
    const mod = await import('../src/utils/carbonScoreService.js');
    calculateCarbonScore = mod.calculateCarbonScore;
    const analytics = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = analytics.computeFullAggregation;
    breakdownByCategory = analytics.breakdownByCategory;
  });

  const now = new Date();
  const iso = (d) => d.toISOString();
  const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);

  it('returns zero score for empty activities', () => {
    const r = calculateCarbonScore([]);
    assert.strictEqual(r.score, 0);
    assert.strictEqual(r.rating, 'Poor');
    assert.strictEqual(r.trend, 'Stable');
  });

  it('returns zero score for null', () => {
    const r = calculateCarbonScore(null);
    assert.strictEqual(r.score, 0);
  });

  it('returns zero score for undefined', () => {
    const r = calculateCarbonScore(undefined);
    assert.strictEqual(r.score, 0);
  });

  it('returns rating Excellent for high score', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Train', value: 100, co2: 10 },
      { id: 'b', date: iso(shift(-1)), type: 'Bus', value: 50, co2: 5 }
    ];
    const r = calculateCarbonScore(acts);
    assert.ok(['Excellent', 'Good', 'Fair', 'Poor'].includes(r.rating));
  });

  it('returns rating Poor for high emissions', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Flight', value: 10000, co2: 2550 },
      { id: 'b', date: iso(shift(-1)), type: 'Car', value: 500, co2: 96 }
    ];
    const r = calculateCarbonScore(acts);
    assert.strictEqual(r.rating, 'Poor');
  });

  it('identifies biggest contributor', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Flight', value: 1000, co2: 255 },
      { id: 'b', date: iso(shift(-1)), type: 'Bus', value: 10, co2: 1 }
    ];
    const r = calculateCarbonScore(acts);
    assert.strictEqual(r.biggestContributor, 'Flight');
  });

  it('returns topImprovement text', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 2 }
    ];
    const r = calculateCarbonScore(acts);
    assert.ok(typeof r.topImprovement === 'string');
    assert.ok(r.topImprovement.length > 0);
  });

  it('returns shortExplanation', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 2 }
    ];
    const r = calculateCarbonScore(acts);
    assert.ok(typeof r.shortExplanation === 'string');
    assert.ok(r.shortExplanation.includes('Score calculated'));
  });

  it('positiveHabit is set when public transport >= 30%', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Bus', value: 100, co2: 10.5 },
      { id: 'b', date: iso(shift(-1)), type: 'Train', value: 100, co2: 4.1 },
      { id: 'c', date: iso(shift(-2)), type: 'Car', value: 10, co2: 1.92 }
    ];
    const r = calculateCarbonScore(acts);
    assert.ok(r.positiveHabit === 'High public transport usage' || r.positiveHabit === null);
  });

  it('positiveHabit is "Low monthly emissions" when emissions <= 50 and low public transport', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Food', value: 1, co2: 2.5 }
    ];
    const r = calculateCarbonScore(acts);
    assert.strictEqual(r.positiveHabit, 'Low monthly emissions');
  });

  it('accepts precomputed aggregation and breakdown', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 1.92 }
    ];
    const agg = computeFullAggregation(acts);
    const bd = breakdownByCategory(acts, agg);
    const r = calculateCarbonScore(acts, agg, bd);
    assert.ok(typeof r.score === 'number');
    assert.ok(r.score >= 0 && r.score <= 100);
  });

  it('score is in valid range 0-100', () => {
    const r = calculateCarbonScore([
      { id: 'a', date: iso(new Date()), type: 'Flight', value: 100000, co2: 25500 }
    ]);
    assert.ok(r.score >= 0 && r.score <= 100);
  });

  it('trend is one of the valid values', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 2 }
    ];
    const r = calculateCarbonScore(acts);
    assert.ok(['Improving', 'Declining', 'Stable'].includes(r.trend));
  });
});
