import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import './lib/storageMock.js';

describe('generateRecommendations', () => {
  let generateRecommendations, breakdownByCategory, computeFullAggregation;

  before(async () => {
    const mod = await import('../src/utils/recommendationService.js');
    generateRecommendations = mod.generateRecommendations;
    const analytics = await import('../src/utils/activityAnalytics.js');
    breakdownByCategory = analytics.breakdownByCategory;
    computeFullAggregation = analytics.computeFullAggregation;
  });

  const now = new Date();
  const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const iso = (d) => d.toISOString();

  const make = (overrides) => ({
    id: overrides.id || 'x',
    date: overrides.date || iso(new Date()),
    type: overrides.type || 'Car',
    value: overrides.value ?? 10,
    co2: overrides.co2 ?? 2.5,
    ...overrides
  });

  it('returns empty rec for no activities', () => {
    const recs = generateRecommendations([]);
    assert.strictEqual(recs.length, 1);
    assert.ok(recs[0].title.includes('No activity'));
  });

  it('returns empty rec for null', () => {
    const recs = generateRecommendations(null);
    assert.strictEqual(recs.length, 1);
  });

  it('returns empty rec for undefined', () => {
    const recs = generateRecommendations(undefined);
    assert.strictEqual(recs.length, 1);
  });

  it('returns low emissions rec when monthly total <= 50', () => {
    const acts = [make({ type: 'Car', co2: 5 })];
    const recs = generateRecommendations(acts);
    const hasLow = recs.some(r => r.title.includes('Excellent low-emission'));
    assert.ok(hasLow);
  });

  it('returns high car rec when car usage is high', () => {
    const acts = [
      make({ type: 'Car', co2: 60, value: 100 }),
      make({ type: 'Bus', co2: 5, value: 10 }),
      make({ type: 'Train', co2: 3, value: 10 })
    ];
    const recs = generateRecommendations(acts);
    const hasCar = recs.some(r => r.title.includes('High car travel'));
    assert.ok(hasCar);
  });

  it('returns public transit rec when bus >= 35%', () => {
    const acts = [
      make({ type: 'Bus', co2: 35, value: 50 }),
      make({ type: 'Car', co2: 10, value: 10 })
    ];
    const recs = generateRecommendations(acts);
    const hasTransit = recs.some(r => r.title.includes('public transit'));
    assert.ok(hasTransit);
  });

  it('returns flight rec when flights are high', () => {
    const acts = [
      make({ type: 'Flight', co2: 210, value: 1000 }),
      make({ type: 'Car', co2: 10, value: 10 })
    ];
    const recs = generateRecommendations(acts);
    const hasFlight = recs.some(r => r.title.includes('Frequent flights'));
    assert.ok(hasFlight);
  });

  it('returns electricity rec when high', () => {
    const acts = [
      make({ type: 'Electricity', co2: 160, value: 400 }),
      make({ type: 'Car', co2: 10, value: 10 })
    ];
    const recs = generateRecommendations(acts);
    const hasElec = recs.some(r => r.title.includes('High electricity'));
    assert.ok(hasElec);
  });

  it('returns food rec when food is high', () => {
    const acts = [
      make({ type: 'Food', co2: 110, value: 50 }),
      make({ type: 'Car', co2: 10, value: 10 })
    ];
    const recs = generateRecommendations(acts);
    const hasFood = recs.some(r => r.title.includes('High food-related'));
    assert.ok(hasFood);
  });

  it('returns waste rec when waste is high', () => {
    const acts = [
      make({ type: 'Waste', co2: 55, value: 100 }),
      make({ type: 'Car', co2: 10, value: 10 })
    ];
    const recs = generateRecommendations(acts);
    const hasWaste = recs.some(r => r.title.includes('High waste'));
    assert.ok(hasWaste);
  });

  it('always returns at least one recommendation with valid structure', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', co2: 30, value: 150 },
      { id: 'b', date: iso(shift(-1)), type: 'Electricity', co2: 20, value: 40 }
    ];
    const recs = generateRecommendations(acts);
    assert.ok(recs.length >= 1);
    for (const r of recs) {
      assert.ok(typeof r.title === 'string' && r.title.length > 0);
      assert.ok(typeof r.description === 'string');
      assert.ok(typeof r.priority === 'string');
      assert.ok(typeof r.estimatedSavingsKg === 'number');
      assert.ok(r.estimatedSavingsKg >= 0);
    }
  });

  it('sorts recs by priority', () => {
    const acts = [
      make({ type: 'Car', co2: 120, value: 600 }),
      make({ type: 'Electricity', co2: 160, value: 400 }),
      make({ type: 'Food', co2: 110, value: 50 })
    ];
    const recs = generateRecommendations(acts);
    const priorities = recs.map(r => r.priority);
    const order = { High: 0, Medium: 1, Low: 2 };
    for (let i = 1; i < priorities.length; i++) {
      assert.ok(order[priorities[i - 1]] <= order[priorities[i]]);
    }
  });

  it('accepts precomputed breakdown', () => {
    const acts = [make({ type: 'Car', co2: 60, value: 100 })];
    const agg = computeFullAggregation(acts);
    const bd = breakdownByCategory(acts, agg);
    const recs = generateRecommendations(acts, bd, agg.monthlySum);
    assert.ok(recs.length > 0);
  });

  it('estimatedSavingsKg is a number', () => {
    const acts = [make({ type: 'Car', co2: 60, value: 100 })];
    const recs = generateRecommendations(acts);
    for (const r of recs) {
      assert.ok(typeof r.estimatedSavingsKg === 'number');
      assert.ok(r.estimatedSavingsKg >= 0);
    }
  });
});
