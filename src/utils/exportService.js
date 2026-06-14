import { computeFullAggregation, breakdownByCategory } from './activityAnalytics.js';
import { calculateCarbonScore } from './carbonScoreService.js';
import { GoalService } from './goalService.js';
import { AchievementService } from './achievementService.js';
import { generateRecommendations } from './recommendationService.js';
import { getCategoryForType } from '../config/constants.js';
import { MAX_RECENT_ACTIVITIES } from '../config/securityConfig.js';

const CSV_FORMULA_PREFIX = /^[=+\-@\t]/;

const escapeCell = (v) => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (CSV_FORMULA_PREFIX.test(s)) {
    s = "'" + s;
  }
  if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const downloadCSV = (filename, csvContent) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
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
  const headerLine = ['Date','Activity Type','Input Value','Estimated CO2','Category'].map(escapeCell).join(',');
  const lines = new Array(activities.length + 1);
  lines[0] = headerLine;
  for (let i = 0; i < activities.length; i++) {
    const a = activities[i];
    lines[i + 1] = [
      escapeCell(new Date(a.date).toLocaleString()),
      escapeCell(a.type),
      escapeCell(a.value),
      escapeCell(a.co2),
      escapeCell(getCategoryForType(a.type))
    ].join(',');
  }
  downloadCSV(`ecotrack_activities_${new Date().toISOString().slice(0,10)}.csv`, lines.join('\n'));
};

const countUnlocked = (achievements) => {
  let count = 0;
  for (let i = 0; i < achievements.length; i++) {
    if (achievements[i].unlocked) count++;
  }
  return count;
};

const buildReportData = (activities) => {
  const activitiesArr = activities || [];
  const goal = GoalService.loadGoal();
  const full = computeFullAggregation(activitiesArr);
  const breakdown = breakdownByCategory(activitiesArr, full);
  return {
    totals: { today: full.todaySum, weekly: full.weeklySum, monthly: full.monthlySum, total: full.totalSum },
    scoreObj: calculateCarbonScore(activitiesArr, full, breakdown),
    goal,
    progress: GoalService.computeProgress(activitiesArr, goal, full),
    breakdown,
    achievements: AchievementService.evaluateAchievements(activitiesArr, goal, full).achievements || [],
    recs: generateRecommendations(activitiesArr, breakdown, full.monthlySum)
  };
};

/**
 * Build a summary CSV of dashboard metrics and download it.
 * @param {Array} activities
 */
const exportDashboardCSV = (activities) => {
  const { totals, scoreObj, goal, progress, breakdown, achievements, recs } = buildReportData(activities);

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
    'Number of Achievements': countUnlocked(achievements),
    'Top Recommendation': recs && recs.length > 0 ? recs[0].title : ''
  };

  const headerLine = 'Key,Value';
  const keys = Object.keys(summary);
  const lines = new Array(keys.length + 1);
  lines[0] = headerLine;
  for (let i = 0; i < keys.length; i++) {
    lines[i + 1] = `${escapeCell(keys[i])},${escapeCell(summary[keys[i]])}`;
  }
  downloadCSV(`ecotrack_dashboard_summary_${new Date().toISOString().slice(0,10)}.csv`, lines.join('\n'));
};

/**
 * Build a printable report data object containing all dashboard metrics.
 * @param {Array} activities
 * @returns {{generatedAt:string, totals, scoreObj, goal, progress, breakdown, achievements, recommendations, recentActivities}}
 */
const makeReportData = (activities) => {
  const { totals, scoreObj, goal, progress, breakdown, achievements, recs } = buildReportData(activities);
  return {
    generatedAt: new Date().toISOString(),
    totals,
    scoreObj,
    goal,
    progress,
    breakdown,
    achievements,
    recommendations: recs,
    recentActivities: activities.slice(0, MAX_RECENT_ACTIVITIES)
  };
};

export const ExportService = {
  exportActivitiesCSV,
  exportDashboardCSV,
  makeReportData,
  downloadCSV
};


