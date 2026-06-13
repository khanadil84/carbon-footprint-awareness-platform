import { safeGetJSON, safeSetJSON } from './storage.js';
import { STORAGE_KEYS } from '../config/securityConfig.js';
import { settings } from '../domain/validation.js';

const STORAGE_KEY = STORAGE_KEYS.SETTINGS;

const defaultSettings = () => ({
  units: 'metric',
  defaultView: 'overview',
  analyticsRange: 'monthly',
  notificationsEnabled: true,
  theme: 'system',
  saveMode: 'auto'
});

const loadSettings = () => {
  const merged = { ...defaultSettings(), ...safeGetJSON(STORAGE_KEY, {}) };
  const validated = settings.isValid(merged);
  return validated ?? defaultSettings();
};

const saveSettings = (settingsData) => {
  const merged = { ...defaultSettings(), ...(settingsData || {}) };
  const toSave = settings.isValid(merged) ?? defaultSettings();
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


