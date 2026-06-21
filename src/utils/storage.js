/** Resolves the best available localStorage reference (browser or global). */
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
};

/** Safely read a raw string from localStorage; returns null on failure. */
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

/** Safely write a string to localStorage; returns false on failure. */
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

/** Safely remove a key from localStorage; returns false on failure. */
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

/** Attempt partial JSON recovery (e.g. truncated strings) by finding the first balanced bracket pair. */
const recoverJSON = (raw) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const pairs = { '{': '}', '[': ']' };
  const openingChar = trimmed[0];
  const closingChar = pairs[openingChar];
  if (!closingChar) return null;

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < trimmed.length; i++) {
    const character = trimmed[i];
    if (escape) { escape = false; continue; }
    if (character === '\\') { escape = true; continue; }
    if (character === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (character === openingChar) depth++;
    else if (character === closingChar) depth--;
    if (depth === 0) {
      const candidate = trimmed.slice(0, i + 1);
      try { JSON.parse(candidate); return candidate; } catch { return null; }
    }
  }
  return null;
};

/** Attempt to parse a JSON string; returns fallback on failure. Attempts partial recovery. */
const safeParseJSON = (raw, fallback = null) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    const recovered = recoverJSON(raw);
    if (recovered !== null) {
      try { return JSON.parse(recovered); } catch { /* ignore second parse failure */ }
    }
    return fallback;
  }
};

/** Deep-clone a value via JSON round-trip; returns original on failure. */
const deepClone = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

/** Safely serialize a value to JSON; returns null on failure. */
const safeStringifyJSON = (value) => {
  try {
    return JSON.stringify(value);
  } catch {
    console.warn('Failed to stringify value for storage');
    return null;
  }
};

/** Retrieve and parse a JSON value from localStorage with optional validation and clone control. */
const safeGetJSON = (key, fallback = null, validate = null, skipClone = false) => {
  const raw = safeGetItem(key);
  const parsed = safeParseJSON(raw, null);
  if (parsed === null) return skipClone ? fallback : deepClone(fallback);
  if (typeof validate === 'function' && !validate(parsed)) return skipClone ? fallback : deepClone(fallback);
  return skipClone ? parsed : deepClone(parsed);
};

/** Serialize and write a JSON value to localStorage with optional validation. */
const safeSetJSON = (key, value, validate = null) => {
  if (typeof validate === 'function' && !validate(value)) return false;
  const serialized = safeStringifyJSON(value);
  if (serialized === null) return false;
  return safeSetItem(key, serialized);
};

export { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON, safeStringifyJSON, safeGetJSON, safeSetJSON };
