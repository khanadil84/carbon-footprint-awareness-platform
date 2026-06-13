import { MAX_STRING_LENGTH, MAX_ACTIVITY_VALUE } from '../config/securityConfig.js';
import { ACTIVITY_TYPES } from '../config/constants.js';

export const LIMITS = {
  EMAIL_MAX: 254,
  PASSWORD_MIN: 8,
  STRING_MAX: MAX_STRING_LENGTH,
  NAME_MIN: 1,
  NAME_MAX: 200,
  ACTIVITY_VALUE_MIN: 1,
  ACTIVITY_VALUE_MAX: MAX_ACTIVITY_VALUE,
  GOAL_TARGET_MIN: 1,
  GOAL_TARGET_MAX: MAX_ACTIVITY_VALUE
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ALLOWED = {
  ACTIVITY_TYPES,
  SETTINGS: {
    UNITS: ['metric', 'imperial'],
    VIEWS: ['overview', 'analytics', 'history'],
    RANGES: ['daily', 'weekly', 'monthly'],
    THEMES: ['system', 'light', 'dark'],
    SAVES: ['auto', 'manual'],
    KEYS: ['units', 'defaultView', 'analyticsRange', 'notificationsEnabled', 'theme', 'saveMode']
  },
  PASSWORD_RULES: [
    { test: (p) => p.length >= 8, weight: 1 },
    { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), weight: 1 },
    { test: (p) => /[0-9]/.test(p), weight: 1 },
    { test: (p) => /[^A-Za-z0-9]/.test(p), weight: 1 }
  ],
  PASSWORD_LABELS: [
    { min: 0, max: 1, label: 'Weak', color: '#ef4444' },
    { min: 2, max: 3, label: 'Fair', color: '#eab308' },
    { min: 4, max: 4, label: 'Strong', color: 'var(--brand-primary)' }
  ]
};

export const sanitizeString = (s, maxLength = LIMITS.STRING_MAX) => {
  if (s === null || s === undefined) return '';
  try {
    const cleaned = String(s).split('').filter(ch => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    }).join('');
    const trimmed = cleaned.trim().replace(/\s+/g, ' ');
    return trimmed.slice(0, maxLength);
  } catch {
    return '';
  }
};

export const sanitizeNumber = (n, fallback = 0) => {
  const num = Number(n);
  if (Number.isFinite(num)) return num;
  return fallback;
};

export const normalizeName = (s) => {
  const clean = sanitizeString(s);
  return clean.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const required = (v, msg = 'Required') => {
  if (v === null || v === undefined) return msg;
  if (typeof v === 'string' && !v.trim()) return msg;
  return '';
};

const minLength = (n, msg) => (v) => {
  if (!v || v.length < n) return msg || `Must be at least ${n} characters`;
  return '';
};

const maxLength = (n) => (v) => {
  if (v && v.length > n) return `Must be at most ${n} characters`;
  return '';
};

const matches = (re, msg) => (v) => {
  if (v && !re.test(v)) return msg || 'Invalid format';
  return '';
};

const isPositiveNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

export const validateEmail = (email) => {
  const clean = sanitizeString(email);
  if (!clean) return 'Email is required';
  const tooLong = maxLength(LIMITS.EMAIL_MAX)(clean);
  if (tooLong) return tooLong;
  const invalid = matches(EMAIL_RE, 'Please enter a valid email address')(clean);
  if (invalid) return invalid;
  return '';
};

export const validatePassword = (password) => {
  const noPw = required(password, 'Password is required');
  if (noPw) return noPw;
  const short = minLength(LIMITS.PASSWORD_MIN, 'Password must be at least 8 characters long')(password);
  if (short) return short;
  return '';
};

export const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Weak', color: 'var(--color-gray-200)' };
  const score = ALLOWED.PASSWORD_RULES.reduce((s, r) => r.test(password) ? s + r.weight : s, 0);
  const match = ALLOWED.PASSWORD_LABELS.find(l => score >= l.min && score <= l.max) || { label: 'Weak', color: 'var(--color-gray-200)' };
  return { score, label: match.label, color: match.color };
};

export const validActivityType = (t) => ACTIVITY_TYPES.includes(String(t));

export const activity = {
  isValidType: validActivityType,

  isValidValue: (v) => isPositiveNumber(v) && v <= LIMITS.ACTIVITY_VALUE_MAX,

  isValidRecord: (a) => a && typeof a === 'object'
    && typeof a.id === 'string' && typeof a.date === 'string'
    && typeof a.type === 'string' && typeof a.value === 'number'
    && typeof a.co2 === 'number',

  isValidList: (list) => Array.isArray(list) && list.every(activity.isValidRecord)
};

export const goal = {
  isValidTarget: (v) => isPositiveNumber(v) && v <= LIMITS.GOAL_TARGET_MAX
};

export const settings = {
  isValid: (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    const out = {};
    for (const key of ALLOWED.SETTINGS.KEYS) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) return null;
      out[key] = obj[key];
    }
    if (!ALLOWED.SETTINGS.UNITS.includes(out.units)) return null;
    if (!ALLOWED.SETTINGS.VIEWS.includes(out.defaultView)) return null;
    if (!ALLOWED.SETTINGS.RANGES.includes(out.analyticsRange)) return null;
    if (typeof out.notificationsEnabled !== 'boolean') return null;
    if (!ALLOWED.SETTINGS.THEMES.includes(out.theme)) return null;
    if (!ALLOWED.SETTINGS.SAVES.includes(out.saveMode)) return null;
    return out;
  }
};

export const achievements = {
  isValidSavedEntry: (val) => val === null || typeof val === 'string',

  isValidSavedMap: (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
    for (const key of Object.keys(obj)) {
      if (!achievements.isValidSavedEntry(obj[key])) return false;
    }
    return true;
  }
};

export const auth = {
  validateForm: (data) => {
    const name = sanitizeString(data.name);
    const nameErr = required(name, 'Full name is required') || minLength(LIMITS.NAME_MIN)(name) || maxLength(LIMITS.NAME_MAX)(name);
    const email = sanitizeString(data.email);
    const emailErr = validateEmail(email);
    const pwErr = validatePassword(data.password);
    const strength = checkPasswordStrength(data.password);
    const pwStrengthErr = pwErr ? '' : (strength.score < 4 ? 'Password must meet all complexity requirements' : '');
    return {
      name: normalizeName(name),
      email,
      errors: { name: nameErr, email: emailErr, password: pwStrengthErr || pwErr, submit: '' },
      hasError: !!(nameErr || emailErr || pwErr || pwStrengthErr)
    };
  }
};
