import { sanitizeNumber, sanitizeString, activity } from '../domain/validation.js';
import { calculateEmission } from '../domain/emissionCalculator.js';
import { ACTIVITY_TYPES } from '../config/constants.js';
import { Telemetry } from './telemetry.js';

const VALID_TYPES = ACTIVITY_TYPES;

export const repairId = (record) => {
  if (record.id && typeof record.id === 'string') return record.id;
  Telemetry.emit('self_heal_repair');
  return 'repaired_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

export const repairCo2 = (record) => {
  const hasCo2 = record.co2 !== undefined && record.co2 !== null && Number.isFinite(Number(record.co2));
  if (hasCo2) return Number(record.co2);
  Telemetry.emit('self_heal_repair');
  const type = activity.isValidType(sanitizeString(record.type)) ? sanitizeString(record.type) : null;
  const value = sanitizeNumber(record.value, null);
  if (type && value !== null && Number.isFinite(value)) return calculateEmission(type, value);
  return 0;
};

export const repairDate = (record) => {
  if (record.date && typeof record.date === 'string') {
    const date = new Date(record.date);
    if (!isNaN(date.getTime())) return record.date;
  }
  Telemetry.emit('self_heal_repair');
  return new Date().toISOString();
};

export const repairType = (type) => {
  const cleaned = sanitizeString(type);
  if (VALID_TYPES.includes(cleaned)) return cleaned;
  Telemetry.emit('self_heal_repair');
  return null;
};

export const repairValue = (value) => {
  const numericValue = sanitizeNumber(value, null);
  if (numericValue !== null && Number.isFinite(numericValue) && numericValue > 0) return numericValue;
  Telemetry.emit('self_heal_repair');
  return null;
};

export const repairActivity = (record) => {
  if (!record || typeof record !== 'object') return null;
  const type = repairType(record.type);
  if (!type) return null;
  const value = repairValue(record.value);
  if (value === null) return null;
  return {
    id: repairId(record),
    date: repairDate(record),
    type,
    value: Number(value),
    co2: repairCo2(record)
  };
};

export const deduplicateEntries = (entries) => {
  if (!Array.isArray(entries)) return [];
  const seen = new Set();
  const result = [];
  let dedupCount = 0;
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue;
    const fingerprint = `${entry.type}|${entry.value}|${entry.date}|${entry.co2}`;
    if (seen.has(fingerprint)) { dedupCount++; continue; }
    seen.add(fingerprint);
    result.push(entry);
  }
  if (dedupCount > 0) Telemetry.emit('dedup_prevented');
  return result;
};

export const repairSettings = (settings, defaults) => {
  if (!settings || typeof settings !== 'object') return { ...defaults };
  const result = {};
  let repaired = false;
  for (const key of Object.keys(defaults)) {
    if (settings[key] === undefined || settings[key] === null) {
      result[key] = defaults[key];
      repaired = true;
    } else {
      result[key] = settings[key];
    }
  }
  if (repaired) Telemetry.emit('self_heal_repair');
  return result;
};

export const rebuildAggregation = () => {
  Telemetry.emit('cache_rebuilt');
  return null;
};

export const selfHealActivities = (activities) => {
  if (!Array.isArray(activities)) return [];
  const result = [];
  let repairCount = 0;
  for (const record of activities) {
    if (activity.isValidRecord(record)) {
      result.push(record);
    } else {
      const repaired = repairActivity(record);
      if (repaired) { result.push(repaired); repairCount++; }
    }
  }
  if (repairCount > 0) {
    Telemetry.emit('storage_repaired');
    Telemetry.emit('recovery_complete');
  }
  return deduplicateEntries(result);
};
