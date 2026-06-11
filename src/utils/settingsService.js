const STORAGE_KEY = 'eco_settings_v1';

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw);
    if (!isValid(parsed)) {
      // try to merge partials sensibly
      const base = defaultSettings();
      const merged = { ...base, ...(parsed || {}) };
      // ensure types and allowed values
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return toSave;
  } catch (e) {
    console.error('Failed to save settings', e);
    return null;
  }
};

const resetSettings = () => {
  try {
    const defaults = defaultSettings();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
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
