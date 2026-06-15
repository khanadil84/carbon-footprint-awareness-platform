import { computeFullAggregation, breakdownByCategory } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { clamp } from '../domain/mathUtils.js';
import { InvariantEngine } from './invariantEngine.js';

const computeScore = (monthly, typeMap) => {
  let totalPenalty = 0;
  if (monthly > 50) {
    const normalizedExcess = clamp((monthly - 50) / (1000 - 50), 0, 1);
    totalPenalty += normalizedExcess * 50;
  }
  const getPercentage = (type) => { const entry = typeMap.get(type); return entry ? entry.pct : 0; };
  totalPenalty += getPercentage('Car') * 0.3;
  totalPenalty += getPercentage('Flight') * 0.5;
  totalPenalty += getPercentage('Electricity') * 0.2;
  totalPenalty += getPercentage('Food') * 0.15;
  totalPenalty += getPercentage('Waste') * 0.1;

  const publicTransportPercentage = getPercentage('Bus') + getPercentage('Train');
  const bonus = publicTransportPercentage * 0.25;
  const score = Math.round(clamp(100 - totalPenalty + bonus, 0, 100));
  return { score, publicTransportPercentage };
};

const computeTrend = (monthMap) => {
  const sortedKeys = Array.from(monthMap.keys()).sort();
  if (sortedKeys.length < 2) return 'Stable';

  const latestKey = sortedKeys[sortedKeys.length - 1];
  const previousKey = sortedKeys[sortedKeys.length - 2];
  const latestValue = monthMap.get(latestKey) || 0;
  const previousValue = monthMap.get(previousKey) || 0;

  if (previousValue <= 0) return 'Stable';
  const relativeChange = (previousValue - latestValue) / previousValue;
  if (relativeChange > 0.05) return 'Improving';
  if (relativeChange < -0.03) return 'Declining';
  return 'Stable';
};

const computeRating = (score) => {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
};

export const calculateCarbonScore = (activities, precomputedAggregation = null, precomputedBreakdown = null) => {
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

  const aggregation = precomputedAggregation || computeFullAggregation(activities);
  const monthly = aggregation.monthlySum || 0;
  const breakdown = precomputedBreakdown || breakdownByCategory(activities, aggregation);

  const typeMap = new Map(breakdown.list.map(entry => [entry.type, entry]));
  const { score, publicTransportPercentage } = computeScore(monthly, typeMap);
  const rating = computeRating(score);
  const trend = computeTrend(aggregation.monthMap);
  const biggestContributor = breakdown.list.length > 0 ? breakdown.list[0].type : null;

  let positiveHabit = null;
  if (publicTransportPercentage >= 30) positiveHabit = 'High public transport usage';
  else if (monthly <= 50) positiveHabit = 'Low monthly emissions';

  const recommendations = generateRecommendations(activities, breakdown, monthly);
  const topSuggestion = recommendations && recommendations.length > 0
    ? recommendations[0].suggestion
    : 'Review activity breakdown to find improvements';

  const result = {
    score,
    rating,
    trend,
    biggestContributor,
    positiveHabit,
    topImprovement: topSuggestion,
    shortExplanation: `Score calculated from monthly CO₂ (${monthly} kg) and activity mix. Biggest contributor: ${biggestContributor || 'N/A'}.`
  };

  InvariantEngine.verify('scoreRange', result);
  return result;
};
