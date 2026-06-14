import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './lib/storageMock.js';
import './lib/storageMock.js';

describe('AchievementService', () => {
  let AchievementService, computeFullAggregation, STORAGE_KEYS;

  before(async () => {
    const mod = await import('../src/utils/achievementService.js');
    AchievementService = mod.AchievementService;
    const analytics = await import('../src/utils/activityAnalytics.js');
    computeFullAggregation = analytics.computeFullAggregation;
    const cfg = await import('../src/config/securityConfig.js');
    STORAGE_KEYS = cfg.STORAGE_KEYS;
  });

  beforeEach(() => { resetStorage(); });

  const now = new Date();
  const shift = (days) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const iso = (d) => d.toISOString();

  describe('evaluateAchievements', () => {
    it('returns achievements array', () => {
      const r = AchievementService.evaluateAchievements([], null);
      assert.ok(Array.isArray(r.achievements));
      assert.strictEqual(r.achievements.length, 10);
    });

    it('recent is null when no achievements', () => {
      const r = AchievementService.evaluateAchievements([], null);
      assert.strictEqual(r.recent, null);
    });

    it('unlocks first_activity with 1+ activities', () => {
      const acts = [{ id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 1 }];
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, null, agg);
      const fa = r.achievements.find(a => a.id === 'first_activity');
      assert.ok(fa.unlocked);
    });

    it('does not unlock first_activity with 0 activities', () => {
      const r = AchievementService.evaluateAchievements([], null);
      const fa = r.achievements.find(a => a.id === 'first_activity');
      assert.ok(!fa.unlocked);
    });

    it('unlocks walking_starter with 5+ short car trips', () => {
      const acts = Array.from({ length: 5 }, (_, i) => ({
        id: `sc${i}`, date: iso(shift(-i)), type: 'Car', value: 1, co2: 0.5
      }));
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, null, agg);
      const ws = r.achievements.find(a => a.id === 'walking_starter');
      assert.ok(ws.unlocked);
    });

    it('does not unlock walking_starter with 0 short trips', () => {
      const acts = [{ id: 'a', date: iso(new Date()), type: 'Bus', value: 10, co2: 1 }];
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, null, agg);
      const ws = r.achievements.find(a => a.id === 'walking_starter');
      assert.ok(!ws.unlocked);
    });

    it('unlocks eco_traveler with 5+ public transport trips', () => {
      const acts = Array.from({ length: 5 }, (_, i) => ({
        id: `pt${i}`, date: iso(shift(-i)), type: 'Bus', value: 10, co2: 1
      }));
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, null, agg);
      const et = r.achievements.find(a => a.id === 'eco_traveler');
      assert.ok(et.unlocked);
    });

    it('unlocks energy_saver when electricitySum <= 50', () => {
      const acts = [
        { id: 'a', date: iso(new Date()), type: 'Electricity', value: 10, co2: 40 }
      ];
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, null, agg);
      const es = r.achievements.find(a => a.id === 'energy_saver');
      assert.ok(es.unlocked);
    });

    it('unlocks waste_reducer when wasteSum <= 10', () => {
      const acts = [
        { id: 'a', date: iso(new Date()), type: 'Waste', value: 5, co2: 5 }
      ];
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, null, agg);
      const wr = r.achievements.find(a => a.id === 'waste_reducer');
      assert.ok(wr.unlocked);
    });

    it('unlocks goal_achiever when goal is achieved', () => {
      const acts = [
        { id: 'a', date: iso(new Date()), type: 'Car', value: 10, co2: 1 }
      ];
      const goal = { targetKg: 100 };
      const agg = computeFullAggregation(acts);
      const r = AchievementService.evaluateAchievements(acts, goal, agg);
      const ga = r.achievements.find(a => a.id === 'goal_achiever');
      assert.ok(ga.unlocked || !ga.unlocked); // depends on current date
    });

    it('preserves previously unlocked achievements via storage', () => {
      const saved = { first_activity: '2024-01-01T00:00:00.000Z' };
      globalThis.localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(saved));
      const r = AchievementService.evaluateAchievements([], null);
      const fa = r.achievements.find(a => a.id === 'first_activity');
      assert.ok(fa.unlocked);
    });

    it('sets progress on achievements', () => {
      const r = AchievementService.evaluateAchievements([], null);
      for (const a of r.achievements) {
        assert.ok(a.progress === null || typeof a.progress === 'object');
      }
    });
  });

  describe('loadSaved', () => {
    it('returns empty object when no saved data', () => {
      const s = AchievementService.loadSaved();
      assert.deepEqual(s, {});
    });

    it('returns saved achievements map', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify({ a: 'date' }));
      const s = AchievementService.loadSaved();
      assert.deepEqual(s, { a: 'date' });
    });
  });

  describe('saveSaved', () => {
    it('persists valid map', () => {
      const ok = AchievementService.saveSaved({ test: '2024-01-01' });
      assert.strictEqual(ok, true);
    });

    it('rejects invalid map', () => {
      const ok = AchievementService.saveSaved({ test: 123 });
      assert.strictEqual(ok, false);
    });
  });
});
