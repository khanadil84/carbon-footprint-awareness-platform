import { activityService } from './activityService';

const defaultPageSize = 10;

const parseDate = (v) => v ? new Date(v) : null;

const matchesSearch = (activity, q) => {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  return activity.type.toLowerCase().includes(s) || String(activity.value).toLowerCase().includes(s) || (activity.co2 && String(activity.co2).toLowerCase().includes(s));
};

const matchesCategory = (activity, category) => {
  if (!category || category === 'All') return true;
  const travel = ['Car','Bus','Train','Flight'];
  const home = ['Electricity','Waste'];
  const food = ['Food'];
  if (category === 'Travel') return travel.includes(activity.type);
  if (category === 'Home') return home.includes(activity.type);
  if (category === 'Food') return food.includes(activity.type);
  return true;
};

const matchesType = (activity, type) => {
  if (!type || type === 'All') return true;
  return activity.type === type;
};

const matchesDateRange = (activity, start, end) => {
  const d = new Date(activity.date);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

const matchesCo2Range = (activity, min, max) => {
  const v = Number(activity.co2) || 0;
  if (min !== null && min !== undefined && v < min) return false;
  if (max !== null && max !== undefined && v > max) return false;
  return true;
};

const applySort = (list, sortKey) => {
  const copy = [...list];
  switch (sortKey) {
    case 'newest':
      return copy.sort((a,b)=> new Date(b.date) - new Date(a.date));
    case 'oldest':
      return copy.sort((a,b)=> new Date(a.date) - new Date(b.date));
    case 'highest':
      return copy.sort((a,b)=> Number(b.co2) - Number(a.co2));
    case 'lowest':
      return copy.sort((a,b)=> Number(a.co2) - Number(b.co2));
    default:
      return copy.sort((a,b)=> new Date(b.date) - new Date(a.date));
  }
};

const paginate = (list, page = 1, pageSize = defaultPageSize) => {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * pageSize;
  const data = list.slice(start, start + pageSize);
  return { data, page: p, pages, total };
};

const computeStats = (list) => {
  const totalActivities = list.length;
  const totalCo2 = list.reduce((s, a) => s + (Number(a.co2) || 0), 0);
  const avgCo2 = totalActivities > 0 ? Number((totalCo2 / totalActivities).toFixed(3)) : 0;
  const highest = list.reduce((best, a) => (!best || (Number(a.co2) > Number(best.co2))) ? a : best, null);
  const lowest = list.reduce((best, a) => (!best || (Number(a.co2) < Number(best.co2))) ? a : best, null);
  return { totalActivities, totalCo2: Number(totalCo2.toFixed(3)), avgCo2, highest, lowest };
};

export const queryActivities = ({ search, startDate, endDate, category, type, minCo2, maxCo2, sort = 'newest', page = 1, pageSize = defaultPageSize } = {}) => {
  const all = activityService.loadActivities();
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  let filtered = all.filter(a => {
    return matchesSearch(a, search) && matchesCategory(a, category) && matchesType(a, type) && matchesDateRange(a, start, end) && matchesCo2Range(a, minCo2, maxCo2);
  });
  const stats = computeStats(filtered);
  filtered = applySort(filtered, sort);
  const pageObj = paginate(filtered, page, pageSize);
  return { ...pageObj, stats };
};

export const HistoryService = {
  queryActivities,
  pageSize: defaultPageSize
};

export default HistoryService;
