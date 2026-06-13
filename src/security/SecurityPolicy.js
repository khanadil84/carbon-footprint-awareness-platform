import { DATA_CLASSIFICATION } from './SecurityConstants.js';

export const CSP = {
  meta: {
    'default-src': "'self'",
    'script-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https:']
  },
  strict: {
    'default-src': "'self'",
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https:'],
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': "'none'",
    'upgrade-insecure-requests': ''
  },
  directivesToString: (directives) => {
    return Object.entries(directives)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => {
        const vals = Array.isArray(v) ? v.join(' ') : String(v);
        return vals ? `${k} ${vals}` : k;
      })
      .join('; ');
  }
};

export const RECOMMENDED_HEADERS = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];

export const checkSchemaIntegrity = (data, schema) => {
  if (!data || typeof data !== 'object') return { valid: false, error: 'Data must be an object' };
  if (!schema || typeof schema !== 'object') return { valid: false, error: 'Schema must be an object' };
  const errors = [];
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`Missing required field: ${key}`);
      continue;
    }
    if (value === undefined || value === null) continue;
    if (rules.type && typeof value !== rules.type) {
      errors.push(`Field ${key}: expected ${rules.type}, got ${typeof value}`);
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`Field ${key}: invalid value`);
    }
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`Field ${key}: exceeds max length ${rules.maxLength}`);
    }
    if (rules.max && typeof value === 'number' && value > rules.max) {
      errors.push(`Field ${key}: exceeds max ${rules.max}`);
    }
    if (rules.min && typeof value === 'number' && value < rules.min) {
      errors.push(`Field ${key}: below min ${rules.min}`);
    }
  }
  return { valid: errors.length === 0, error: errors.join('; ') || null };
};

export const detectStorageCorruption = (value) => {
  if (value === null || value === undefined) return { corrupted: false };
  if (typeof value === 'string') {
    if (!value.trim()) return { corrupted: true, reason: 'empty_string' };
    if (value.startsWith('[object') || value.startsWith('function')) return { corrupted: true, reason: 'stringified_object' };
    if (value.includes('[Circular]')) return { corrupted: true, reason: 'circular_reference' };
    const opens = (value.match(/[{[]/g) || []).length;
    const closes = (value.match(/[}\]]/g) || []).length;
    if (opens !== closes) return { corrupted: true, reason: 'unbalanced_brackets' };
  }
  return { corrupted: false };
};

export const classifyData = (key) => {
  const k = String(key).toLowerCase();
  if (k.includes('token') || k.includes('password') || k.includes('credential') || k.includes('secret')) return DATA_CLASSIFICATION.CRITICAL;
  if (k.includes('user') || k.includes('auth') || k.includes('session')) return DATA_CLASSIFICATION.SENSITIVE;
  if (k.includes('activity') || k.includes('settings') || k.includes('goal') || k.includes('achievement')) return DATA_CLASSIFICATION.INTERNAL;
  return DATA_CLASSIFICATION.PUBLIC;
};

export const TrustBoundaries = {
  CLIENT_STORAGE: 'client:localStorage',
  CLIENT_RENDER: 'client:DOM',
  CLIENT_NETWORK: 'client:network',
  AUTH_PROVIDER: 'auth:provider',
  THIRD_PARTY_CDN: 'third_party:cdn'
};

export const describeBoundary = (boundary) => {
  const descriptions = {
    [TrustBoundaries.CLIENT_STORAGE]: 'Browser localStorage (unencrypted, same-origin accessible)',
    [TrustBoundaries.CLIENT_RENDER]: 'DOM rendering tree (XSS target, JSX-escaped)',
    [TrustBoundaries.CLIENT_NETWORK]: 'Outbound HTTPS fetch/XHR (backend API calls)',
    [TrustBoundaries.AUTH_PROVIDER]: 'Authentication provider (token issuance, session management)',
    [TrustBoundaries.THIRD_PARTY_CDN]: 'Third-party CDN resources (fonts, external scripts)'
  };
  return descriptions[boundary] || 'Unknown boundary';
};

export const SecurityPolicy = {
  CSP,
  RECOMMENDED_HEADERS,
  checkSchemaIntegrity,
  detectStorageCorruption,
  classifyData,
  TrustBoundaries,
  describeBoundary
};
