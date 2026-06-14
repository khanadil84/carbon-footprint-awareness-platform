import { computeFullAggregation, breakdownByCategory, summaryStats, aggregateByDay } from '../src/utils/activityAnalytics.js';
import { generateActivities, run } from './helpers.js';

console.log('\n=== Analytics Benchmarks ===\n');

[10, 100, 1000, 5000].forEach(count => {
  const activities = generateActivities(count);
  console.log(`\n--- ${count} activities ---`);

  run('computeFullAggregation', () => {
    computeFullAggregation(activities);
  }, 50);

  const agg = computeFullAggregation(activities);

  run('breakdownByCategory', () => {
    breakdownByCategory(activities, agg);
  }, 200);

  run('summaryStats', () => {
    summaryStats(activities, agg);
  }, 200);

  run('aggregateByDay(30)', () => {
    aggregateByDay(activities, 30, agg.dayMap);
  }, 200);

  console.log();
});
