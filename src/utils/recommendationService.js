import { breakdownByCategory, summaryStats } from './activityAnalytics.js';
import { activityService } from './activityService.js';

const clamp = (v) => Math.max(0, Number(v) || 0);

// Deterministic rules for recommendations
export const generateRecommendations = (activities) => {
  const recs = [];
  const breakdown = breakdownByCategory(activities);
  const summary = summaryStats(activities);
  const monthlyTotal = activityService.aggregate(activities).totals.monthly || 0;

  // Helper to push recommendation
  const push = (obj) => recs.push({
    title: obj.title,
    description: obj.description,
    priority: obj.priority,
    estimatedSavingsKg: Number((obj.estimatedSavingsKg || 0).toFixed(3)),
    suggestion: obj.suggestion,
    encouragement: obj.encouragement || null
  });

  // Empty dataset
  if (!activities || activities.length === 0) {
    push({
      title: 'No activity data yet',
      description: 'Add activities to get personalized recommendations and track your CO₂ impact.',
      priority: 'Low',
      estimatedSavingsKg: 0,
      suggestion: 'Start by adding a recent trip, electricity usage, or food/waste entry.'
    });
    return recs;
  }

  // Positive: low monthly emissions
  if (monthlyTotal <= 50) {
    push({
      title: 'Excellent low-emission month',
      description: `Your monthly CO₂ total is low (${monthlyTotal} kg).` ,
      priority: 'Low',
      estimatedSavingsKg: 0,
      suggestion: 'Keep up the good habits — small changes compound over time.',
      encouragement: 'Great job — your lifestyle choices are having positive impact.'
    });
  }

  // Encourage public transit / active travel
  const bus = breakdown.list.find(l => l.type === 'Bus');
  const train = breakdown.list.find(l => l.type === 'Train');
  if ((bus && bus.pct >= 35) || (train && train.pct >= 35)) {
    push({
      title: 'Great use of public transit',
      description: 'A high share of your travel is by bus or train.',
      priority: 'Low',
      estimatedSavingsKg: 0,
      suggestion: 'Keep using public transit and consider season passes or active travel for short trips.',
      encouragement: 'Nice — public transit reduces per-person emissions significantly.'
    });
  }

  // High car travel
  const car = breakdown.list.find(l => l.type === 'Car');
  if (car) {
    const isHigh = car.value >= 100 || (car.pct >= 30 && monthlyTotal >= 50);
    if (isHigh) {
      const est = clamp(car.value * 0.25); // assume 25% reducible
      push({
        title: 'High car travel detected',
        description: `Car travel accounts for ${car.pct}% of your emissions (${car.value} kg).`,
        priority: 'High',
        estimatedSavingsKg: est,
        suggestion: 'Try carpooling, combine errands, work remotely when possible, or switch short trips to walking/biking.',
        encouragement: null
      });
    }
  }

  // High flights
  const flight = breakdown.list.find(l => l.type === 'Flight');
  if (flight) {
    const isHigh = flight.value >= 200 || (flight.pct >= 20 && monthlyTotal >= 100);
    if (isHigh) {
      const est = clamp(flight.value * 0.4); // assume 40% reducible through fewer flights
      push({
        title: 'Frequent flights detected',
        description: `Flights contribute ${flight.pct}% of emissions (${flight.value} kg).`,
        priority: 'High',
        estimatedSavingsKg: est,
        suggestion: 'Consider fewer short-haul flights, choose rail where feasible, and combine trips to reduce frequency.',
        encouragement: null
      });
    }
  }

  // High electricity
  const elec = breakdown.list.find(l => l.type === 'Electricity');
  if (elec) {
    const isHigh = elec.value >= 150 || (elec.pct >= 25 && monthlyTotal >= 50);
    if (isHigh) {
      const est = clamp(elec.value * 0.2); // 20% savings possible
      push({
        title: 'High electricity usage',
        description: `Electricity accounts for ${elec.pct}% of your emissions (${elec.value} kg).`,
        priority: 'Medium',
        estimatedSavingsKg: est,
        suggestion: 'Switch to LED lighting, optimize heating/cooling, and unplug idle devices to save energy.',
        encouragement: null
      });
    }
  }

  // High food emissions
  const food = breakdown.list.find(l => l.type === 'Food');
  if (food) {
    const isHigh = food.value >= 100 || (food.pct >= 20 && monthlyTotal >= 50);
    if (isHigh) {
      const est = clamp(food.value * 0.15);
      push({
        title: 'High food-related emissions',
        description: `Food accounts for ${food.pct}% of emissions (${food.value} kg).`,
        priority: 'Medium',
        estimatedSavingsKg: est,
        suggestion: 'Try reducing meat consumption, choose local seasonal produce, and reduce food waste.',
        encouragement: null
      });
    }
  }

  // High waste
  const waste = breakdown.list.find(l => l.type === 'Waste');
  if (waste) {
    const isHigh = waste.value >= 50 || (waste.pct >= 15 && monthlyTotal >= 50);
    if (isHigh) {
      const est = clamp(waste.value * 0.2);
      push({
        title: 'High waste generation',
        description: `Waste contributes ${waste.pct}% of emissions (${waste.value} kg).`,
        priority: 'Medium',
        estimatedSavingsKg: est,
        suggestion: 'Increase recycling, compost organic waste, and choose products with less packaging.',
        encouragement: null
      });
    }
  }

  // If no issues found and not already low-emission message, offer encouragement
  if (recs.length === 0) {
    push({
      title: 'Looking good',
      description: 'No major emission hotspots detected in your recent activity.',
      priority: 'Low',
      estimatedSavingsKg: 0,
      suggestion: 'Keep tracking activities — small improvements can make a big difference over time.',
      encouragement: 'Nice work — continue your sustainable habits.'
    });
  }

  // Sort deterministically: High -> Medium -> Low, then by title
  const priorityOrder = { High: 0, Medium: 1, Low: 2 };
  recs.sort((a,b) => (priorityOrder[a.priority] - priorityOrder[b.priority]) || a.title.localeCompare(b.title));
  return recs;
};

export default { generateRecommendations };
