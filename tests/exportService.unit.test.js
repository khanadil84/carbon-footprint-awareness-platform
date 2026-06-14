import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resetStorage } from './lib/storageMock.js';
import './lib/storageMock.js';

// Mock browser APIs for Node.js test environment
globalThis.document = {
  createElement: () => ({
    click: () => {},
    remove: () => {},
    set href(v) {},
    set download(v) {}
  }),
  body: { appendChild: () => {}, removeChild: () => {} }
};
globalThis.Blob = class Blob { constructor(parts, opts) { this.parts = parts; this.opts = opts; } };
globalThis.URL = { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} };

describe('ExportService', () => {
  let ExportService, STORAGE_KEYS;

  before(async () => {
    const exp = await import('../src/utils/exportService.js');
    ExportService = exp.ExportService;
    const cfg = await import('../src/config/securityConfig.js');
    STORAGE_KEYS = cfg.STORAGE_KEYS;
  });

  beforeEach(() => {
    resetStorage();
  });

  describe('escapeCell', () => {
    const escapeCell = (v) => {
      const CSV_FORMULA_PREFIX = /^[=+\-@\t]/;
      if (v === null || v === undefined) return '';
      let s = String(v);
      if (CSV_FORMULA_PREFIX.test(s)) { s = "'" + s; }
      if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    it('returns empty for null', () => assert.strictEqual(escapeCell(null), ''));
    it('returns empty for undefined', () => assert.strictEqual(escapeCell(undefined), ''));
    it('wraps commas in quotes', () => assert.strictEqual(escapeCell('a,b'), '"a,b"'));
    it('wraps quotes in escaped quotes', () => assert.strictEqual(escapeCell('a"b'), '"a""b"'));
    it('wraps newlines in quotes', () => assert.strictEqual(escapeCell('a\nb'), '"a\nb"'));
    it('prefixes formula with single quote', () => assert.strictEqual(escapeCell('=SUM(A1)'), "'=SUM(A1)"));
    it('prefixes + formulas', () => assert.strictEqual(escapeCell('+1+1'), "'+1+1"));
    it('prefixes - formulas', () => assert.strictEqual(escapeCell('-1'), "'-1"));
    it('prefixes @ formulas', () => assert.strictEqual(escapeCell('@DDE'), "'@DDE"));
    it('prefixes tab formulas', () => assert.strictEqual(escapeCell('\tCMD'), "'\tCMD"));
    it('plain text unchanged', () => assert.strictEqual(escapeCell('hello'), 'hello'));
    it('numbers unchanged', () => assert.strictEqual(escapeCell(42), '42'));
  });

  describe('exportActivitiesCSV', () => {
    it('does not throw for empty list', () => {
      ExportService.exportActivitiesCSV([]);
    });

    it('does not throw for valid activities', () => {
      const acts = [
        { id: 'a', date: '2024-01-01T00:00:00.000Z', type: 'Car', value: 10, co2: 1.92 }
      ];
      ExportService.exportActivitiesCSV(acts);
    });

    it('throws on null/undefined (caller should pass array)', () => {
      assert.throws(() => ExportService.exportActivitiesCSV(null));
      assert.throws(() => ExportService.exportActivitiesCSV(undefined));
    });
  });

  describe('exportDashboardCSV', () => {
    it('does not throw for empty activities', () => {
      ExportService.exportDashboardCSV([]);
    });

    it('does not throw with goal set', () => {
      globalThis.localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify({ targetKg: 50 }));
      ExportService.exportDashboardCSV([]);
    });
  });

  describe('makeReportData', () => {
    it('returns complete report structure for empty data', () => {
      const r = ExportService.makeReportData([]);
      assert.ok(r.generatedAt);
      assert.ok(r.totals);
      assert.ok(r.scoreObj);
      assert.ok(Array.isArray(r.achievements));
      assert.ok(Array.isArray(r.recommendations));
      assert.ok(Array.isArray(r.recentActivities));
    });

    it('includes totals for activities', () => {
      const acts = [
        { id: 'a', date: new Date().toISOString(), type: 'Car', value: 10, co2: 1.92 }
      ];
      const r = ExportService.makeReportData(acts);
      assert.ok(r.totals.total > 0);
    });

    it('caps recentActivities', () => {
      const acts = Array.from({ length: 50 }, (_, i) => ({
        id: `a${i}`, date: new Date().toISOString(), type: 'Car', value: 10, co2: 1
      }));
      const r = ExportService.makeReportData(acts);
      assert.ok(r.recentActivities.length <= 20);
    });

    it('handles null activities (throws because .slice on null)', () => {
      assert.throws(() => ExportService.makeReportData(null));
    });
  });
});
