import { computeFullAggregation, breakdownByCategory } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { clamp } from '../domain/mathUtils.js';
import { InvariantEngine } from './invariantEngine.js';

const computeScore = (monthly, typeMap) => {
  let totalPenalty = 0;
  if (monthly > 50) {
    const over = clamp((monthly - 50) / (1000 - 50), 0, 1);
    totalPenalty += over * 50;
  }
  const getPct = (type) => { const e = typeMap.get(type); return e ? e.pct : 0; };
  totalPenalty += getPct('Car') * 0.3;
  totalPenalty += getPct('Flight') * 0.5;
  totalPenalty += getPct('Electricity') * 0.2;
  totalPenalty += getPct('Food') * 0.15;
  totalPenalty += getPct('Waste') * 0.1;

  const publicPct = getPct('Bus') + getPct('Train');
  const bonus = publicPct * 0.25;

  return { score: Math.round(clamp(100 - totalPenalty + bonus, 0, 100)), publicPct };
};

const computeTrend = (monthMap) => {
  const keys = Array.from(monthMap.keys()).sort();
  if (keys.length >= 2) {
    const last = keys[keys.length - 1];
    const prev = keys[keys.length - 2];
    const lastVal = monthMap.get(last) || 0;
    const prevVal = monthMap.get(prev) || 0;
    if (prevVal > 0) {
      const diff = (prevVal - lastVal) / prevVal;
      if (diff > 0.05) return 'Improving';
      if (diff < -0.03) return 'Declining';
    }
  }
  return 'Stable';
};

const computeRating = (score) =>
  score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Poor';

export const calculateCarbonScore = (activities, precomputedFullAgg = null, precomputedBreakdown = null) => {
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

  const fullAgg = precomputedFullAgg || computeFullAggregation(activities);
  const monthly = fullAgg.monthlySum || 0;
  const breakdown = precomputedBreakdown || breakdownByCategory(activities, fullAgg);

  const typeMap = new Map(breakdown.list.map(l => [l.type, l]));
  const { score, publicPct } = computeScore(monthly, typeMap);
  const rating = computeRating(score);
  const trend = computeTrend(fullAgg.monthMap);
  const biggestContributor = breakdown.list.length > 0 ? breakdown.list[0].type : null;

  let positiveHabit = null;
  if (publicPct >= 30) positiveHabit = 'High public transport usage';
  else if (monthly <= 50) positiveHabit = 'Low monthly emissions';

  const recs = generateRecommendations(activities, breakdown, monthly);
  const top = recs && recs.length > 0 ? recs[0].suggestion : 'Review activity breakdown to find improvements';

  const shortExplanation = `Score calculated from monthly CO₂ (${monthly} kg) and activity mix. Biggest contributor: ${biggestContributor || 'N/A'}.`;

  const result = { score, rating, trend, biggestContributor, positiveHabit, topImprovement: top, shortExplanation };
  InvariantEngine.verify('scoreRange', result);
  return result;
};


