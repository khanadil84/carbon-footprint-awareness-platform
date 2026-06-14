import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeFullAggregation, aggregate, breakdownByCategory,
  aggregateByDay, aggregateByWeek, aggregateByMonth,
  summaryStats
} from '../src/utils/activityAnalytics.js';

const now = new Date();
const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
const iso = (d) => d.toISOString();

const makeActivities = () => [
  { id: 'a1', date: iso(shift(0)), type: 'Car', value: '10', co2: 2.5 },
  { id: 'a2', date: iso(shift(-1)), type: 'Bus', value: '20', co2: 1.0 },
  { id: 'a3', date: iso(shift(-3)), type: 'Car', value: '5', co2: 3.5 },
  { id: 'a4', date: iso(shift(-8)), type: 'Electricity', value: '100', co2: 10.0 },
  { id: 'a5', date: iso(shift(-40)), type: 'Train', value: '50', co2: 0.5 }
];

describe('computeFullAggregation', () => {
  it('returns zero totals for empty activities', () => {
    const agg = computeFullAggregation([]);
    assert.strictEqual(agg.todaySum, 0);
    assert.strictEqual(agg.weeklySum, 0);
    assert.strictEqual(agg.monthlySum, 0);
    assert.strictEqual(agg.totalSum, 0);
    assert.strictEqual(agg.totalActivities, 0);
    assert.strictEqual(agg.typeCounts.bus, 0);
    assert.strictEqual(agg.typeCounts.train, 0);
    assert.strictEqual(agg.typeCounts.carShort, 0);
  });

  it('computes totals correctly', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.todaySum > 0);
    assert.ok(agg.totalSum > 0);
    assert.strictEqual(agg.totalActivities, 5);
  });

  it('builds byId map', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.byId.size, 5);
    assert.ok(agg.byId.has('a1'));
  });

  it('builds byType map', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.byType.has('Car'));
    assert.strictEqual(agg.byType.get('Car').length, 2);
  });

  it('builds byMonth map', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.byMonth.size >= 1);
  });

  it('builds byCategory map', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.byCategory.has('Travel'));
    assert.ok(agg.byCategory.has('Home'));
  });

  it('builds dateActivityCounts', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.dateActivityCounts.size >= 1);
  });

  it('populates typeSum', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.typeSum.has('Car'));
    assert.ok(agg.typeSum.has('Bus'));
    assert.ok(agg.typeSum.has('Train'));
  });

  it('builds dayMap', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.dayMap.size >= 1);
  });

  it('builds monthMap', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.monthMap.size >= 1);
  });

  it('counts typeCounts correctly', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    assert.ok(agg.typeCounts.bus >= 0);
    assert.ok(agg.typeCounts.train >= 0);
    assert.ok(agg.typeCounts.carShort >= 0);
  });

  it('handles single activity', () => {
    const acts = [{ id: 'x', date: iso(new Date()), type: 'Car', value: '10', co2: 1.5 }];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.totalSum, 1.5);
    assert.strictEqual(agg.byId.size, 1);
  });

  it('handles activities with missing co2 as 0', () => {
    const acts = [{ id: 'x', date: iso(new Date()), type: 'Car', value: '10' }];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.totalSum, 0);
  });

  it('handles activities with NaN co2 as 0', () => {
    const acts = [{ id: 'x', date: iso(new Date()), type: 'Car', value: '10', co2: NaN }];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.totalSum, 0);
  });

  it('categorizes Travel types correctly', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: '10', co2: 1 },
      { id: 'b', date: iso(new Date()), type: 'Bus', value: '10', co2: 1 },
      { id: 'c', date: iso(new Date()), type: 'Train', value: '10', co2: 1 },
      { id: 'd', date: iso(new Date()), type: 'Flight', value: '10', co2: 1 }
    ];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.byCategory.get('Travel').length, 4);
  });

  it('categorizes Home types correctly', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Electricity', value: '10', co2: 1 },
      { id: 'b', date: iso(new Date()), type: 'Waste', value: '10', co2: 1 }
    ];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.byCategory.get('Home').length, 2);
  });

  it('categorizes Food correctly', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Food', value: '10', co2: 1 }
    ];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.byCategory.get('Food').length, 1);
  });

  it('counts short car trips (value <= 2)', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: '1', co2: 1 },
      { id: 'b', date: iso(new Date()), type: 'Car', value: '2', co2: 1 },
      { id: 'c', date: iso(new Date()), type: 'Car', value: '5', co2: 1 }
    ];
    const agg = computeFullAggregation(acts);
    assert.strictEqual(agg.typeCounts.carShort, 2);
  });
});

describe('aggregate', () => {
  it('returns totals and score for activities', () => {
    const acts = makeActivities();
    const r = aggregate(acts);
    assert.ok(r.totals);
    assert.ok(typeof r.score === 'number');
    assert.ok(r.score >= 0 && r.score <= 100);
  });

  it('returns zero score for empty activities', () => {
    const r = aggregate([]);
    assert.strictEqual(r.totals.total, 0);
    assert.strictEqual(r.score, 100);
  });
});

describe('breakdownByCategory', () => {
  it('returns breakdown with totals', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const b = breakdownByCategory(acts, agg);
    assert.ok(b.total > 0);
    assert.ok(b.list.length > 0);
    assert.ok(b.list[0].type);
    assert.ok(typeof b.list[0].pct === 'number');
  });

  it('computes percentages correctly', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const b = breakdownByCategory(acts, agg);
    const sumPct = b.list.reduce((s, x) => s + x.pct, 0);
    assert.ok(Math.abs(sumPct - 100) < 1 || sumPct === 0);
  });

  it('returns empty list for no activities', () => {
    const agg = computeFullAggregation([]);
    const b = breakdownByCategory([], agg);
    assert.strictEqual(b.total, 0);
    assert.strictEqual(b.list.length, 0);
  });

  it('sorts by value descending', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: '10', co2: 10 },
      { id: 'b', date: iso(new Date()), type: 'Bus', value: '10', co2: 1 }
    ];
    const agg = computeFullAggregation(acts);
    const b = breakdownByCategory(acts, agg);
    assert.ok(b.list[0].value >= b.list[1].value);
  });
});

describe('aggregateByDay', () => {
  it('returns requested number of days', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const days = aggregateByDay(acts, 10, agg.dayMap);
    assert.strictEqual(days.length, 10);
  });

  it('all entries are numeric', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const days = aggregateByDay(acts, 5, agg.dayMap);
    for (const d of days) {
      assert.ok(typeof d.date === 'string');
      assert.ok(typeof d.value === 'number');
      assert.ok(d.value >= 0);
    }
  });

  it('works without fullDayMap', () => {
    const acts = makeActivities();
    const days = aggregateByDay(acts, 3, null);
    assert.strictEqual(days.length, 3);
  });
});

describe('aggregateByWeek', () => {
  it('returns requested number of weeks', () => {
    const acts = makeActivities();
    const weeks = aggregateByWeek(acts, 4);
    assert.strictEqual(weeks.length, 4);
  });

  it('all entries are numeric', () => {
    const acts = makeActivities();
    const weeks = aggregateByWeek(acts, 3);
    for (const w of weeks) {
      assert.ok(typeof w.label === 'string');
      assert.ok(typeof w.value === 'number');
      assert.ok(w.value >= 0);
    }
  });

  it('handles empty activities', () => {
    const weeks = aggregateByWeek([], 4);
    assert.strictEqual(weeks.length, 4);
    for (const w of weeks) assert.strictEqual(w.value, 0);
  });
});

describe('aggregateByMonth', () => {
  it('returns requested number of months', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const months = aggregateByMonth(acts, 6, agg.monthMap);
    assert.strictEqual(months.length, 6);
  });

  it('works without fullMonthMap', () => {
    const acts = makeActivities();
    const months = aggregateByMonth(acts, 3, null);
    assert.strictEqual(months.length, 3);
  });

  it('all values are >= 0', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const months = aggregateByMonth(acts, 6, agg.monthMap);
    for (const m of months) assert.ok(m.value >= 0);
  });
});

describe('summaryStats', () => {
  it('returns stats for activities', () => {
    const acts = makeActivities();
    const agg = computeFullAggregation(acts);
    const s = summaryStats(acts, agg);
    assert.ok(s.totalActivities > 0);
    assert.ok(typeof s.avgDaily === 'number');
    assert.ok(s.avgDaily >= 0);
    assert.ok(s.highestEmissionCategory);
  });

  it('returns defaults for empty activities', () => {
    const s = summaryStats([], null);
    assert.strictEqual(s.totalActivities, 0);
    assert.strictEqual(s.avgDaily, 0);
    assert.strictEqual(s.highestEmissionCategory, null);
    assert.strictEqual(s.bestDay, null);
  });

  it('computes avgDaily from last 30 days', () => {
    const acts = [
      { id: 'a', date: iso(new Date()), type: 'Car', value: '10', co2: 10 },
      { id: 'b', date: iso(shift(-1)), type: 'Car', value: '10', co2: 10 }
    ];
    const agg = computeFullAggregation(acts);
    const s = summaryStats(acts, agg);
    assert.ok(s.avgDaily > 0);
    assert.ok(s.bestDay !== null);
  });
});
