import { safeGetJSON, safeSetJSON } from './storage.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

/** @returns {{units:string, defaultView:string, analyticsRange:string, notificationsEnabled:boolean, theme:string, saveMode:string}} */
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
  const merged = { ...defaultSettings(), ...safeGetJSON(STORAGE_KEY, {}) };
  return isValid(merged) ? merged : defaultSettings();
};

const saveSettings = (settings) => {
  const merged = { ...defaultSettings(), ...(settings || {}) };
  const toSave = isValid(merged) ? merged : defaultSettings();
  safeSetJSON(STORAGE_KEY, toSave);
  return toSave;
};

const resetSettings = () => {
  const defaults = defaultSettings();
  safeSetJSON(STORAGE_KEY, defaults);
  return defaults;
};

export const SettingsService = {
  defaultSettings,
  loadSettings,
  saveSettings,
  resetSettings
};


