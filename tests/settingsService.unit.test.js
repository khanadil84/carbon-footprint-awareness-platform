import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './lib/storageMock.js';
import './lib/storageMock.js';

describe('SettingsService', () => {
  let SettingsService, STORAGE_KEYS;

  before(async () => {
    const mod = await import('../src/utils/settingsService.js');
    SettingsService = mod.SettingsService;
    const cfg = await import('../src/config/securityConfig.js');
    STORAGE_KEYS = cfg.STORAGE_KEYS;
  });

  beforeEach(() => { resetStorage(); });

  describe('loadSettings', () => {
    it('returns defaults when no saved settings', () => {
      const s = SettingsService.loadSettings();
      assert.strictEqual(s.units, 'metric');
      assert.strictEqual(s.defaultView, 'overview');
      assert.strictEqual(s.theme, 'system');
      assert.strictEqual(s.notificationsEnabled, true);
    });

    it('merges saved settings with defaults', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ units: 'imperial' }));
      const s = SettingsService.loadSettings();
      assert.strictEqual(s.units, 'imperial');
      assert.strictEqual(s.defaultView, 'overview');
      assert.strictEqual(s.theme, 'system');
    });

    it('returns defaults for corrupted data', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.SETTINGS, '{corrupt}');
      const s = SettingsService.loadSettings();
      assert.strictEqual(s.units, 'metric');
    });
  });

  describe('saveSettings', () => {
    it('merges partial settings with defaults', () => {
      const s = SettingsService.saveSettings({ units: 'imperial' });
      assert.strictEqual(s.units, 'imperial');
      assert.strictEqual(s.defaultView, 'overview');
    });

    it('returns defaults when null passed', () => {
      const s = SettingsService.saveSettings(null);
      assert.strictEqual(s.units, 'metric');
    });

    it('persists valid settings', () => {
      SettingsService.saveSettings({ theme: 'dark' });
      const loaded = SettingsService.loadSettings();
      assert.strictEqual(loaded.theme, 'dark');
    });
  });

  describe('resetSettings', () => {
    it('resets to defaults', () => {
      SettingsService.saveSettings({ theme: 'dark' });
      const r = SettingsService.resetSettings();
      assert.strictEqual(r.theme, 'system');
    });

    it('persists defaults', () => {
      SettingsService.saveSettings({ theme: 'dark' });
      SettingsService.resetSettings();
      const loaded = SettingsService.loadSettings();
      assert.strictEqual(loaded.theme, 'system');
    });
  });

  describe('defaultSettings', () => {
    it('returns fresh defaults each call', () => {
      const a = SettingsService.defaultSettings();
      const b = SettingsService.defaultSettings();
      assert.deepEqual(a, b);
      a.units = 'modified';
      assert.strictEqual(b.units, 'metric');
    });
  });
});
