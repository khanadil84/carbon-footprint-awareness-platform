import { activityService } from './activityService';
import { GoalService } from './goalService';

const STORAGE_KEY = 'eco_achievements_v1';

const nowIso = () => new Date().toISOString();

const defaultAchievements = [
  { id: 'first_activity', title: 'First Activity', description: 'Log your first activity', icon: '🌱', category: 'starter' },
  { id: 'walking_starter', title: 'Walking Starter', description: 'Log several short car trips (likely walkable)', icon: '🚶', category: 'travel' },
  { id: 'eco_traveler', title: 'Eco Traveler', description: 'Use public transport or train regularly', icon: '🚲', category: 'travel' },
  { id: 'public_transport_hero', title: 'Public Transport Hero', description: 'Use bus frequently', icon: '🚌', category: 'travel' },
  { id: 'energy_saver', title: 'Energy Saver', description: 'Maintain low electricity usage for the month', icon: '⚡', category: 'home' },
  { id: 'waste_reducer', title: 'Waste Reducer', description: 'Keep waste generation low', icon: '♻️', category: 'home' },
  { id: 'carbon_reducer', title: 'Carbon Reducer', description: 'Reduce monthly CO₂ compared to previous month', icon: '🌍', category: 'progress' },
  { id: 'goal_achiever', title: 'Goal Achiever', description: 'Achieve your monthly CO₂ goal', icon: '🎯', category: 'goals' },
  { id: 'streak_7', title: '7-Day Streak', description: 'Record activity for 7 consecutive days', icon: '🔥', category: 'streak' },
  { id: 'streak_30', title: '30-Day Streak', description: 'Record activity for 30 consecutive days', icon: '🏆', category: 'streak' }
];

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load achievements', e);
    return {};
  }
};

const saveSaved = (obj) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
};

const daysKey = (d) => `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

const countByType = (activities, type) => activities.filter(a => a.type === type).length;

const sumByType = (activities, type) => activities.filter(a => a.type === type).reduce((s, a) => s + (Number(a.co2) || 0), 0);

const lastNDatesSet = (n) => {
  const now = new Date();
  const set = new Set();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    set.add(daysKey(d));
  }
  return set;
};

export const evaluateAchievements = (activities = [], goal = null) => {
  const saved = loadSaved();
  const results = defaultAchievements.map(def => ({ ...def, unlocked: false, unlockedDate: null, progress: null }));

  const activitiesByDate = new Map();
  activities.forEach(a => {
    const k = daysKey(new Date(a.date));
    activitiesByDate.set(k, (activitiesByDate.get(k) || 0) + 1);
  });

  // helper to mark unlocked
  const mark = (id, when) => {
    const r = results.find(x => x.id === id);
    if (r) {
      r.unlocked = true;
      r.unlockedDate = when || nowIso();
    }
  };

  // 1. First Activity
  if (activities.length >= 1) mark('first_activity');

  // 2. Walking Starter: 5 short car trips (<=2 km)
  const shortCarCount = activities.filter(a => a.type === 'Car' && Number(a.value) <= 2).length;
  const walkingStarterTarget = 5;
  results.find(r => r.id === 'walking_starter').progress = { current: shortCarCount, target: walkingStarterTarget, hint: `${Math.max(0, walkingStarterTarget - shortCarCount)} more short trips` };
  if (shortCarCount >= walkingStarterTarget) mark('walking_starter');

  // 3. Eco Traveler: bus+train count >=5
  const publicCount = countByType(activities, 'Bus') + countByType(activities, 'Train');
  const ecoTravelerTarget = 5;
  results.find(r => r.id === 'eco_traveler').progress = { current: publicCount, target: ecoTravelerTarget, hint: `${Math.max(0, ecoTravelerTarget - publicCount)} more public transport trips` };
  if (publicCount >= ecoTravelerTarget) mark('eco_traveler');

  // 4. Public Transport Hero: Bus count >=3
  const busCount = countByType(activities, 'Bus');
  results.find(r => r.id === 'public_transport_hero').progress = { current: busCount, target: 3, hint: `${Math.max(0, 3 - busCount)} more bus trips` };
  if (busCount >= 3) mark('public_transport_hero');

  // 5. Energy Saver: electricity total <= 50 kg this month
  const elecTotal = sumByType(activities, 'Electricity');
  results.find(r => r.id === 'energy_saver').progress = { current: elecTotal, target: 50, hint: `Reduce electricity CO₂ by ${Math.max(0, (elecTotal - 50).toFixed(1))} kg` };
  if (elecTotal <= 50 && activities.length > 0) mark('energy_saver');

  // 6. Waste Reducer: waste total <= 10 kg
  const wasteTotal = sumByType(activities, 'Waste');
  results.find(r => r.id === 'waste_reducer').progress = { current: wasteTotal, target: 10, hint: `Reduce waste CO₂ by ${Math.max(0, (wasteTotal - 10).toFixed(1))} kg` };
  if (wasteTotal <= 10 && activities.length > 0) mark('waste_reducer');

  // 7. Carbon Reducer: compare this month to previous month and check >=10% reduction
  const agg = activityService.loadActivities();
  const all = activities;
  const months = {}; // year-month => total
  all.forEach(a => {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${d.getMonth()+1}`;
    months[key] = (months[key] || 0) + (Number(a.co2) || 0);
  });
  const keys = Object.keys(months).sort();
  let carbonReduced = false;
  if (keys.length >= 2) {
    const last = months[keys[keys.length-1]];
    const prev = months[keys[keys.length-2]];
    if (prev > 0 && ((prev - last) / prev) >= 0.10) carbonReduced = true;
  }
  if (carbonReduced) mark('carbon_reducer');

  // 8. Goal Achiever: goal status is Goal Achieved
  if (goal && goal.targetKg) {
    const p = GoalService.computeProgress(activities, goal);
    if (p.status === 'Goal Achieved') mark('goal_achiever');
    results.find(r => r.id === 'goal_achiever').progress = { status: p.status, hint: p.insight };
  }

  // 9. 7-Day streak and 30-Day streak: consecutive days
  const haveDate = new Set(Array.from(activitiesByDate.keys()));
  const checkStreak = (n) => {
    const want = lastNDatesSet(n);
    let count = 0;
    for (const d of Array.from(want)) if (haveDate.has(d)) count++;
    return count === n ? true : Math.max(0, n - count);
  };
  const s7 = checkStreak(7);
  if (s7 === true) mark('streak_7'); else results.find(r => r.id === 'streak_7').progress = { current: 7 - s7, target: 7, hint: `${s7} more consecutive days` };
  const s30 = checkStreak(30);
  if (s30 === true) mark('streak_30'); else results.find(r => r.id === 'streak_30').progress = { current: 30 - s30, target: 30, hint: `${s30} more consecutive days` };

  // Preserve unlocked dates from saved
  Object.keys(saved).forEach(k => {
    const found = results.find(r => r.id === k);
    if (found) {
      found.unlocked = true;
      found.unlockedDate = saved[k];
    }
  });

  // Update saved with newly unlocked
  results.forEach(r => {
    if (r.unlocked) saved[r.id] = r.unlockedDate || nowIso();
  });
  saveSaved(saved);

  // Determine recently unlocked
  const unlockedList = results.filter(r => r.unlocked).sort((a,b) => new Date(b.unlockedDate) - new Date(a.unlockedDate));
  const recent = unlockedList.length > 0 ? unlockedList[0] : null;

  return { achievements: results, recent };
};

export const AchievementService = {
  evaluateAchievements,
  loadSaved,
  saveSaved
};

export default AchievementService;
