import { activityService } from './activityService.js';
import { breakdownByCategory } from './activityAnalytics';

const STORAGE_KEY = 'eco_goal_v1';

export const loadGoal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load goal', e);
    return null;
  }
};

export const saveGoal = (goal) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
};

export const clearGoal = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const daysInMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth()+1, 0).getDate();

export const computeProgress = (activities, goal) => {
  // activities: array, goal: { targetKg }
  const target = goal && goal.targetKg ? Number(goal.targetKg) : null;
  const agg = activityService.aggregate(activities || []);
  const current = agg.totals.monthly || 0;

  if (!target) {
    return { target: null, current, remaining: null, percent: 0, daysRemaining: daysInMonth(new Date()) - new Date().getDate(), status: 'No Goal', projection: current, improvementNeeded: null, insight: 'Set a monthly CO₂ target to track progress.' };
  }

  const today = new Date();
  const elapsed = today.getDate();
  const totalDays = daysInMonth(today);
  const daysRemaining = totalDays - elapsed;

  const projected = elapsed > 0 ? parseFloat((current / elapsed * totalDays).toFixed(3)) : current;
  const remaining = parseFloat((target - current).toFixed(3));
  const percent = clamp(((current / target) * 100), 0, 100);

  // Determine status
  let status = 'On Track';
  if (current <= target && projected <= target) status = 'Goal Achieved';
  else if (projected <= target) status = 'On Track';
  else if (projected <= target * 1.05) status = 'Slightly Behind';
  else status = 'Behind';

  const improvementNeeded = Math.max(0, parseFloat((projected - target).toFixed(3)));

  // Simple insight generation
  const breakdown = breakdownByCategory(activities || []);
  const car = breakdown.list.find(l => l.type === 'Car') || { value: 0 };
  const estIfReduceCar10 = parseFloat((car.value * 0.10).toFixed(3));
  let insight = '';
  if (status === 'On Track') insight = "You're on track to beat your goal.";
  else if (improvementNeeded > 0 && estIfReduceCar10 >= improvementNeeded) insight = `Reducing car travel by 10% (~${estIfReduceCar10} kg) would keep you on target.`;
  else if (status === 'Slightly Behind') insight = 'You are slightly behind — small adjustments would help.';
  else if (status === 'Behind') insight = 'You are behind your monthly goal — consider larger changes.';

  return {
    target,
    current,
    remaining: parseFloat((target - current).toFixed(3)),
    percent: Math.round(percent),
    daysRemaining,
    status,
    projection: projected,
    improvementNeeded,
    insight
  };
};

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Number(v) || 0));

export const GoalService = {
  loadGoal,
  saveGoal,
  clearGoal,
  computeProgress
};

export default GoalService;
