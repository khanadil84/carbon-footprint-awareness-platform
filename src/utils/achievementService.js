import { GoalService } from './goalService.js';
import { safeGetJSON, safeSetJSON } from './storage.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { nowIso, lastNDatesSet } from '../domain/dateUtils.js';
import { defaultAchievements } from '../domain/achievementDefinitions.js';
import { achievements } from '../domain/validation.js';

const STORAGE_KEY = STORAGE_KEYS.ACHIEVEMENTS;

const loadSaved = () => {
  const parsed = safeGetJSON(STORAGE_KEY, {});
  return achievements.isValidSavedMap(parsed) ? parsed : {};
};

const saveSaved = (obj) => {
  if (!achievements.isValidSavedMap(obj)) return false;
  safeSetJSON(STORAGE_KEY, obj);
  return true;
};

const setProgress = (results, id, progress) => {
  const r = results.find(x => x.id === id);
  if (r) r.progress = progress;
};

const mark = (results, id, when) => {
  const r = results.find(x => x.id === id);
  if (r) {
    r.unlocked = true;
    r.unlockedDate = when || nowIso();
  }
};

const evaluateFirstActivity = (results, count) => {
  if (count >= 1) mark(results, 'first_activity');
};

const evaluateWalkingStarter = (results, shortCarCount) => {
  const target = 5;
  setProgress(results, 'walking_starter', { current: shortCarCount, target, hint: `${Math.max(0, target - shortCarCount)} more short trips` });
  if (shortCarCount >= target) mark(results, 'walking_starter');
};

const evaluateEcoTraveler = (results, publicCount) => {
  const target = 5;
  setProgress(results, 'eco_traveler', { current: publicCount, target, hint: `${Math.max(0, target - publicCount)} more public transport trips` });
  if (publicCount >= target) mark(results, 'eco_traveler');
};

const evaluatePublicTransportHero = (results, busCount) => {
  setProgress(results, 'public_transport_hero', { current: busCount, target: 3, hint: `${Math.max(0, 3 - busCount)} more bus trips` });
  if (busCount >= 3) mark(results, 'public_transport_hero');
};

const evaluateEnergySaver = (results, electricitySum, hasActivities) => {
  setProgress(results, 'energy_saver', { current: electricitySum, target: 50, hint: `Reduce electricity CO₂ by ${Math.max(0, (electricitySum - 50).toFixed(1))} kg` });
  if (electricitySum <= 50 && hasActivities) mark(results, 'energy_saver');
};

const evaluateWasteReducer = (results, wasteSum, hasActivities) => {
  setProgress(results, 'waste_reducer', { current: wasteSum, target: 10, hint: `Reduce waste CO₂ by ${Math.max(0, (wasteSum - 10).toFixed(1))} kg` });
  if (wasteSum <= 10 && hasActivities) mark(results, 'waste_reducer');
};

const evaluateCarbonReducer = (results, months) => {
  const keys = Object.keys(months).sort();
  if (keys.length >= 2) {
    const last = months[keys[keys.length - 1]];
    const prev = months[keys[keys.length - 2]];
    if (prev > 0 && ((prev - last) / prev) >= 0.10) mark(results, 'carbon_reducer');
  }
};

const evaluateGoalAchiever = (results, activities, goal, precomputedAgg) => {
  if (goal && goal.targetKg) {
    const p = GoalService.computeProgress(activities, goal, precomputedAgg);
    if (p.status === 'Goal Achieved') mark(results, 'goal_achiever');
    setProgress(results, 'goal_achiever', { status: p.status, hint: p.insight });
  }
};

const evaluateStreaks = (results, activitiesByDate) => {
  const haveDate = new Set(activitiesByDate.keys());
  const checkStreak = (n) => {
    const want = lastNDatesSet(n);
    let count = 0;
    for (const d of want) if (haveDate.has(d)) count++;
    return count === n ? true : Math.max(0, n - count);
  };

  const s7 = checkStreak(7);
  if (s7 === true) mark(results, 'streak_7');
  else setProgress(results, 'streak_7', { current: 7 - s7, target: 7, hint: `${s7} more consecutive days` });

  const s30 = checkStreak(30);
  if (s30 === true) mark(results, 'streak_30');
  else setProgress(results, 'streak_30', { current: 30 - s30, target: 30, hint: `${s30} more consecutive days` });
};

const mergeSaved = (results, saved) => {
  Object.keys(saved).forEach(k => {
    const found = results.find(r => r.id === k);
    if (found) {
      found.unlocked = true;
      found.unlockedDate = saved[k];
    }
  });
  results.forEach(r => {
    if (r.unlocked) saved[r.id] = r.unlockedDate || nowIso();
  });
  saveSaved(saved);
};

const collectStats = (_activities, precomputedAgg) => {
  if (!precomputedAgg) {
    return { activitiesByDate: new Map(), months: {}, shortCarCount: 0, busCount: 0, trainCount: 0, electricitySum: 0, wasteSum: 0 };
  }
  const months = {};
  for (const [k, v] of precomputedAgg.monthMap) months[k] = v;
  return {
    activitiesByDate: precomputedAgg.dateActivityCounts,
    months,
    shortCarCount: precomputedAgg.typeCounts.carShort,
    busCount: precomputedAgg.typeCounts.bus,
    trainCount: precomputedAgg.typeCounts.train,
    electricitySum: precomputedAgg.typeSum.get('Electricity') || 0,
    wasteSum: precomputedAgg.typeSum.get('Waste') || 0
  };
};

const recentUnlocked = (results) => {
  let latest = null;
  let latestDate = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.unlocked) {
      const d = new Date(r.unlockedDate).getTime();
      if (!latest || d > latestDate) {
        latest = r;
        latestDate = d;
      }
    }
  }
  return latest;
};

export const evaluateAchievements = (activities = [], goal = null, precomputedAgg = null) => {
  const saved = loadSaved();
  const results = defaultAchievements.map(def => ({ ...def, unlocked: false, unlockedDate: null, progress: null }));

  const stats = collectStats(activities, precomputedAgg);
  if (!stats) return { achievements: results, recent: null };

  const { activitiesByDate, months, shortCarCount, busCount, electricitySum, wasteSum } = stats;
  const publicCount = stats.busCount + stats.trainCount;

  evaluateFirstActivity(results, activities.length);
  evaluateWalkingStarter(results, shortCarCount);
  evaluateEcoTraveler(results, publicCount);
  evaluatePublicTransportHero(results, busCount);
  evaluateEnergySaver(results, electricitySum, activities.length > 0);
  evaluateWasteReducer(results, wasteSum, activities.length > 0);
  evaluateCarbonReducer(results, months);
  evaluateGoalAchiever(results, activities, goal, precomputedAgg);
  evaluateStreaks(results, activitiesByDate);

  mergeSaved(results, saved);
  const recent = recentUnlocked(results);

  return { achievements: results, recent };
};

export const AchievementService = {
  evaluateAchievements,
  loadSaved,
  saveSaved
};


