import { safeGetJSON, safeSetJSON } from './storage.js';
import { sanitizeNumber, sanitizeString, activity } from '../domain/validation.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { calculateEmission } from '../domain/emissionCalculator.js';
import { ValidationError, StorageError } from './resilience.js';
import { selfHealActivities } from './selfHealing.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';

const STORAGE_KEY = STORAGE_KEYS.ACTIVITIES;
const DEDUP_WINDOW_MS = 2000;

let lastFingerprint = null;
let lastAddTime = 0;
let lastEntry = null;

const buildFingerprint = (type, value, date) => `${type}|${value}|${date}`;

const isDuplicateEntry = (type, value, date) => {
  const fingerprint = buildFingerprint(type, value, date);
  const now = Date.now();
  if (fingerprint === lastFingerprint && (now - lastAddTime) < DEDUP_WINDOW_MS) {
    return true;
  }
  lastFingerprint = fingerprint;
  lastAddTime = now;
  return false;
};

const createActivityEntry = (type, value, date) => {
  const co2 = calculateEmission(type, value);
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    date,
    type,
    value: Number(value),
    co2
  };
};

const loadActivities = () => {
  const parsed = safeGetJSON(STORAGE_KEY, [], null, true);
  if (!Array.isArray(parsed)) return [];
  const repaired = selfHealActivities(parsed);
  const invariants = InvariantEngine.verifySystemInvariants(repaired, null, null, null);
  const allPass = Object.values(invariants).every(result => result.pass);
  if (!allPass) {
    Telemetry.emit('invariant_failure');
    for (const [name, result] of Object.entries(invariants)) {
      if (!result.pass) Telemetry.emit(name);
    }
  } else {
    Telemetry.emit('invariant_pass');
  }
  return repaired;
};

const saveActivities = (activities) => {
  if (!Array.isArray(activities)) return false;
  return safeSetJSON(STORAGE_KEY, activities, activity.isValidList);
};

const addActivity = ({ type, value, date = new Date().toISOString() }) => {
  const cleanedType = sanitizeString(type);
  if (!activity.isValidType(cleanedType)) {
    throw new ValidationError('Invalid activity type', { code: 'INVALID_TYPE' });
  }
  const cleanedValue = sanitizeNumber(value, null);
  if (!activity.isValidValue(cleanedValue)) {
    throw new ValidationError('Invalid activity value', { code: 'INVALID_VALUE' });
  }
  const cleanedDate = sanitizeString(date) || new Date().toISOString();

  if (isDuplicateEntry(cleanedType, cleanedValue, cleanedDate)) {
    return lastEntry;
  }

  const entry = createActivityEntry(cleanedType, cleanedValue, cleanedDate);
  const previous = safeGetJSON(STORAGE_KEY, [], null, true);
  const next = [entry, ...(Array.isArray(previous) ? previous : [])];
  if (!saveActivities(next)) {
    throw new StorageError('Failed to persist activity', {
      cause: { previousCount: previous?.length, nextCount: next.length }
    });
  }
  lastEntry = entry;
  return entry;
};

const removeActivity = (id) => {
  const previous = safeGetJSON(STORAGE_KEY, [], null, true);
  if (!Array.isArray(previous)) return [];
  const next = previous.filter(activity => activity.id !== id);
  if (!saveActivities(next)) throw new StorageError('Failed to persist after removal');
  return next;
};

const clearActivities = () => {
  if (!saveActivities([])) throw new StorageError('Failed to clear activities');
};

export const ActivityService = {
  loadActivities,
  addActivity,
  removeActivity,
  clearActivities,
  calculateEmission
};
