import { aggregate, breakdownByCategory, aggregateByMonth } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { clamp } from '../domain/mathUtils.js';
import { typeMapFromBreakdown } from '../domain/breakdownUtils.js';

const computeScore = (monthly, car, flight, electricity, food, waste, bus, train) => {
  let totalPenalty = 0;
  if (monthly > 50) {
    const over = clamp((monthly - 50) / (1000 - 50), 0, 1);
    totalPenalty += over * 50;
  }
  totalPenalty += car.pct * 0.3;
  totalPenalty += flight.pct * 0.5;
  totalPenalty += electricity.pct * 0.2;
  totalPenalty += food.pct * 0.15;
  totalPenalty += waste.pct * 0.1;

  const publicPct = (bus.pct || 0) + (train.pct || 0);
  const bonus = publicPct * 0.25;

  return { score: Math.round(clamp(100 - totalPenalty + bonus, 0, 100)), publicPct };
};

const computeTrend = (activities) => {
  const months = aggregateByMonth(activities, 3);
  if (months && months.length >= 2) {
    const last = months[months.length - 1].value || 0;
    const prev = months[months.length - 2].value || 0;
    if (prev > 0) {
      const diff = (prev - last) / prev;
      if (diff > 0.05) return 'Improving';
      if (diff < -0.03) return 'Declining';
    }
  }
  return 'Stable';
};

const computeRating = (score) =>
  score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

/**
 * Calculate an overall carbon score (0-100), rating, trend, and top improvement.
 * Uses aggregate emissions, category breakdown, month-over-month trend,
 * and recommendation service to build a complete scorecard.
 * @param {Array} activities
 * @returns {{score:number, rating:string, trend:string, biggestContributor:string|null, positiveHabit:string|null, topImprovement:string, shortExplanation:string}}
 */
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

  const agg = aggregate(activities);
  const monthly = agg.totals.monthly || 0;
  const breakdown = breakdownByCategory(activities);

  const typeMap = typeMapFromBreakdown(breakdown);
  const get = (type) => typeMap.get(type) || { type, value: 0, pct: 0 };
  const car = get('Car');
  const flight = get('Flight');
  const electricity = get('Electricity');
  const food = get('Food');
  const waste = get('Waste');
  const bus = get('Bus');
  const train = get('Train');

  const { score, publicPct } = computeScore(monthly, car, flight, electricity, food, waste, bus, train);
  const rating = computeRating(score);
  const trend = computeTrend(activities);
  const biggestContributor = breakdown.list.length > 0 ? breakdown.list[0].type : null;

  let positiveHabit = null;
  if (publicPct >= 30) positiveHabit = 'High public transport usage';
  else if (monthly <= 50) positiveHabit = 'Low monthly emissions';

  const recs = generateRecommendations(activities);
  const top = recs && recs.length > 0 ? recs[0].suggestion : 'Review activity breakdown to find improvements';

  const shortExplanation = `Score calculated from monthly CO₂ (${monthly} kg) and activity mix. Biggest contributor: ${biggestContributor || 'N/A'}.`;

  return { score, rating, trend, biggestContributor, positiveHabit, topImprovement: top, shortExplanation };
};


