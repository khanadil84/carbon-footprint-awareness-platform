/**
 * Validate an email address.
 * @param {string} email
 * @returns {string} empty string if valid, error message otherwise
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return 'Email is required';
  if (!re.test(email)) return 'Please enter a valid email address';
  return '';
};

/**
 * Validate a password meets minimum length.
 * @param {string} password
 * @returns {string} empty string if valid, error message otherwise
 */
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  return '';
};

const strengthRules = [
  { test: (p) => p.length >= 8, weight: 1 },
  { test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p), weight: 1 },
  { test: (p) => /[0-9]/.test(p), weight: 1 },
  { test: (p) => /[^A-Za-z0-9]/.test(p), weight: 1 }
];

const strengthLabels = [
  { min: 0, max: 1, label: 'Weak', color: '#ef4444' },
  { min: 2, max: 3, label: 'Fair', color: '#eab308' },
  { min: 4, max: 4, label: 'Strong', color: 'var(--brand-primary)' }
];

/**
 * Score password strength (0-4) and return a label + color.
 * @param {string} password
 * @returns {{score:number, label:string, color:string}}
 */
export const checkPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Weak', color: 'var(--color-gray-200)' };

  const score = strengthRules.reduce((s, r) => r.test(password) ? s + r.weight : s, 0);
  const match = strengthLabels.find(l => score >= l.min && score <= l.max) || { label: 'Weak', color: 'var(--color-gray-200)' };

  return { score, label: match.label, color: match.color };
};

/**
 * Strip control characters, trim, and collapse whitespace.
 * @param {*} s
 * @returns {string}
 */
export const sanitizeString = (s) => {
  if (s === null || s === undefined) return '';
  try {
    const cleaned = String(s).split('').filter(ch => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    }).join('');
    return cleaned.trim().replace(/\s+/g, ' ');
  } catch {
    return '';
  }
};

/**
 * Capitalize each word of a sanitized string.
 * @param {string} s
 * @returns {string}
 */
export const normalizeName = (s) => {
  const clean = sanitizeString(s);
  return clean.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

/**
 * Convert value to a finite number or return fallback.
 * @param {*} n
 * @param {*} [fallback=0]
 * @returns {number}
 */
export const sanitizeNumber = (n, fallback = 0) => {
  const num = Number(n);
  if (Number.isFinite(num)) return num;
  return fallback;
};

import { ACTIVITY_TYPES } from '../config/constants.js';

/**
 * Check whether a string is a known activity type.
 * @param {string} t
 * @returns {boolean}
 */
export const validActivityType = (t) => ACTIVITY_TYPES.includes(String(t));
