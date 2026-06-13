// Safe wrappers around localStorage with defensive parsing and fallbacks
// Adds small helpers for safe JSON stringify/parse and keeps APIs backward-compatible.
/**
 * Resolve a storage provider (browser localStorage when available).
 * Returns null in non-browser or restricted environments.
 * @returns {Storage|null}
 */
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
};

/**
 * Safely read a string value from storage.
 * @param {string} key
 * @returns {string|null}
 */
const safeGetItem = (key) => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (e) {
    // avoid leaking sensitive internals in production logs
    console.error('localStorage.getItem failed', e && e.message ? e.message : e);
    return null;
  }
};

/**
 * Safely write a string value to storage.
 * @param {string} key
 * @param {string} value
 * @returns {boolean} success
 */
const safeSetItem = (key, value) => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('localStorage.setItem failed', e && e.message ? e.message : e);
    return false;
  }
};

/**
 * Safely remove a key from storage.
 * @param {string} key
 * @returns {boolean} success
 */
const safeRemoveItem = (key) => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (e) {
    console.error('localStorage.removeItem failed', e && e.message ? e.message : e);
    return false;
  }
};

/**
 * Parse JSON safely and return a fallback on error.
 * @template T
 * @param {string|null|undefined} raw
 * @param {T|null} [fallback=null]
 * @returns {T|null}
 */
const safeParseJSON = (raw, fallback = null) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    console.warn('Failed to parse JSON from storage, returning fallback');
    return fallback;
  }
};

/**
 * Stringify a value for storage, returning null on failure.
 * @param {any} value
 * @returns {string|null}
 */
const safeStringifyJSON = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    console.warn('Failed to stringify value for storage');
    return null;
  }
};

const safeGetJSON = (key, fallback = null) => {
  const raw = safeGetItem(key);
  return safeParseJSON(raw, fallback);
};

const safeSetJSON = (key, value) => {
  const raw = safeStringifyJSON(value);
  if (raw === null) return false;
  return safeSetItem(key, raw);
};

export { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON, safeStringifyJSON, safeGetJSON, safeSetJSON };
