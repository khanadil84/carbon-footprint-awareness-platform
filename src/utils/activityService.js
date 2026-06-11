const STORAGE_KEY = 'eco_activities_v1';

const emissionFactors = {
  car_km: 0.192, // kg CO2 per km
  bus_km: 0.105,
  train_km: 0.041,
  flight_km: 0.255,
  electricity_kwh: 0.475,
  food_kg: 2.5, // kg CO2 per kg food (avg)
  waste_kg: 0.5
};

const loadActivities = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load activities', e);
    return [];
  }
};

const saveActivities = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
};

const calculateEmission = (type, value) => {
  const v = Number(value) || 0;
  switch (type) {
    case 'Car':
      return parseFloat((v * emissionFactors.car_km).toFixed(3));
    case 'Bus':
      return parseFloat((v * emissionFactors.bus_km).toFixed(3));
    case 'Train':
      return parseFloat((v * emissionFactors.train_km).toFixed(3));
    case 'Flight':
      return parseFloat((v * emissionFactors.flight_km).toFixed(3));
    case 'Electricity':
      return parseFloat((v * emissionFactors.electricity_kwh).toFixed(3));
    case 'Food':
      return parseFloat((v * emissionFactors.food_kg).toFixed(3));
    case 'Waste':
      return parseFloat((v * emissionFactors.waste_kg).toFixed(3));
    default:
      return 0;
  }
};

const addActivity = ({ type, value, date = new Date().toISOString() }) => {
  const activities = loadActivities();
  const co2 = calculateEmission(type, value);
  const activity = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
    date,
    type,
    value: Number(value),
    co2
  };
  const next = [activity, ...activities];
  saveActivities(next);
  return activity;
};

const removeActivity = (id) => {
  const activities = loadActivities();
  const next = activities.filter(a => a.id !== id);
  saveActivities(next);
  return next;
};

const clearActivities = () => {
  saveActivities([]);
};

const aggregate = (activities) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayMs = 24 * 60 * 60 * 1000;

  const today = activities.filter(a => new Date(a.date) >= startOfDay);
  const weekly = activities.filter(a => new Date(a.date) >= new Date(now - 7 * dayMs));
  const monthly = activities.filter(a => new Date(a.date) >= new Date(now - 30 * dayMs));

  const sum = (arr) => arr.reduce((s, it) => s + (Number(it.co2) || 0), 0);

  const totals = {
    today: parseFloat(sum(today).toFixed(3)),
    weekly: parseFloat(sum(weekly).toFixed(3)),
    monthly: parseFloat(sum(monthly).toFixed(3)),
    total: parseFloat(sum(activities).toFixed(3))
  };

  // Carbon score: simple heuristic: 100 if monthly <= 50kg, 0 if monthly >=1000kg
  const score = (() => {
    const m = totals.monthly;
    if (m <= 50) return 100;
    if (m >= 1000) return 0;
    return Math.round(100 - ((m - 50) / (1000 - 50)) * 100);
  })();

  return { totals, score };
};

export const activityService = {
  loadActivities,
  addActivity,
  removeActivity,
  clearActivities,
  calculateEmission,
  aggregate,
  emissionFactors
};

export default activityService;
