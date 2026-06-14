// Safe wrappers around localStorage with defensive parsing, fallbacks, and recovery.

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
 * Safely remove a key from storage, including any associated metadata keys.
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
 * Attempt to recover corrupted JSON strings by trimming, looking for valid
 * JSON prefixes, and removing trailing garbage.
 * @param {string} raw
 * @returns {string|null} recovered string or null if recovery failed
 */
const recoverJSON = (raw) => {
  const s = raw.trim();
  if (!s) return null;

  // Try to find a complete JSON value by scanning brackets/braces
  const pairs = { '{': '}', '[': ']' };
  const open = s[0];
  const close = pairs[open];
  if (!close) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) depth--;
    if (depth === 0) {
      const candidate = s.slice(0, i + 1);
      try { return JSON.parse(candidate), candidate; } catch { return null; }
    }
  }
  return null;
};

/**
 * Parse JSON safely and return a fallback on error.
 * Attempts corrupted data recovery before giving up.
 * @template T
 * @param {string|null|undefined} raw
 * @param {T} [fallback]
 * @returns {T}
 */
const safeParseJSON = (raw, fallback = null) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    const recovered = recoverJSON(raw);
    if (recovered !== null) {
      try { return JSON.parse(recovered); } catch { /* recovery attempt also failed */ }
    }
    return fallback;
  }
};

/**
 * Deep clone a value using JSON round-trip.
 * Returns the original value if cloning fails.
 * @template T
 * @param {T} value
 * @returns {T}
 */
const deepClone = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
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

/**
 * Read and parse a JSON value from storage with optional schema validation.
 * By default returns a deep clone to prevent in-memory mutation. Pass
 * skipClone=true on hot paths where the caller immediately creates a new
 * array/object from the result (e.g. .filter(), spread).
 * If validation fails, the fallback is returned.
 * @template T
 * @param {string} key
 * @param {T} [fallback]
 * @param {function(T):boolean} [validate]
 * @param {boolean} [skipClone=false]
 * @returns {T}
 */
const safeGetJSON = (key, fallback = null, validate = null, skipClone = false) => {
  const raw = safeGetItem(key);
  const parsed = safeParseJSON(raw, null);
  if (parsed === null) return skipClone ? fallback : deepClone(fallback);
  if (typeof validate === 'function' && !validate(parsed)) return skipClone ? fallback : deepClone(fallback);
  return skipClone ? parsed : deepClone(parsed);
};

/**
 * Validate and write a JSON value to storage.
 * Returns true on success, false on failure.
 * @param {string} key
 * @param {any} value
 * @param {function(any):boolean} [validate]
 * @returns {boolean}
 */
const safeSetJSON = (key, value, validate = null) => {
  if (typeof validate === 'function' && !validate(value)) return false;
  const raw = safeStringifyJSON(value);
  if (raw === null) return false;
  return safeSetItem(key, raw);
};

export { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON, safeStringifyJSON, safeGetJSON, safeSetJSON };
