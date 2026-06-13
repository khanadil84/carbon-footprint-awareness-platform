import { ActivityService } from './activityService.js';
import { CATEGORY_TYPES } from '../config/constants.js';

const defaultPageSize = 10;

/**
 * Parse a value into a Date or return null.
 * @param {string|Date|null|undefined} v
 * @returns {Date|null}
 */
const parseDate = (v) => v ? new Date(v) : null;

/**
 * Match textual search against activity fields.
 * @param {object} activity
 * @param {string} q
 * @returns {boolean}
 */
const matchesSearch = (activity, q) => {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  return activity.type.toLowerCase().includes(s) || String(activity.value).toLowerCase().includes(s) || (activity.co2 && String(activity.co2).toLowerCase().includes(s));
};

/**
 * Match category groups (Travel/Home/Food) or specific selections.
 * @param {object} activity
 * @param {string} category
 * @returns {boolean}
 */
const matchesCategory = (activity, category) => {
  if (!category || category === 'All') return true;
  const types = CATEGORY_TYPES[category];
  return types ? types.includes(activity.type) : true;
};

/**
 * Match exact activity `type` or 'All'.
 * @param {object} activity
 * @param {string} type
 * @returns {boolean}
 */
const matchesType = (activity, type) => {
  if (!type || type === 'All') return true;
  return activity.type === type;
};

/**
 * Check whether an activity's date falls within optional start/end.
 * @param {object} activity
 * @param {Date|null} start
 * @param {Date|null} end
 * @returns {boolean}
 */
const matchesDateRange = (activity, start, end) => {
  const d = new Date(activity.date);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

/**
 * Check if activity CO2 value is within optional min/max.
 * @param {object} activity
 * @param {number|null|undefined} min
 * @param {number|null|undefined} max
 * @returns {boolean}
 */
const matchesCo2Range = (activity, min, max) => {
  const v = Number(activity.co2) || 0;
  if (min !== null && min !== undefined && v < min) return false;
  if (max !== null && max !== undefined && v > max) return false;
  return true;
};

/**
 * Apply sorting to a list of activities.
 * @param {Array} list
 * @param {string} sortKey
 * @returns {Array}
 */
const sorters = {
  newest: (a, b) => new Date(b.date) - new Date(a.date),
  oldest: (a, b) => new Date(a.date) - new Date(b.date),
  highest: (a, b) => Number(b.co2) - Number(a.co2),
  lowest: (a, b) => Number(a.co2) - Number(b.co2)
};

const applySort = (list, sortKey) => {
  const fn = sorters[sortKey] || sorters.newest;
  return [...list].sort(fn);
};

/**
 * Paginate a list given page and pageSize.
 * @param {Array} list
 * @param {number} [page=1]
 * @param {number} [pageSize=defaultPageSize]
 * @returns {{data:Array,page:number,pages:number,total:number}}
 */
const paginate = (list, page = 1, pageSize = defaultPageSize) => {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * pageSize;
  const data = list.slice(start, start + pageSize);
  return { data, page: p, pages, total };
};

/**
 * Compute summary statistics for a list of activities.
 * @param {Array} list
 * @returns {{totalActivities:number,totalCo2:number,avgCo2:number,highest:object|null,lowest:object|null}}
 */
const computeStats = (list = []) => {
  const totalActivities = list.length;
  const totalCo2 = list.reduce((s, a) => s + (Number(a.co2) || 0), 0);
  const avgCo2 = totalActivities > 0 ? Number((totalCo2 / totalActivities).toFixed(3)) : 0;
  const highest = list.reduce((best, a) => (!best || (Number(a.co2) > Number(best.co2))) ? a : best, null);
  const lowest = list.reduce((best, a) => (!best || (Number(a.co2) < Number(best.co2))) ? a : best, null);
  return { totalActivities, totalCo2: Number(totalCo2.toFixed(3)), avgCo2, highest, lowest };
};

/**
 * Query activities with filtering, sorting, pagination and stats.
 * @param {object} options
 */
export const queryActivities = ({ search, startDate, endDate, category, type, minCo2, maxCo2, sort = 'newest', page = 1, pageSize = defaultPageSize } = {}) => {
  const all = ActivityService.loadActivities();
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const filtered = all.filter(a =>
    matchesSearch(a, search) && matchesCategory(a, category) && matchesType(a, type) && matchesDateRange(a, start, end) && matchesCo2Range(a, minCo2, maxCo2)
  );
  const stats = computeStats(filtered);
  const sorted = applySort(filtered, sort);
  return { ...paginate(sorted, page, pageSize), stats };
};

export const HistoryService = {
  queryActivities,
  pageSize: defaultPageSize
};


