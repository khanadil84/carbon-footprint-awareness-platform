import { safeGetJSON, safeSetJSON } from './storage.js';
import { computeFullAggregation } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';
import { GoalService } from './goalService.js';
import { AchievementService } from './achievementService.js';
import { SettingsService } from './settingsService.js';
import { InvariantEngine } from './invariantEngine.js';
import { Telemetry } from './telemetry.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';

let lastVerification = null;
let recoveryCount = 0;
let healthHistory = [];

const ok = (component, detail) => ({ component, status: 'healthy', detail, score: 1, checkedAt: Date.now() });
const degraded = (component, detail) => ({ component, status: 'degraded', detail, score: 0.5, checkedAt: Date.now() });
const failed = (component, detail) => ({ component, status: 'failed', detail, score: 0, checkedAt: Date.now() });

export const SystemHealthService = {
  checkStorage: () => {
    try {
      safeGetJSON(STORAGE_KEYS.ACTIVITIES, null, null, true);
      const writeOk = safeSetJSON('__health_check__', { ts: Date.now() });
      safeGetJSON('__health_check__', null);
      if (!writeOk) return degraded('storage', 'write failed');
      return ok('storage', `readable, writable`);
    } catch (e) {
      return failed('storage', e.message);
    }
  },

  checkAggregation: (activities) => {
    if (!activities || activities.length === 0) return ok('aggregation', 'no data');
    try {
      const agg = computeFullAggregation(activities);
      const inv = InvariantEngine.verify('aggregationConsistency', activities, agg);
      if (!inv.pass) return degraded('aggregation', inv.detail);
      return ok('aggregation', `${activities.length} activities, ${agg.totalSum.toFixed(1)} kg total`);
    } catch (e) {
      return failed('aggregation', e.message);
    }
  },

  checkCache: (cacheSnapshot) => {
    if (!cacheSnapshot) return ok('cache', 'not initialized');
    const { cachedActivities, cachedAggregation } = cacheSnapshot;
    if (!cachedActivities) return degraded('cache', 'no cached activities');
    if (cachedAggregation) {
      const inv = InvariantEngine.verify('aggregationConsistency', cachedActivities, cachedAggregation);
      if (!inv.pass) return degraded('cache', inv.detail);
    }
    return ok('cache', `${cachedActivities.length} entries cached`);
  },

  checkRecommendations: (activities) => {
    try {
      const recs = generateRecommendations(activities || []);
      if (!Array.isArray(recs)) return degraded('recommendations', 'non-array result');
      return ok('recommendations', `${recs.length} recommendations`);
    } catch (e) {
      return failed('recommendations', e.message);
    }
  },

  checkAchievements: (activities, goal) => {
    try {
      const r = AchievementService.evaluateAchievements(activities || [], goal || null);
      if (!r || !Array.isArray(r.achievements)) return degraded('achievements', 'invalid result');
      return ok('achievements', `${r.achievements.filter(a => a.unlocked).length} unlocked`);
    } catch (e) {
      return failed('achievements', e.message);
    }
  },

  checkGoal: () => {
    try {
      const goal = GoalService.loadGoal();
      const inv = InvariantEngine.verify('goalConsistency', goal);
      if (!inv.pass) return degraded('goal', inv.detail);
      return ok('goal', goal ? `target ${goal.targetKg} kg` : 'no goal set');
    } catch (e) {
      return failed('goal', e.message);
    }
  },

  checkSettings: () => {
    try {
      const s = SettingsService.loadSettings();
      if (!s || typeof s !== 'object') return degraded('settings', 'invalid settings object');
      return ok('settings', 'valid');
    } catch (e) {
      return failed('settings', e.message);
    }
  },

  checkValidation: (activities) => {
    if (!activities || activities.length === 0) return ok('validation', 'no data');
    const inv = InvariantEngine.verifySystemInvariants(activities, null, null, null);
    const allPass = Object.values(inv).every(r => r.pass);
    if (!allPass) return degraded('validation', 'invariant failures detected');
    return ok('validation', `${activities.length} records valid`);
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
    const totalScore = checks.reduce((s, c) => s + c.score, 0);
    const maxScore = checks.length;
    const healthScore = Math.round((totalScore / maxScore) * 100);
    const failedChecks = checks.filter(c => c.status === 'failed').length;
    const degradedChecks = checks.filter(c => c.status === 'degraded').length;
    const overallStatus = failedChecks > 0 ? 'degraded' : degradedChecks > 0 ? 'degraded' : 'healthy';

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
    if (healthHistory.length > 100) healthHistory.shift();

    return report;
  },

  healthScore: () => {
    const checks = [
      SystemHealthService.checkStorage(),
      SystemHealthService.checkGoal(),
      SystemHealthService.checkSettings()
    ];
    const totalScore = checks.reduce((s, c) => s + c.score, 0);
    return Math.round((totalScore / checks.length) * 100);
  },

  recoveryCount: () => recoveryCount,
  incrementRecovery: () => { recoveryCount++; Telemetry.emit('recovery_complete'); },

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
