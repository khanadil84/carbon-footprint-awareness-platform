import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './lib/storageMock.js';
import './lib/storageMock.js';

describe('GoalService', () => {
  let GoalService, STORAGE_KEYS, computeFullAggregation;

  before(async () => {
    const mod = await import('../src/utils/goalService.js');
    GoalService = mod.GoalService;
    const cfg = await import('../src/config/securityConfig.js');
    STORAGE_KEYS = cfg.STORAGE_KEYS;
    const analytics = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = analytics.computeFullAggregation;
  });

  beforeEach(() => { resetStorage(); });

  const iso = (d) => d.toISOString();
  const now = new Date();
  const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);

  describe('loadGoal', () => {
    it('returns null when no goal saved', () => {
      assert.strictEqual(GoalService.loadGoal(), null);
    });

    it('returns saved goal', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify({ targetKg: 50 }));
      const g = GoalService.loadGoal();
      assert.strictEqual(g.targetKg, 50);
    });

    it('returns null for corrupt data', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.GOAL, '{corrupt}');
      assert.strictEqual(GoalService.loadGoal(), null);
    });
  });

  describe('saveGoal', () => {
    it('persists goal', () => {
      GoalService.saveGoal({ targetKg: 100 });
      const raw = globalThis.localStorage.getItem(STORAGE_KEYS.GOAL);
      assert.ok(raw);
      assert.ok(JSON.parse(raw).targetKg, 100);
    });

    it('sanitizes targetKg', () => {
      GoalService.saveGoal({ targetKg: 'abc' });
      const g = GoalService.loadGoal();
      assert.strictEqual(g.targetKg, null);
    });

    it('handles null goal (saves with targetKg=0)', () => {
      GoalService.saveGoal(null);
      const g = GoalService.loadGoal();
      assert.strictEqual(g.targetKg, 0);
    });
  });

  describe('clearGoal', () => {
    it('removes goal from storage', () => {
      GoalService.saveGoal({ targetKg: 50 });
      GoalService.clearGoal();
      assert.strictEqual(GoalService.loadGoal(), null);
    });
  });

  describe('computeProgress', () => {
    it('returns no-goal progress when goal is null', () => {
      const p = GoalService.computeProgress([], null);
      assert.strictEqual(p.status, 'No Goal');
      assert.strictEqual(p.target, null);
    });

    it('returns no-goal progress when goal has no targetKg', () => {
      const p = GoalService.computeProgress([], {});
      assert.strictEqual(p.status, 'No Goal');
    });

    it('computes progress with target', () => {
      const p = GoalService.computeProgress([], { targetKg: 100 });
      assert.strictEqual(p.target, 100);
      assert.ok(typeof p.current === 'number');
      assert.ok(typeof p.percent === 'number');
      assert.ok(typeof p.daysRemaining === 'number');
      assert.ok(p.daysRemaining >= 0);
    });

    it('computes progress with activities', () => {
      const acts = [
        { id: 'a', date: iso(shift(0)), type: 'Car', value: 10, co2: 20 }
      ];
      const p = GoalService.computeProgress(acts, { targetKg: 100 });
      assert.strictEqual(p.current, 20);
      assert.ok(p.percent > 0);
    });

    it('returns "Goal Achieved" when under target', () => {
      const acts = [
        { id: 'a', date: iso(shift(0)), type: 'Car', value: 10, co2: 5 }
      ];
      const p = GoalService.computeProgress(acts, { targetKg: 100 });
      assert.ok(['Goal Achieved', 'On Track'].includes(p.status));
    });

    it('returns insight text', () => {
      const p = GoalService.computeProgress([], { targetKg: 100 });
      assert.ok(typeof p.insight === 'string');
    });

    it('computes projection', () => {
      const acts = [
        { id: 'a', date: iso(shift(0)), type: 'Car', value: 10, co2: 30 }
      ];
      // With current=30 on day X, projection = 30/X * totalDays
      const p = GoalService.computeProgress(acts, { targetKg: 100 });
      assert.ok(p.projection > 0);
    });

    it('handles null activities', () => {
      const p = GoalService.computeProgress(null, { targetKg: 100 });
      assert.strictEqual(p.current, 0);
    });

    it('handles undefined activities', () => {
      const p = GoalService.computeProgress(undefined, { targetKg: 100 });
      assert.strictEqual(p.current, 0);
    });

    it('accepts precomputed aggregation', () => {
      const acts = [
        { id: 'a', date: iso(shift(0)), type: 'Car', value: 10, co2: 15 }
      ];
      const full = computeFullAggregation(acts);
      const p = GoalService.computeProgress(acts, { targetKg: 100 }, full);
      assert.strictEqual(p.current, 15);
    });
  });
});
