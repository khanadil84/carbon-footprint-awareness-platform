import { Telemetry } from './telemetry.js';
import { Perf } from './perf.js';
import { SystemHealthService } from './systemHealth.js';
import { InvariantEngine } from './invariantEngine.js';
import { ActivityCache } from './activityCache.js';
import { CacheStats } from '../performance/CacheStats.js';
import { RecoveryLog } from './recoveryLog.js';
import { safeGetJSON } from './storage.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { computeFullAggregation } from './activityAnalytics.js';
import { generateRecommendations } from './recommendationService.js';

const createTimer = () => {
  const start = performance.now();
  return () => performance.now() - start;
};

const formatHitRate = (hits, misses) => {
  const total = hits + misses;
  return total > 0 ? ((hits / total) * 100).toFixed(1) + '%' : '0%';
};

export const Diagnostics = {
  cache: () => {
    try {
      const perf = Perf.report();
      const cacheStats = CacheStats.snapshot();
      const hits = perf.cacheHits || 0;
      const misses = perf.cacheMisses || 0;
      return {
        hits,
        misses,
        totalRequests: hits + misses,
        hitRate: formatHitRate(hits, misses),
        fullRecomputes: perf.fullRecomputes || 0,
        incrementalUpdates: perf.incrementalUpdates || 0,
        selectorCacheSize: cacheStats.selectorCacheSize || 0,
        activityCount: cacheStats.activityCount || 0,
        memoryEstimate: cacheStats.memoryEstimate?.total || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  selectors: () => {
    try {
      const perf = Perf.report();
      const report = ActivityCache.perfReport();
      return {
        cached: report.selectorCacheSize || 0,
        hitRate: formatHitRate(perf.cacheHits || 0, perf.cacheMisses || 0),
        recomputeRate: perf.fullRecomputes || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  aggregation: () => {
    try {
      const endTimer = createTimer();
      const activities = ActivityCache.getActivities();
      const aggregation = computeFullAggregation(activities);
      const elapsed = endTimer();
      return {
        activityCount: activities.length,
        totalSum: aggregation.totalSum,
        monthlySum: aggregation.monthlySum,
        weeklySum: aggregation.weeklySum,
        todaySum: aggregation.todaySum,
        timingMs: elapsed,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  recommendation: () => {
    try {
      const endTimer = createTimer();
      const activities = ActivityCache.getActivities();
      const recommendations = generateRecommendations(activities);
      const elapsed = endTimer();
      return {
        count: recommendations.length,
        timingMs: elapsed,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  storage: () => {
    try {
      const healthCheck = SystemHealthService.checkStorage();
      const activityData = safeGetJSON(STORAGE_KEYS.ACTIVITIES, []);
      return {
        readable: healthCheck.status === 'healthy',
        writable: healthCheck.status === 'healthy',
        activityCount: Array.isArray(activityData) ? activityData.length : 0,
        detail: healthCheck.detail,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  invariants: () => {
    try {
      const report = InvariantEngine.report();
      const passedCount = report.filter(result => result.pass).length;
      const totalCount = report.length;
      return {
        total: totalCount,
        passed: passedCount,
        failed: totalCount - passedCount,
        allPassed: passedCount === totalCount,
        details: report,
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  recovery: () => {
    try {
      return {
        summary: RecoveryLog.getRecoverySummary(),
        recentEntries: RecoveryLog.getRecoveryHistory({ limit: 20 }),
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  repair: () => ({
    count: Telemetry.count('self_heal_repair'),
    timestamp: Date.now()
  }),

  duplicatePrevention: () => ({
    count: Telemetry.count('dedup_prevented'),
    timestamp: Date.now()
  }),

  telemetry: () => {
    try {
      return {
        summary: Telemetry.summary(),
        counts: Telemetry.counts(),
        totalEvents: Object.values(Telemetry.counts()).reduce((sum, value) => sum + value, 0),
        timestamp: Date.now()
      };
    } catch (error) {
      return { error: error.message, timestamp: Date.now() };
    }
  },

  all: () => ({
    cache: Diagnostics.cache(),
    selectors: Diagnostics.selectors(),
    aggregation: Diagnostics.aggregation(),
    recommendation: Diagnostics.recommendation(),
    storage: Diagnostics.storage(),
    invariants: Diagnostics.invariants(),
    recovery: Diagnostics.recovery(),
    repair: Diagnostics.repair(),
    duplicatePrevention: Diagnostics.duplicatePrevention(),
    telemetry: Diagnostics.telemetry(),
    timestamp: Date.now()
  })
};
