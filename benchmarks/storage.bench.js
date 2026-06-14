import { ActivityService } from '../src/utils/activityService.js';
import { generateActivities, run } from './helpers.js';

console.log('\n=== Storage Benchmarks ===\n');

[10, 100, 1000].forEach(count => {
  console.log(`\n--- ${count} activities ---`);

  run('loadActivities + computeFullAggregation', () => {
    ActivityService.loadActivities();
  }, 50);

  run('saveActivities', () => {
    ActivityService.saveActivities(generateActivities(count));
  }, 20);

  console.log();
});
