import { breakdownByCategory } from './activityAnalytics.js';
import { clamp } from '../domain/mathUtils.js';
const priorityOrder = { High: 0, Medium: 1, Low: 2 };

const rec = (title, description, priority, estimatedSavingsKg, suggestion, encouragement = null) => ({
  title,
  description,
  priority,
  estimatedSavingsKg: Number((estimatedSavingsKg || 0).toFixed(3)),
  suggestion,
  encouragement
});

const ruleEmpty = (activities) => {
  if (activities && activities.length > 0) return null;
  return rec('No activity data yet', 'Add activities to get personalized recommendations and track your CO₂ impact.', 'Low', 0, 'Start by adding a recent trip, electricity usage, or food/waste entry.');
};

const ruleLowEmissions = (monthlyTotal) => {
  if (monthlyTotal > 50) return null;
  return rec('Excellent low-emission month', `Your monthly CO₂ total is low (${monthlyTotal} kg).`, 'Low', 0, 'Keep up the good habits — small changes compound over time.', 'Great job — your lifestyle choices are having positive impact.');
};

const rulePublicTransit = (typeMap) => {
  const bus = typeMap.get('Bus');
  const train = typeMap.get('Train');
  if (!((bus && bus.pct >= 35) || (train && train.pct >= 35))) return null;
  return rec('Great use of public transit', 'A high share of your travel is by bus or train.', 'Low', 0, 'Keep using public transit and consider season passes or active travel for short trips.', 'Nice — public transit reduces per-person emissions significantly.');
};

const ruleHighCar = (typeMap, monthlyTotal) => {
  const car = typeMap.get('Car');
  if (!car) return null;
  const isHigh = car.value >= 100 || (car.pct >= 30 && monthlyTotal >= 50);
  if (!isHigh) return null;
  return rec('High car travel detected', `Car travel accounts for ${car.pct}% of your emissions (${car.value} kg).`, 'High', clamp(car.value * 0.25), 'Try carpooling, combine errands, work remotely when possible, or switch short trips to walking/biking.');
};

const ruleHighFlights = (typeMap, monthlyTotal) => {
  const flight = typeMap.get('Flight');
  if (!flight) return null;
  const isHigh = flight.value >= 200 || (flight.pct >= 20 && monthlyTotal >= 100);
  if (!isHigh) return null;
  return rec('Frequent flights detected', `Flights contribute ${flight.pct}% of emissions (${flight.value} kg).`, 'High', clamp(flight.value * 0.4), 'Consider fewer short-haul flights, choose rail where feasible, and combine trips to reduce frequency.');
};

const ruleHighElectricity = (typeMap, monthlyTotal) => {
  const elec = typeMap.get('Electricity');
  if (!elec) return null;
  const isHigh = elec.value >= 150 || (elec.pct >= 25 && monthlyTotal >= 50);
  if (!isHigh) return null;
  return rec('High electricity usage', `Electricity accounts for ${elec.pct}% of your emissions (${elec.value} kg).`, 'Medium', clamp(elec.value * 0.2), 'Switch to LED lighting, optimize heating/cooling, and unplug idle devices to save energy.');
};

const ruleHighFood = (typeMap, monthlyTotal) => {
  const food = typeMap.get('Food');
  if (!food) return null;
  const isHigh = food.value >= 100 || (food.pct >= 20 && monthlyTotal >= 50);
  if (!isHigh) return null;
  return rec('High food-related emissions', `Food accounts for ${food.pct}% of emissions (${food.value} kg).`, 'Medium', clamp(food.value * 0.15), 'Try reducing meat consumption, choose local seasonal produce, and reduce food waste.');
};

const ruleHighWaste = (typeMap, monthlyTotal) => {
  const waste = typeMap.get('Waste');
  if (!waste) return null;
  const isHigh = waste.value >= 50 || (waste.pct >= 15 && monthlyTotal >= 50);
  if (!isHigh) return null;
  return rec('High waste generation', `Waste contributes ${waste.pct}% of emissions (${waste.value} kg).`, 'Medium', clamp(waste.value * 0.2), 'Increase recycling, compost organic waste, and choose products with less packaging.');
};

const ruleFallback = () => rec('Looking good', 'No major emission hotspots detected in your recent activity.', 'Low', 0, 'Keep tracking activities — small improvements can make a big difference over time.', 'Nice work — continue your sustainable habits.');

const sortRecs = (list) => list.sort((a, b) => (priorityOrder[a.priority] - priorityOrder[b.priority]) || a.title.localeCompare(b.title));

/**
 * Generate prioritized CO₂ reduction recommendations based on activity data.
 * Accepts optional precomputed breakdown and monthlyTotal to avoid redundant passes.
 * Each rule returns null (no issue) or a recommendation object. Empty dataset
 * gets a single "no data" rec. If no rule fires, a fallback encouragement is added.
 * @param {Array} activities
 * @param {{list:Array, total:number}?} precomputedBreakdown
 * @param {number?} precomputedMonthlyTotal
 * @returns {Array<{title:string, description:string, priority:string, estimatedSavingsKg:number, suggestion:string, encouragement:string|null}>}
 */
export const generateRecommendations = (activities, precomputedBreakdown = null, precomputedMonthlyTotal = null) => {
  const empty = ruleEmpty(activities);
  if (empty) return sortRecs([empty]);

  const breakdown = precomputedBreakdown || breakdownByCategory(activities);
  const monthlyTotal = precomputedMonthlyTotal ?? breakdown.total;
  const typeMap = new Map(breakdown.list.map(l => [l.type, l]));

  const recs = [
    ruleLowEmissions(monthlyTotal),
    rulePublicTransit(typeMap),
    ruleHighCar(typeMap, monthlyTotal),
    ruleHighFlights(typeMap, monthlyTotal),
    ruleHighElectricity(typeMap, monthlyTotal),
    ruleHighFood(typeMap, monthlyTotal),
    ruleHighWaste(typeMap, monthlyTotal)
  ].filter(Boolean);

  if (recs.length === 0) recs.push(ruleFallback());

  return sortRecs(recs);
};


