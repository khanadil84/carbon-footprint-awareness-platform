// Centralized security-related configuration with sensible defaults.
// Uses Vite's import.meta.env variables (VITE_*) when available.

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : (typeof globalThis !== 'undefined' && globalThis.process && globalThis.process.env ? globalThis.process.env : {});

const SESSION_TIMEOUT_MINUTES = Number(env.VITE_SESSION_TIMEOUT_MINUTES || env.REACT_APP_SESSION_TIMEOUT_MINUTES || 30);

const STORAGE_KEYS = {
  TOKEN: env.VITE_STORAGE_TOKEN_KEY || 'eco_token',
  USER: env.VITE_STORAGE_USER_KEY || 'eco_user',
  ACTIVITIES: env.VITE_STORAGE_ACTIVITIES_KEY || 'eco_activities_v1',
  SETTINGS: env.VITE_STORAGE_SETTINGS_KEY || 'eco_settings_v1',
  GOAL: env.VITE_STORAGE_GOAL_KEY || 'eco_goal_v1',
  ACHIEVEMENTS: env.VITE_STORAGE_ACHIEVEMENTS_KEY || 'eco_achievements_v1'
};

const MAX_STRING_LENGTH = 1000;
const MAX_RECENT_ACTIVITIES = 20;
const DEFAULT_ANALYTICS_DAYS = 30;
const MAX_ACTIVITY_VALUE = 1e6;

export { SESSION_TIMEOUT_MINUTES, MAX_STRING_LENGTH, MAX_RECENT_ACTIVITIES, DEFAULT_ANALYTICS_DAYS, MAX_ACTIVITY_VALUE, STORAGE_KEYS };
