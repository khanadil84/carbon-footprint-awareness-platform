import { computeFullAggregation, breakdownByCategory } from '../src/utils/activityAnalytics.js';
import { generateRecommendations } from '../src/utils/recommendationService.js';
import { generateActivities, run } from './helpers.js';

console.log('\n=== Recommendation Benchmarks ===\n');

[10, 100, 1000].forEach(count => {
  const activities = generateActivities(count);
  const agg = computeFullAggregation(activities);
  const breakdown = breakdownByCategory(activities, agg);
  console.log(`\n--- ${count} activities ---`);

  run('generateRecommendations', () => {
    generateRecommendations(activities, breakdown, agg.monthlySum);
  }, 100);

  console.log();
});
