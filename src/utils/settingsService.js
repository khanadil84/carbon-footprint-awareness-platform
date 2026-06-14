import { safeGetJSON, safeSetJSON } from './storage.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { settings } from '../domain/validation.js';

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

const DEFAULT_SETTINGS = Object.freeze({
  units: 'metric',
  defaultView: 'overview',
  analyticsRange: 'monthly',
  notificationsEnabled: true,
  theme: 'system',
  saveMode: 'auto'
});

const cloneDefaults = () => ({ ...DEFAULT_SETTINGS });

const loadSettings = () => {
  const merged = Object.assign(cloneDefaults(), safeGetJSON(STORAGE_KEY, {}));
  return settings.isValid(merged) ?? cloneDefaults();
};

const saveSettings = (settingsData) => {
  const merged = settingsData ? Object.assign(cloneDefaults(), settingsData) : cloneDefaults();
  const toSave = settings.isValid(merged) ?? cloneDefaults();
  safeSetJSON(STORAGE_KEY, toSave);
  return toSave;
};

const resetSettings = () => {
  const defaults = cloneDefaults();
  safeSetJSON(STORAGE_KEY, defaults);
  return defaults;
};

export const SettingsService = {
  defaultSettings: cloneDefaults,
  loadSettings,
  saveSettings,
  resetSettings
};


