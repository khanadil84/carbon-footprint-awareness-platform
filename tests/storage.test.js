import assert from 'assert';

// Polyfill localStorage for Node test environment
let _store = {};
globalThis.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(_store, k) ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
  clear: () => { _store = {}; }
};

console.log('Running storage tests...');

import { safeGetJSON, safeSetJSON, safeParseJSON } from '../src/utils/storage.js';

// Ensure clean state
globalThis.localStorage.clear();

// 1. Malformed JSON in storage should return fallback
_store['test_bad'] = '{ invalid json';
const got = safeGetJSON('test_bad', { fallback: true });
assert.deepStrictEqual(got, { fallback: true }, 'safeGetJSON should return fallback on malformed JSON');

// 2. safeParseJSON should return fallback for invalid input
const parsed = safeParseJSON('{not:json}', null);
assert.strictEqual(parsed, null, 'safeParseJSON should return fallback for invalid JSON');

// 3. safeSetJSON should fail gracefully when given non-serializable value (circular)
const a = {};
a.self = a;
const ok = safeSetJSON('circular', a);
assert.strictEqual(ok, false, 'safeSetJSON should return false for non-serializable values');

// 4. safeSetJSON / safeGetJSON roundtrip for valid object
const o = { a: 1, b: 'x' };
const ok2 = safeSetJSON('mykey', o);
assert.strictEqual(ok2, true, 'safeSetJSON should return true for serializable values');
const got2 = safeGetJSON('mykey', null);
assert.deepStrictEqual(got2, o, 'safeGetJSON should return stored object');

console.log('All storage tests passed.');
