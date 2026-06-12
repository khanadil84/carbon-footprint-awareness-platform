// Safe wrappers around localStorage with defensive parsing and fallbacks
const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage;
  return null;
};

const safeGetItem = (key) => {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (e) {
    console.error('localStorage.getItem failed', e);
    return null;
  }
};

const safeSetItem = (key, value) => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('localStorage.setItem failed', e);
    return false;
  }
};

const safeRemoveItem = (key) => {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (e) {
    console.error('localStorage.removeItem failed', e);
    return false;
  }
};

const safeParseJSON = (raw, fallback = null) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse JSON from storage, returning fallback', e);
    return fallback;
  }
};

export { safeGetItem, safeSetItem, safeRemoveItem, safeParseJSON };

export default {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeParseJSON
};
