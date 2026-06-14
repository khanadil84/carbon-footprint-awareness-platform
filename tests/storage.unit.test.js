import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './lib/storageMock.js';
import './lib/storageMock.js';

describe('Storage', () => {
  let mod;

  before(async () => {
    mod = await import('../src/utils/storage.js');
  });

  beforeEach(() => { resetStorage(); });

  describe('safeGetItem', () => {
    it('returns null for missing key', () => {
      assert.strictEqual(mod.safeGetItem('nonexistent'), null);
    });
    it('returns stored string', () => {
      globalThis.localStorage.setItem('test', 'hello');
      assert.strictEqual(mod.safeGetItem('test'), 'hello');
    });
    it('handles storage errors gracefully', () => {
      const orig = globalThis.localStorage.getItem;
      globalThis.localStorage.getItem = () => { throw new Error('fail'); };
      assert.strictEqual(mod.safeGetItem('x'), null);
      globalThis.localStorage.getItem = orig;
    });
  });

  describe('safeSetItem', () => {
    it('writes and reads back', () => {
      const ok = mod.safeSetItem('k', 'v');
      assert.strictEqual(ok, true);
      assert.strictEqual(globalThis.localStorage.getItem('k'), 'v');
    });
    it('returns false on storage error', () => {
      const orig = globalThis.localStorage.setItem;
      globalThis.localStorage.setItem = () => { throw new Error('full'); };
      assert.strictEqual(mod.safeSetItem('k', 'v'), false);
      globalThis.localStorage.setItem = orig;
    });
  });

  describe('safeRemoveItem', () => {
    it('removes key', () => {
      globalThis.localStorage.setItem('k', 'v');
      mod.safeRemoveItem('k');
      assert.strictEqual(globalThis.localStorage.getItem('k'), null);
    });
    it('returns false on error', () => {
      const orig = globalThis.localStorage.removeItem;
      globalThis.localStorage.removeItem = () => { throw new Error('fail'); };
      assert.strictEqual(mod.safeRemoveItem('k'), false);
      globalThis.localStorage.removeItem = orig;
    });
  });

  describe('safeParseJSON', () => {
    it('parses valid JSON', () => {
      assert.deepEqual(mod.safeParseJSON('{"a":1}'), { a: 1 });
    });
    it('returns fallback for null', () => {
      assert.strictEqual(mod.safeParseJSON(null, 'def'), 'def');
    });
    it('returns fallback for undefined', () => {
      assert.strictEqual(mod.safeParseJSON(undefined, 'def'), 'def');
    });
    it('returns fallback for invalid JSON', () => {
      assert.strictEqual(mod.safeParseJSON('{invalid}', null), null);
    });
    it('attempts recovery for corrupted JSON via safeParseJSON', () => {
      const r = mod.safeParseJSON('{"a":1}\nand some extra', null);
      assert.deepEqual(r, { a: 1 });
    });
    it('returns fallback when recovery also fails', () => {
      const r = mod.safeParseJSON('{incomplete', null);
      assert.strictEqual(r, null);
    });
    it('handles empty string', () => {
      assert.strictEqual(mod.safeParseJSON('', 'def'), 'def');
    });
  });

  describe('safeStringifyJSON', () => {
    it('stringifies valid value', () => {
      const s = mod.safeStringifyJSON({ a: 1 });
      assert.strictEqual(s, '{"a":1}');
    });
    it('returns null for circular', () => {
      const a = {}; a.self = a;
      assert.strictEqual(mod.safeStringifyJSON(a), null);
    });
  });

  describe('deepClone', () => {
    it('preserves deep clone behavior (safeGetJSON returns different ref)', () => {
      mod.safeSetJSON('x', { a: 1 });
      const v1 = mod.safeGetJSON('x', {});
      const v2 = mod.safeGetJSON('x', {});
      v1.a = 999;
      assert.strictEqual(v2.a, 1);
    });
  });

  describe('safeGetJSON', () => {
    it('returns fallback for missing key', () => {
      assert.deepEqual(mod.safeGetJSON('x', { def: true }), { def: true });
    });
    it('returns stored value', () => {
      mod.safeSetJSON('x', [1, 2, 3]);
      assert.deepEqual(mod.safeGetJSON('x', []), [1, 2, 3]);
    });
    it('returns deep clone by default (different ref)', () => {
      mod.safeSetJSON('x', { a: 1 });
      const v1 = mod.safeGetJSON('x', {});
      const v2 = mod.safeGetJSON('x', {});
      v1.a = 999;
      assert.strictEqual(v2.a, 1);
    });
    it('skips clone with skipClone=true', () => {
      mod.safeSetJSON('x', { a: 1 });
      const v1 = mod.safeGetJSON('x', null, null, true);
      assert.strictEqual(v1.a, 1);
    });
    it('validates with custom function', () => {
      mod.safeSetJSON('x', { a: 1 });
      const r = mod.safeGetJSON('x', 'fallback', (v) => v && v.a === 1);
      assert.deepEqual(r, { a: 1 });
    });
    it('returns fallback when validation fails', () => {
      mod.safeSetJSON('x', { a: 1 });
      const r = mod.safeGetJSON('x', 'fallback', (v) => v.a === 999);
      assert.strictEqual(r, 'fallback');
    });
  });

  describe('safeSetJSON', () => {
    it('writes valid JSON', () => {
      assert.strictEqual(mod.safeSetJSON('k', { b: 2 }), true);
    });
    it('returns false for non-serializable', () => {
      const a = {}; a.self = a;
      assert.strictEqual(mod.safeSetJSON('k', a), false);
    });
    it('validates with custom function', () => {
      assert.strictEqual(mod.safeSetJSON('k', { a: 1 }, () => false), false);
    });
  });
});
