import { activityService } from './activityService';
import { breakdownByCategory, aggregateByMonth } from './activityAnalytics';
import { generateRecommendations } from './recommendationService';

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

export const calculateCarbonScore = (activities) => {
  if (!activities || activities.length === 0) {
    return {
      score: 0,
      rating: 'Poor',
      trend: 'Stable',
      biggestContributor: null,
      positiveHabit: null,
      topImprovement: 'Add activities to get personalized score',
      shortExplanation: 'No activity data available to calculate a carbon score.'
    };
  }

  const agg = activityService.aggregate(activities);
  const monthly = agg.totals.monthly || 0;
  const breakdown = breakdownByCategory(activities);

  // Determine category values and percentages
  const find = (type) => breakdown.list.find(l => l.type === type) || { type, value: 0, pct: 0 };
  const car = find('Car');
  const flight = find('Flight');
  const electricity = find('Electricity');
  const food = find('Food');
  const waste = find('Waste');
  const bus = find('Bus');
  const train = find('Train');

  // Base score 100, subtract penalties
  // Total monthly penalty: 0 -> 50 (linear from 50kg to 1000kg)
  let totalPenalty = 0;
  if (monthly > 50) {
    const over = clamp((monthly - 50) / (1000 - 50), 0, 1);
    totalPenalty += over * 50; // up to 50 points
  }

  // Category penalties scaled by percentage share
  totalPenalty += car.pct * 0.3;      // per pct
  totalPenalty += flight.pct * 0.5;
  totalPenalty += electricity.pct * 0.2;
  totalPenalty += food.pct * 0.15;
  totalPenalty += waste.pct * 0.1;

  // Public transport bonus
  const publicPct = (bus.pct || 0) + (train.pct || 0);
  const bonus = publicPct * 0.25; // up to ~25

  let raw = 100 - totalPenalty + bonus;
  const score = Math.round(clamp(raw, 0, 100));

  // Rating bands
  const rating = score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

  // Trend: compare last two months
  const months = aggregateByMonth(activities, 3); // oldest -> newest
  let trend = 'Stable';
  if (months && months.length >= 2) {
    const last = months[months.length - 1].value || 0;
    const prev = months[months.length - 2].value || 0;
    if (prev > 0) {
      const diff = (prev - last) / prev;
      if (diff > 0.05) trend = 'Improving';
      else if (diff < -0.03) trend = 'Declining';
    }
  }

  const biggestContributor = breakdown.list.length > 0 ? breakdown.list[0].type : null;

  let positiveHabit = null;
  if (publicPct >= 30) positiveHabit = 'High public transport usage';
  else if (monthly <= 50) positiveHabit = 'Low monthly emissions';

  // Top improvement: reuse recommendation service highest priority
  const recs = generateRecommendations(activities);
  const top = recs && recs.length > 0 ? recs[0].suggestion : 'Review activity breakdown to find improvements';

  const shortExplanation = `Score calculated from monthly CO₂ (${monthly} kg) and activity mix. Biggest contributor: ${biggestContributor || 'N/A'}.`;

  return {
    score,
    rating,
    trend,
    biggestContributor,
    positiveHabit,
    topImprovement: top,
    shortExplanation
  };
};

export default { calculateCarbonScore };
