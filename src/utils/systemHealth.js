import { safeGetJSON, safeSetJSON } from './storage.js';
import { computeFullAggregation } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { GoalService } from './goalService.js';
import { AchievementService } from './achievementService.js';
import { SettingsService } from './settingsService.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';

const MAX_HISTORY = 100;

let lastVerification = null;
let recoveryCount = 0;
const healthHistory = [];

const checkResult = (status, component, detail) => ({
  component,
  status,
  detail,
  score: status === 'healthy' ? 1 : status === 'degraded' ? 0.5 : 0,
  checkedAt: Date.now()
});

const healthy = (component, detail) => checkResult('healthy', component, detail);
const degraded = (component, detail) => checkResult('degraded', component, detail);
const failed = (component, detail) => checkResult('failed', component, detail);

export const SystemHealthService = {
  checkStorage: () => {
    try {
      safeGetJSON(STORAGE_KEYS.ACTIVITIES, null, null, true);
      const writeSuccessful = safeSetJSON('__health_check__', { ts: Date.now() });
      safeGetJSON('__health_check__', null);
      if (!writeSuccessful) return degraded('storage', 'write failed');
      return healthy('storage', 'readable, writable');
    } catch (error) {
      return failed('storage', error.message);
    }
  },

  checkAggregation: (activities) => {
    if (!activities || activities.length === 0) return healthy('aggregation', 'no data');
    try {
      const aggregation = computeFullAggregation(activities);
      const invariantResult = InvariantEngine.verify('aggregationConsistency', activities, aggregation);
      if (!invariantResult.pass) return degraded('aggregation', invariantResult.detail);
      return healthy('aggregation', `${activities.length} activities, ${aggregation.totalSum.toFixed(1)} kg total`);
    } catch (error) {
      return failed('aggregation', error.message);
    }
  },

  checkCache: (cacheSnapshot) => {
    if (!cacheSnapshot) return healthy('cache', 'not initialized');
    const { cachedActivities, cachedAggregation } = cacheSnapshot;
    if (!cachedActivities) return degraded('cache', 'no cached activities');
    if (cachedAggregation) {
      const invariantResult = InvariantEngine.verify('aggregationConsistency', cachedActivities, cachedAggregation);
      if (!invariantResult.pass) return degraded('cache', invariantResult.detail);
    }
    return healthy('cache', `${cachedActivities.length} entries cached`);
  },

  checkRecommendations: (activities) => {
    try {
      const recommendations = generateRecommendations(activities || []);
      if (!Array.isArray(recommendations)) return degraded('recommendations', 'non-array result');
      return healthy('recommendations', `${recommendations.length} recommendations`);
    } catch (error) {
      return failed('recommendations', error.message);
    }
  },

  checkAchievements: (activities, goal) => {
    try {
      const result = AchievementService.evaluateAchievements(activities || [], goal || null);
      if (!result || !Array.isArray(result.achievements)) return degraded('achievements', 'invalid result');
      return healthy('achievements', `${result.achievements.filter(a => a.unlocked).length} unlocked`);
    } catch (error) {
      return failed('achievements', error.message);
    }
  },

  checkGoal: () => {
    try {
      const goal = GoalService.loadGoal();
      const invariantResult = InvariantEngine.verify('goalConsistency', goal);
      if (!invariantResult.pass) return degraded('goal', invariantResult.detail);
      return healthy('goal', goal ? `target ${goal.targetKg} kg` : 'no goal set');
    } catch (error) {
      return failed('goal', error.message);
    }
  },

  checkSettings: () => {
    try {
      const settings = SettingsService.loadSettings();
      if (!settings || typeof settings !== 'object') return degraded('settings', 'invalid settings object');
      return healthy('settings', 'valid');
    } catch (error) {
      return failed('settings', error.message);
    }
  },

  checkValidation: (activities) => {
    if (!activities || activities.length === 0) return healthy('validation', 'no data');
    const invariants = InvariantEngine.verifySystemInvariants(activities, null, null, null);
    const allPass = Object.values(invariants).every(result => result.pass);
    if (!allPass) return degraded('validation', 'invariant failures detected');
    return healthy('validation', `${activities.length} records valid`);
  },

  overall: (state) => {
    const checks = [
      SystemHealthService.checkStorage(),
      SystemHealthService.checkAggregation(state.activities),
      SystemHealthService.checkCache(state.cache),
      SystemHealthService.checkRecommendations(state.activities),
      SystemHealthService.checkAchievements(state.activities, state.goal),
      SystemHealthService.checkGoal(),
      SystemHealthService.checkSettings(),
      SystemHealthService.checkValidation(state.activities)
    ];

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const maxScore = checks.length;
    const healthScore = Math.round((totalScore / maxScore) * 100);
    const hasFailed = checks.some(check => check.status === 'failed');
    const hasDegraded = checks.some(check => check.status === 'degraded');
    const overallStatus = hasFailed ? 'degraded' : hasDegraded ? 'degraded' : 'healthy';

    lastVerification = Date.now();

    const report = {
      status: overallStatus,
      healthScore,
      checks,
      metrics: {
        lastVerification,
        recoveryCount,
        telemetry: Telemetry.summary(),
        invariants: InvariantEngine.report()
      }
    };

    healthHistory.push({ ts: lastVerification, healthScore, status: overallStatus });
    if (healthHistory.length > MAX_HISTORY) healthHistory.shift();

    return report;
  },

  healthScore: () => {
    const checks = [
      SystemHealthService.checkStorage(),
      SystemHealthService.checkGoal(),
      SystemHealthService.checkSettings()
    ];
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round((totalScore / checks.length) * 100);
  },

  recoveryCount: () => recoveryCount,

  incrementRecovery: () => {
    recoveryCount++;
    Telemetry.emit('recovery_complete');
  },

  lastVerification: () => lastVerification,

  history: () => [...healthHistory],

  diagnostics: () => ({
    healthScore: SystemHealthService.healthScore(),
    recoveryCount,
    lastVerification,
    telemetry: Telemetry.summary(),
    invariants: InvariantEngine.report(),
    invariantPassed: InvariantEngine.passed()
  })
};
