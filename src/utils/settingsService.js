import { safeGetItem, safeSetItem, safeParseJSON } from './storage.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

const defaultSettings = () => ({
  units: 'metric', // 'metric' (kg, km) or 'imperial' (lbs, miles)
  defaultView: 'overview', // 'overview' | 'analytics' | 'history'
  analyticsRange: 'monthly', // 'daily' | 'weekly' | 'monthly'
  notificationsEnabled: true,
  theme: 'system', // placeholder: 'system' | 'light' | 'dark'
  saveMode: 'auto' // 'auto' | 'manual'
});

const isValid = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  const units = ['metric','imperial'];
  const views = ['overview','analytics','history'];
  const ranges = ['daily','weekly','monthly'];
  const themes = ['system','light','dark'];
  const saves = ['auto','manual'];
  return units.includes(obj.units) && views.includes(obj.defaultView) && ranges.includes(obj.analyticsRange) && typeof obj.notificationsEnabled === 'boolean' && themes.includes(obj.theme) && saves.includes(obj.saveMode);
};

const loadSettings = () => {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    const parsed = safeParseJSON(raw, null);
    if (!parsed) return defaultSettings();
    if (!isValid(parsed)) {
      const base = defaultSettings();
      const merged = { ...base, ...(parsed || {}) };
      if (!isValid(merged)) return base;
      return merged;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load settings, using defaults', e);
    return defaultSettings();
  }
};

const saveSettings = (settings) => {
  try {
    const toSave = isValid(settings) ? settings : (() => {
      const base = defaultSettings();
      const merged = { ...base, ...(settings || {}) };
      return isValid(merged) ? merged : base;
    })();
    safeSetItem(STORAGE_KEY, JSON.stringify(toSave));
    return toSave;
  } catch (e) {
    console.error('Failed to save settings', e);
    return null;
  }
};

const resetSettings = () => {
  try {
    const defaults = defaultSettings();
    safeSetItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  } catch (e) {
    console.error('Failed to reset settings', e);
    return defaultSettings();
  }
};

export const SettingsService = {
  defaultSettings,
  loadSettings,
  saveSettings,
  resetSettings
};

export default SettingsService;
