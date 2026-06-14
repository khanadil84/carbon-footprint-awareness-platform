import { computeFullAggregation } from '../src/utils/activityAnalytics.js';
import { generateActivities, run } from './helpers.js';
import { toDateKey, pad } from '../src/domain/dateUtils.js';

console.log('\n=== Aggregation Strategy Benchmarks ===\n');

[10, 100, 1000, 5000].forEach(count => {
  const activities = generateActivities(count);
  console.log(`\n--- ${count} activities ---`);

  run('fullRecompute', () => {
    computeFullAggregation(activities);
  }, 50);

  const agg = computeFullAggregation(activities);
  const newEntry = {
    id: 'bench-new',
    date: new Date().toISOString(),
    type: 'Car',
    value: '10',
    co2: 2.5
  };

  run('incrementalAdd (simulated)', () => {
    const d = new Date(newEntry.date);
    const co2 = Number(newEntry.co2) || 0;
    const aggCpy = {
      ...agg,
      byId: new Map(agg.byId),
      byType: new Map(agg.byType),
      byMonth: new Map(agg.byMonth),
      byCategory: new Map(agg.byCategory),
      dayMap: new Map(agg.dayMap),
      monthMap: new Map(agg.monthMap),
      typeSum: new Map(agg.typeSum),
      dateActivityCounts: new Map(agg.dateActivityCounts),
      typeCounts: { ...agg.typeCounts }
    };
    const dk = toDateKey(d);
    const mk = `${d.getFullYear()}-${pad(d.getMonth()+1)}`;
    if (d >= aggCpy.startOfDay) aggCpy.todaySum += co2;
    if (d >= aggCpy.startOfWeek) aggCpy.weeklySum += co2;
    if (d >= aggCpy.startOfMonth) aggCpy.monthlySum += co2;
    aggCpy.totalSum += co2;
    aggCpy.dayMap.set(dk, (aggCpy.dayMap.get(dk) || 0) + co2);
    aggCpy.monthMap.set(mk, (aggCpy.monthMap.get(mk) || 0) + co2);
    aggCpy.typeSum.set(newEntry.type, (aggCpy.typeSum.get(newEntry.type) || 0) + co2);
    aggCpy.byId.set(newEntry.id, newEntry);
    const byTypeList = aggCpy.byType.get(newEntry.type);
    if (byTypeList) byTypeList.push(newEntry);
    else aggCpy.byType.set(newEntry.type, [newEntry]);
    const cat = newEntry.type === 'Car' || newEntry.type === 'Bus' || newEntry.type === 'Train' || newEntry.type === 'Flight' ? 'Travel' : newEntry.type === 'Electricity' || newEntry.type === 'Waste' ? 'Home' : 'Food';
    const byCatList = aggCpy.byCategory.get(cat);
    if (byCatList) byCatList.push(newEntry);
    else aggCpy.byCategory.set(cat, [newEntry]);
    const ak = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    aggCpy.dateActivityCounts.set(ak, (aggCpy.dateActivityCounts.get(ak) || 0) + 1);
    if (newEntry.type === 'Bus') aggCpy.typeCounts.bus++;
    else if (newEntry.type === 'Train') aggCpy.typeCounts.train++;
    else if (newEntry.type === 'Car' && Number(newEntry.value) <= 2) aggCpy.typeCounts.carShort++;
    aggCpy.totalActivities++;
  }, 50);

  console.log();
});
