import { Telemetry } from '../../src/utils/telemetry.js';

const inject = (name, target, restoreFn) => {
  Telemetry.emit('fault_injected');
  return {
    name,
    restore: restoreFn,
    verify: (checkFn) => {
      const ok = checkFn();
      if (ok) Telemetry.emit('fault_recovered');
      return ok;
    }
  };
};

export const injectMalformedStorage = (storageMock, key) => {
  const prev = storageMock.getItem(key);
  storageMock.setItem(key, '{malformed json');
  return inject('malformed_storage', storageMock, () => {
    if (prev !== null) storageMock.setItem(key, prev);
    else storageMock.removeItem(key);
  });
};

export const injectDuplicateIds = (list) => {
  if (!list || list.length < 2) return null;
  const original = [...list];
  list[1] = { ...list[1], id: list[0].id };
  return inject('duplicate_ids', list, () => {
    list.length = 0;
    for (const item of original) list.push(item);
  });
};

export const injectBrokenAggregation = (agg) => {
  if (!agg) return null;
  const original = agg.totalSum;
  agg.totalSum = -999;
  return inject('broken_aggregation', agg, () => { agg.totalSum = original; });
};

export const injectBrokenCache = (cacheTarget) => {
  if (!cacheTarget || typeof cacheTarget !== 'object') return null;
  const original = { ...cacheTarget };
  Object.keys(cacheTarget).forEach(k => { if (Array.isArray(cacheTarget[k])) cacheTarget[k] = null; });
  return inject('broken_cache', cacheTarget, () => {
    Object.assign(cacheTarget, original);
  });
};

export const injectPartialWrite = (storageMock, key, value) => {
  const prev = storageMock.getItem(key);
  const str = JSON.stringify(value);
  const truncated = str.length > 10 ? str.slice(0, Math.floor(str.length / 2)) : str.slice(0, -2);
  storageMock.setItem(key, truncated);
  return inject('partial_write', storageMock, () => {
    if (prev !== null) storageMock.setItem(key, prev);
    else storageMock.removeItem(key);
  });
};

export const injectInvalidDate = (activities) => {
  if (!activities || activities.length === 0) return null;
  const idx = 0;
  const original = activities[idx].date;
  activities[idx] = { ...activities[idx], date: 'not-a-date' };
  return inject('invalid_date', activities, () => { activities[idx] = { ...activities[idx], date: original }; });
};

export const injectInvalidScore = (scoreObj) => {
  if (!scoreObj) return null;
  const original = scoreObj.score;
  scoreObj.score = -1;
  return inject('invalid_score', scoreObj, () => { scoreObj.score = original; });
};

export const injectCorruptSettings = (settings) => {
  if (!settings) return null;
  const original = { ...settings };
  settings.units = 'invalid_unit';
  return inject('corrupt_settings', settings, () => { Object.assign(settings, original); });
};

export const injectMalformedActivity = (activities) => {
  if (!Array.isArray(activities)) return null;
  const original = activities.length;
  activities.push({ noId: true, noType: null });
  return inject('malformed_activity', activities, () => { activities.length = original; });
};

export const injectMissingCo2 = (activities) => {
  if (!activities || activities.length === 0) return null;
  const idx = 0;
  const original = activities[idx].co2;
  activities[idx] = { ...activities[idx] };
  delete activities[idx].co2;
  return inject('missing_co2', activities, () => { activities[idx] = { ...activities[idx], co2: original }; });
};

export const injectMissingId = (activities) => {
  if (!activities || activities.length === 0) return null;
  const idx = 0;
  const original = activities[idx].id;
  activities[idx] = { ...activities[idx] };
  delete activities[idx].id;
  return inject('missing_id', activities, () => { activities[idx] = { ...activities[idx], id: original }; });
};
