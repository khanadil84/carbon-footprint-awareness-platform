import { aggregate, breakdownByCategory } from './activityAnalytics.js';
import { safeGetJSON, safeSetJSON, safeRemoveItem } from './storage.js';
import { sanitizeNumber } from './validation.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { daysInMonth } from '../domain/dateUtils.js';
import { computeStatus, generateInsight } from '../domain/goalProgress.js';
import { clamp } from '../domain/mathUtils.js';
import { typeMapFromBreakdown } from '../domain/breakdownUtils.js';

const STORAGE_KEY = STORAGE_KEYS.GOAL;

export const loadGoal = () => safeGetJSON(STORAGE_KEY, null);

export const saveGoal = (goal) => {
  const toSave = {
    ...goal,
    targetKg: sanitizeNumber(goal && goal.targetKg, null)
  };
  safeSetJSON(STORAGE_KEY, toSave);
  return true;
};

export const clearGoal = () => {
  safeRemoveItem(STORAGE_KEY);
};

/**
 * Calculate monthly goal progress: current vs target, projection, status, and insight.
 * @param {Array} activities
 * @param {{targetKg:number}|null} goal
 * @returns {{target:number|null, current:number, remaining:number|null, percent:number, daysRemaining:number, status:string, projection:number, improvementNeeded:number|null, insight:string}}
 */
export const computeProgress = (activities, goal) => {
  const target = goal && goal.targetKg ? Number(goal.targetKg) : null;
  const agg = aggregate(activities || []);
  const current = agg.totals.monthly || 0;
  const daysRemaining = daysInMonth(new Date()) - new Date().getDate();

  if (!target) {
    return { target: null, current, remaining: null, percent: 0, daysRemaining, status: 'No Goal', projection: current, improvementNeeded: null, insight: 'Set a monthly CO₂ target to track progress.' };
  }

  const today = new Date();
  const elapsed = today.getDate();
  const totalDays = daysInMonth(today);
  const projected = elapsed > 0 ? parseFloat((current / elapsed * totalDays).toFixed(3)) : current;
  const remaining = parseFloat((target - current).toFixed(3));
  const percent = clamp(((current / target) * 100), 0, 100);
  const status = computeStatus(current, target, projected);
  const improvementNeeded = Math.max(0, parseFloat((projected - target).toFixed(3)));

  const breakdown = breakdownByCategory(activities || []);
  const typeMap = typeMapFromBreakdown(breakdown);
  const car = typeMap.get('Car') || { value: 0 };
  const estIfReduceCar10 = parseFloat((car.value * 0.10).toFixed(3));
  const insight = generateInsight(status, improvementNeeded, estIfReduceCar10);

  return { target, current, remaining, percent: Math.round(percent), daysRemaining, status, projection: projected, improvementNeeded, insight };
};

export const GoalService = {
  loadGoal,
  saveGoal,
  clearGoal,
  computeProgress
};


