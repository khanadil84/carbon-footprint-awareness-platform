let _store = {};

const localStorageMock = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { _store = {}; },
  get length() { return Object.keys(_store).length; },
  key: (i) => Object.keys(_store)[i] || null
};

if (typeof globalThis.localStorage === 'undefined') {
  globalThis.localStorage = localStorageMock;
}

export const resetStorage = () => { _store = {}; };

export const setStorageItem = (key, value) => { _store[key] = String(value); };

export const getStorageItem = (key) => _store[key] || null;

export const dumpStorage = () => ({ ..._store });

export const withStorage = (key, value, fn) => {
  const prev = _store[key] || null;
  _store[key] = String(value);
  try { fn(); } finally { if (prev === null) delete _store[key]; else _store[key] = prev; }
};
