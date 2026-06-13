import { safeGetJSON, safeSetJSON } from './storage.js';
import { sanitizeNumber, validActivityType, sanitizeString } from './validation.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { calculateEmission } from '../domain/emissionCalculator.js';

const STORAGE_KEY = STORAGE_KEYS.ACTIVITIES;

const loadActivities = () => {
  const parsed = safeGetJSON(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
};

const saveActivities = (list) => safeSetJSON(STORAGE_KEY, list || []);

const addActivity = ({ type, value, date = new Date().toISOString() }) => {
  const t = sanitizeString(type);
  if (!validActivityType(t)) throw new Error('Invalid activity type');
  const v = sanitizeNumber(value, null);
  if (v === null || v <= 0) throw new Error('Invalid activity value');
  const d = sanitizeString(date) || new Date().toISOString();

  const activities = loadActivities();
  const co2 = calculateEmission(t, v);
  const activity = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
    date: d,
    type: t,
    value: Number(v),
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

export const ActivityService = {
  loadActivities,
  addActivity,
  removeActivity,
  clearActivities,
  calculateEmission
};


