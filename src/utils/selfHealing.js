import { sanitizeNumber, sanitizeString, activity } from '../domain/validation.js';
import { calculateEmission } from '../domain/emissionCalculator.js';
import { Telemetry } from './telemetry.js';

const VALID_TYPES = ['Car', 'Bus', 'Train', 'Flight', 'Electricity', 'Food', 'Waste'];

export const repairId = (record) => {
  if (record.id && typeof record.id === 'string') return record.id;
  Telemetry.emit('self_heal_repair');
  return 'repaired_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
};

export const repairCo2 = (record) => {
  if (record.co2 !== undefined && record.co2 !== null && Number.isFinite(Number(record.co2))) return Number(record.co2);
  Telemetry.emit('self_heal_repair');
  const type = activity.isValidType(sanitizeString(record.type)) ? sanitizeString(record.type) : null;
  const value = sanitizeNumber(record.value, null);
  if (type && value !== null && Number.isFinite(value)) return calculateEmission(type, value);
  return 0;
};

export const repairDate = (record) => {
  if (record.date && typeof record.date === 'string') {
    const d = new Date(record.date);
    if (!isNaN(d.getTime())) return record.date;
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
  const n = sanitizeNumber(value, null);
  if (n !== null && Number.isFinite(n) && n > 0) return n;
  Telemetry.emit('self_heal_repair');
  return null;
};

export const repairActivity = (a) => {
  if (!a || typeof a !== 'object') return null;
  const type = repairType(a.type);
  if (!type) return null;
  const value = repairValue(a.value);
  if (value === null) return null;
  return {
    id: repairId(a),
    date: repairDate(a),
    type,
    value: Number(value),
    co2: repairCo2(a)
  };
};

export const deduplicateEntries = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  let dedupCount = 0;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a || typeof a !== 'object') continue;
    const key = `${a.type}|${a.value}|${a.date}|${a.co2}`;
    if (seen.has(key)) { dedupCount++; continue; }
    seen.add(key);
    result.push(a);
  }
  if (dedupCount > 0) Telemetry.emit('dedup_prevented');
  return result;
};

export const repairSettings = (settings, defaults) => {
  if (!settings || typeof settings !== 'object') return { ...defaults };
  const out = {};
  let repaired = false;
  for (const key of Object.keys(defaults)) {
    if (settings[key] === undefined || settings[key] === null) {
      out[key] = defaults[key];
      repaired = true;
    } else {
      out[key] = settings[key];
    }
  }
  if (repaired) Telemetry.emit('self_heal_repair');
  return out;
};

export const rebuildAggregation = () => {
  Telemetry.emit('cache_rebuilt');
  return null;
};

export const selfHealActivities = (list) => {
  if (!Array.isArray(list)) return [];
  const result = [];
  let repairCount = 0;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (activity.isValidRecord(a)) {
      result.push(a);
    } else {
      const fixed = repairActivity(a);
      if (fixed) { result.push(fixed); repairCount++; }
    }
  }
  if (repairCount > 0) {
    Telemetry.emit('storage_repaired');
    Telemetry.emit('recovery_complete');
  }
  return deduplicateEntries(result);
};
