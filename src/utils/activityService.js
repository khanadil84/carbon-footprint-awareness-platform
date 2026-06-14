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

const fingerprint = (type, value, date) => `${type}|${value}|${date}`;

const loadActivities = () => {
  const parsed = safeGetJSON(STORAGE_KEY, [], null, true);
  if (!Array.isArray(parsed)) return [];
  const repaired = selfHealActivities(parsed);
  const inv = InvariantEngine.verifySystemInvariants(repaired, null, null, null);
  const allPass = Object.values(inv).every(r => r.pass);
  if (!allPass) {
    Telemetry.emit('invariant_failure');
    for (const [name, r] of Object.entries(inv)) if (!r.pass) Telemetry.emit(name);
  } else {
    Telemetry.emit('invariant_pass');
  }
  return repaired;
};

const saveActivities = (list) => {
  if (!Array.isArray(list)) return false;
  return safeSetJSON(STORAGE_KEY, list, activity.isValidList);
};

const addActivity = ({ type, value, date = new Date().toISOString() }) => {
  const t = sanitizeString(type);
  if (!activity.isValidType(t)) throw new ValidationError('Invalid activity type', { code: 'INVALID_TYPE' });
  const v = sanitizeNumber(value, null);
  if (!activity.isValidValue(v)) throw new ValidationError('Invalid activity value', { code: 'INVALID_VALUE' });
  const d = sanitizeString(date) || new Date().toISOString();
  const fp = fingerprint(t, v, d);
  const now = Date.now();
  if (fp === lastFingerprint && (now - lastAddTime) < DEDUP_WINDOW_MS) {
    return lastEntry;
  }
  lastFingerprint = fp;
  lastAddTime = now;

  const co2 = calculateEmission(t, v);
  const entry = {
    id: now.toString(36) + Math.random().toString(36).slice(2, 8),
    date: d,
    type: t,
    value: Number(v),
    co2
  };
  const prev = safeGetJSON(STORAGE_KEY, [], null, true);
  const next = [entry, ...(Array.isArray(prev) ? prev : [])];
  if (!saveActivities(next)) throw new StorageError('Failed to persist activity', { cause: { prev: prev?.length, next: next.length } });
  lastEntry = entry;
  return entry;
};

const removeActivity = (id) => {
  const prev = safeGetJSON(STORAGE_KEY, [], null, true);
  if (!Array.isArray(prev)) return [];
  const next = prev.filter(a => a.id !== id);
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


