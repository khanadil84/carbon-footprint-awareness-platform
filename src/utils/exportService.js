import { activityService } from './activityService.js';
import { calculateCarbonScore } from './carbonScoreService';
import { GoalService } from './goalService';
import { AchievementService } from './achievementService';
import { generateRecommendations } from './recommendationService';
import { breakdownByCategory } from './activityAnalytics';

const categoryOf = (type) => {
  const travel = ['Car','Bus','Train','Flight'];
  const home = ['Electricity','Waste'];
  const food = ['Food'];
  if (travel.includes(type)) return 'Travel';
  if (home.includes(type)) return 'Home';
  if (food.includes(type)) return 'Food';
  return 'Other';
};

const escapeCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const buildCSV = (rows, headers) => {
  const lines = [];
  if (headers && headers.length) lines.push(headers.map(escapeCell).join(','));
  rows.forEach(r => {
    lines.push(headers.map(h => escapeCell(r[h] ?? r[h.toLowerCase()] ?? '')) .join(','));
  });
  return lines.join('\n');
};

const downloadCSV = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const exportActivitiesCSV = (activities) => {
  const headers = ['Date','Activity Type','Input Value','Estimated CO2','Category'];
  const rows = activities.map(a => ({
    Date: new Date(a.date).toLocaleString(),
    'Activity Type': a.type,
    'Input Value': a.value,
    'Estimated CO2': a.co2,
    Category: categoryOf(a.type)
  }));
  const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => escapeCell(r[h])).join(','))).join('\n');
  downloadCSV(`ecotrack_activities_${new Date().toISOString().slice(0,10)}.csv`, csv);
};

const exportDashboardCSV = (activities) => {
  const agg = activityService.aggregate(activities || []);
  const totals = agg.totals || {};
  const scoreObj = calculateCarbonScore(activities || []);
  const goal = GoalService.loadGoal();
  const progress = GoalService.computeProgress(activities || [], goal);
  const breakdown = breakdownByCategory(activities || []);
  const achievements = AchievementService.evaluateAchievements(activities || [], goal).achievements || [];
  const recs = generateRecommendations(activities || []);

  const summary = {
    'Carbon Score': scoreObj.score,
    'Carbon Rating': scoreObj.rating,
    'Monthly Goal (kg)': goal && goal.targetKg ? goal.targetKg : '',
    'Current Progress (kg this month)': progress.current,
    'Progress Percent': progress.percent + '%',
    'Total CO2 (all time)': totals.total,
    'Monthly CO2': totals.monthly,
    'Weekly CO2': totals.weekly,
    "Today's CO2": totals.today,
    'Highest Emission Category': breakdown.list && breakdown.list.length > 0 ? breakdown.list[0].type : '',
    'Number of Activities': activities.length,
    'Number of Achievements': achievements.filter(a => a.unlocked).length,
    'Top Recommendation': recs && recs.length > 0 ? recs[0].title : ''
  };

  const headers = ['Key','Value'];
  const rows = Object.keys(summary).map(k => ({ Key: k, Value: summary[k]}));
  const csv = headers.join(',') + '\n' + rows.map(r => `${escapeCell(r.Key)},${escapeCell(r.Value)}`).join('\n');
  downloadCSV(`ecotrack_dashboard_summary_${new Date().toISOString().slice(0,10)}.csv`, csv);
};

const makeReportData = (activities) => {
  const agg = activityService.aggregate(activities || []);
  const totals = agg.totals || {};
  const scoreObj = calculateCarbonScore(activities || []);
  const goal = GoalService.loadGoal();
  const progress = GoalService.computeProgress(activities || [], goal);
  const breakdown = breakdownByCategory(activities || []);
  const achievements = AchievementService.evaluateAchievements(activities || [], goal).achievements || [];
  const recs = generateRecommendations(activities || []);

  return {
    generatedAt: new Date().toISOString(),
    totals,
    scoreObj,
    goal,
    progress,
    breakdown,
    achievements,
    recommendations: recs,
    recentActivities: activities.slice(0, 20)
  };
};

export const ExportService = {
  exportActivitiesCSV,
  exportDashboardCSV,
  makeReportData,
  downloadCSV
};

export default ExportService;
