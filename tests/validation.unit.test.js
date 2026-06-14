import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import './lib/storageMock.js';

import {
  sanitizeString, sanitizeNumber, normalizeName,
  validateEmail, validatePassword, checkPasswordStrength,
  validActivityType, activity, goal, settings, achievements, auth,
  LIMITS, ALLOWED
} from '../src/domain/validation.js';

describe('sanitizeString', () => {
  it('returns empty string for null', () => {
    assert.strictEqual(sanitizeString(null), '');
  });
  it('returns empty string for undefined', () => {
    assert.strictEqual(sanitizeString(undefined), '');
  });
  it('trims whitespace', () => {
    assert.strictEqual(sanitizeString('  hello  '), 'hello');
  });
  it('collapses multiple spaces', () => {
    assert.strictEqual(sanitizeString('a   b'), 'a b');
  });
  it('strips control characters below 32', () => {
    assert.strictEqual(sanitizeString('ab\x00c\x01d'), 'abcd');
  });
  it('strips DEL character (127)', () => {
    assert.strictEqual(sanitizeString('ab\x7Fcd'), 'abcd');
  });
  it('preserves normal characters', () => {
    assert.strictEqual(sanitizeString('Hello, World! 123'), 'Hello, World! 123');
  });
  it('truncates to maxLength', () => {
    const long = 'a'.repeat(2000);
    assert.strictEqual(sanitizeString(long, 10).length, 10);
  });
  it('returns empty string for non-string input that throws', () => {
    const circular = { toString: null };
    assert.strictEqual(sanitizeString(circular), '');
  });
  it('handles numbers', () => {
    assert.strictEqual(sanitizeString(42), '42');
  });
  it('handles objects with toString', () => {
    assert.strictEqual(sanitizeString({ toString: () => 'obj' }), 'obj');
  });
});

describe('sanitizeNumber', () => {
  it('returns number for valid input', () => {
    assert.strictEqual(sanitizeNumber('42'), 42);
  });
  it('returns fallback for NaN', () => {
    assert.strictEqual(sanitizeNumber('abc', 0), 0);
  });
  it('returns fallback for Infinity', () => {
    assert.strictEqual(sanitizeNumber(Infinity, -1), -1);
  });
  it('returns fallback for -Infinity', () => {
    assert.strictEqual(sanitizeNumber(-Infinity, 0), 0);
  });
  it('returns 0 for null (Number(null) === 0)', () => {
    assert.strictEqual(sanitizeNumber(null, 5), 0);
  });
  it('handles undefined with fallback', () => {
    assert.strictEqual(sanitizeNumber(undefined, 0), 0);
  });
  it('preserves zero', () => {
    assert.strictEqual(sanitizeNumber(0, 10), 0);
  });
  it('preserves negative numbers', () => {
    assert.strictEqual(sanitizeNumber(-5), -5);
  });
  it('default fallback is 0', () => {
    assert.strictEqual(sanitizeNumber(NaN), 0);
  });
});

describe('normalizeName', () => {
  it('capitalizes each word', () => {
    assert.strictEqual(normalizeName('john doe'), 'John Doe');
  });
  it('collapses extra spaces', () => {
    assert.strictEqual(normalizeName('  alice   bob  '), 'Alice Bob');
  });
  it('handles empty string', () => {
    assert.strictEqual(normalizeName(''), '');
  });
  it('handles null', () => {
    assert.strictEqual(normalizeName(null), '');
  });
  it('handles single word', () => {
    assert.strictEqual(normalizeName('john'), 'John');
  });
});

describe('validateEmail', () => {
  it('returns empty for valid email', () => {
    assert.strictEqual(validateEmail('test@example.com'), '');
  });
  it('rejects missing email', () => {
    assert.strictEqual(validateEmail(''), 'Email is required');
  });
  it('rejects null', () => {
    assert.strictEqual(validateEmail(null), 'Email is required');
  });
  it('rejects email without @', () => {
    assert.strictEqual(validateEmail('testexample.com'), 'Please enter a valid email address');
  });
  it('rejects email without domain', () => {
    assert.strictEqual(validateEmail('test@'), 'Please enter a valid email address');
  });
  it('rejects email without TLD', () => {
    assert.strictEqual(validateEmail('test@example'), 'Please enter a valid email address');
  });
  it('rejects email with spaces', () => {
    assert.ok(validateEmail('test @example.com').length > 0);
  });
  it('rejects excessively long email', () => {
    const long = 'a'.repeat(300) + '@b.com';
    assert.ok(validateEmail(long).includes('Must be at most'));
  });
});

describe('validatePassword', () => {
  it('returns empty for valid password', () => {
    assert.strictEqual(validatePassword('12345678'), '');
  });
  it('rejects null', () => {
    assert.strictEqual(validatePassword(null), 'Password is required');
  });
  it('rejects empty string', () => {
    assert.strictEqual(validatePassword(''), 'Password is required');
  });
  it('rejects too short', () => {
    assert.strictEqual(validatePassword('1234567'), 'Password must be at least 8 characters long');
  });
  it('exactly 8 chars is valid', () => {
    assert.strictEqual(validatePassword('12345678'), '');
  });
});

describe('checkPasswordStrength', () => {
  it('returns 0 for null', () => {
    const r = checkPasswordStrength(null);
    assert.strictEqual(r.score, 0);
    assert.strictEqual(r.label, 'Weak');
  });
  it('returns 0 for empty', () => {
    const r = checkPasswordStrength('');
    assert.strictEqual(r.score, 0);
  });
  it('scores 1 for length only', () => {
    const r = checkPasswordStrength('abcdefgh');
    assert.strictEqual(r.score, 1);
  });
  it('scores 2 for length + mixed case', () => {
    const r = checkPasswordStrength('Abcdefgh');
    assert.strictEqual(r.score, 2);
  });
  it('scores 3 for length + mixed case + digit', () => {
    const r = checkPasswordStrength('Abcdefg1');
    assert.strictEqual(r.score, 3);
  });
  it('scores 4 for all criteria', () => {
    const r = checkPasswordStrength('Abcdefg1!');
    assert.strictEqual(r.score, 4);
    assert.strictEqual(r.label, 'Strong');
  });
});

describe('validActivityType', () => {
  it('returns true for valid types', () => {
    for (const t of ALLOWED.ACTIVITY_TYPES) {
      assert.ok(validActivityType(t), `${t} should be valid`);
    }
  });
  it('returns false for invalid types', () => {
    assert.ok(!validActivityType('Plane'));
    assert.ok(!validActivityType(''));
    assert.ok(!validActivityType(null));
    assert.ok(!validActivityType(undefined));
    assert.ok(!validActivityType(123));
  });
});

describe('activity.isValidType', () => {
  it('delegates to validActivityType', () => {
    assert.ok(activity.isValidType('Car'));
    assert.ok(!activity.isValidType('Plane'));
  });
});

describe('activity.isValidValue', () => {
  it('returns true for positive numbers within limit', () => {
    assert.ok(activity.isValidValue(1));
    assert.ok(activity.isValidValue(100));
    assert.ok(activity.isValidValue(LIMITS.ACTIVITY_VALUE_MAX));
  });
  it('returns false for zero', () => {
    assert.ok(!activity.isValidValue(0));
  });
  it('returns false for negative', () => {
    assert.ok(!activity.isValidValue(-1));
  });
  it('returns false for NaN', () => {
    assert.ok(!activity.isValidValue(NaN));
  });
  it('returns false for Infinity', () => {
    assert.ok(!activity.isValidValue(Infinity));
  });
  it('returns false for null', () => {
    assert.ok(!activity.isValidValue(null));
  });
  it('returns false for undefined', () => {
    assert.ok(!activity.isValidValue(undefined));
  });
  it('returns false for value exceeding max', () => {
    assert.ok(!activity.isValidValue(LIMITS.ACTIVITY_VALUE_MAX + 1));
  });
});

describe('activity.isValidRecord', () => {
  it('returns true for well-formed record', () => {
    const r = { id: 'x', date: '2024-01-01', type: 'Car', value: 10, co2: 1.92 };
    assert.ok(activity.isValidRecord(r));
  });
  it('rejects null', () => { assert.ok(!activity.isValidRecord(null)); });
  it('rejects undefined', () => { assert.ok(!activity.isValidRecord(undefined)); });
  it('rejects non-object', () => { assert.ok(!activity.isValidRecord('string')); });
  it('rejects empty object', () => { assert.ok(!activity.isValidRecord({})); });
  it('rejects missing id', () => {
    assert.ok(!activity.isValidRecord({ date: 'x', type: 'Car', value: 10, co2: 1 }));
  });
  it('rejects non-string id', () => {
    assert.ok(!activity.isValidRecord({ id: 123, date: 'x', type: 'Car', value: 10, co2: 1 }));
  });
  it('rejects missing date', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', type: 'Car', value: 10, co2: 1 }));
  });
  it('rejects non-string date', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 123, type: 'Car', value: 10, co2: 1 }));
  });
  it('rejects missing type', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', value: 10, co2: 1 }));
  });
  it('rejects non-string type', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: null, value: 10, co2: 1 }));
  });
  it('rejects missing value', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: 'Car', co2: 1 }));
  });
  it('rejects non-number value', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: 'Car', value: 'abc', co2: 1 }));
  });
  it('rejects missing co2', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: 'Car', value: 10 }));
  });
  it('rejects non-number co2', () => {
    assert.ok(!activity.isValidRecord({ id: 'x', date: 'x', type: 'Car', value: 10, co2: 'abc' }));
  });
  it('allows zero co2', () => {
    assert.ok(activity.isValidRecord({ id: 'x', date: 'x', type: 'Car', value: 10, co2: 0 }));
  });
});

describe('activity.isValidList', () => {
  it('returns true for empty array', () => {
    assert.ok(activity.isValidList([]));
  });
  it('returns true for all valid records', () => {
    const list = [
      { id: 'a', date: 'x', type: 'Bus', value: 5, co2: 0.5 },
      { id: 'b', date: 'x', type: 'Train', value: 10, co2: 0.4 }
    ];
    assert.ok(activity.isValidList(list));
  });
  it('rejects array with invalid element', () => {
    assert.ok(!activity.isValidList([null]));
  });
  it('rejects non-array', () => {
    assert.ok(!activity.isValidList('not array'));
  });
  it('rejects null', () => {
    assert.ok(!activity.isValidList(null));
  });
  it('rejects undefined', () => {
    assert.ok(!activity.isValidList(undefined));
  });
});

describe('goal.isValidTarget', () => {
  it('returns true for valid target', () => {
    assert.ok(goal.isValidTarget(50));
  });
  it('returns false for zero', () => { assert.ok(!goal.isValidTarget(0)); });
  it('returns false for negative', () => { assert.ok(!goal.isValidTarget(-10)); });
  it('returns false for NaN', () => { assert.ok(!goal.isValidTarget(NaN)); });
  it('returns false for exceeding max', () => {
    assert.ok(!goal.isValidTarget(LIMITS.GOAL_TARGET_MAX + 1));
  });
});

describe('settings.isValid', () => {
  it('returns valid object for correct settings', () => {
    const s = { units: 'metric', defaultView: 'overview', analyticsRange: 'monthly', notificationsEnabled: true, theme: 'system', saveMode: 'auto' };
    const r = settings.isValid(s);
    assert.notEqual(r, null);
    assert.deepEqual(r, s);
  });
  it('returns null for null', () => { assert.strictEqual(settings.isValid(null), null); });
  it('returns null for non-object', () => { assert.strictEqual(settings.isValid('x'), null); });
  it('returns null for missing key', () => {
    assert.strictEqual(settings.isValid({ units: 'metric', defaultView: 'overview', analyticsRange: 'monthly', notificationsEnabled: true, theme: 'system' }), null);
  });
  it('returns null for invalid unit', () => {
    assert.strictEqual(settings.isValid({ units: 'km', defaultView: 'overview', analyticsRange: 'monthly', notificationsEnabled: true, theme: 'system', saveMode: 'auto' }), null);
  });
  it('returns null for invalid view', () => {
    assert.strictEqual(settings.isValid({ units: 'metric', defaultView: 'xyz', analyticsRange: 'monthly', notificationsEnabled: true, theme: 'system', saveMode: 'auto' }), null);
  });
  it('returns null for non-boolean notificationsEnabled', () => {
    assert.strictEqual(settings.isValid({ units: 'metric', defaultView: 'overview', analyticsRange: 'monthly', notificationsEnabled: 'yes', theme: 'system', saveMode: 'auto' }), null);
  });
  it('returns null for invalid theme', () => {
    assert.strictEqual(settings.isValid({ units: 'metric', defaultView: 'overview', analyticsRange: 'monthly', notificationsEnabled: true, theme: 'pink', saveMode: 'auto' }), null);
  });
  it('returns null for invalid saveMode', () => {
    assert.strictEqual(settings.isValid({ units: 'metric', defaultView: 'overview', analyticsRange: 'monthly', notificationsEnabled: true, theme: 'system', saveMode: 'never' }), null);
  });
});

describe('achievements.isValidSavedEntry', () => {
  it('accepts null', () => { assert.ok(achievements.isValidSavedEntry(null)); });
  it('accepts string', () => { assert.ok(achievements.isValidSavedEntry('2024-01-01')); });
  it('rejects number', () => { assert.ok(!achievements.isValidSavedEntry(42)); });
  it('rejects object', () => { assert.ok(!achievements.isValidSavedEntry({})); });
  it('rejects boolean', () => { assert.ok(!achievements.isValidSavedEntry(true)); });
});

describe('achievements.isValidSavedMap', () => {
  it('accepts empty object', () => { assert.ok(achievements.isValidSavedMap({})); });
  it('accepts valid map', () => { assert.ok(achievements.isValidSavedMap({ a: 'date', b: null })); });
  it('rejects null', () => { assert.ok(!achievements.isValidSavedMap(null)); });
  it('rejects array', () => { assert.ok(!achievements.isValidSavedMap([])); });
  it('rejects with invalid entry', () => {
    assert.ok(!achievements.isValidSavedMap({ a: 123 }));
  });
});

describe('auth.validateForm', () => {
  it('returns no errors for valid data', () => {
    const r = auth.validateForm({ name: 'John Doe', email: 'john@test.com', password: 'Abcdefg1!' });
    assert.ok(!r.hasError);
    assert.strictEqual(r.name, 'John Doe');
    assert.strictEqual(r.email, 'john@test.com');
  });
  it('rejects missing name', () => {
    const r = auth.validateForm({ name: '', email: 'john@test.com', password: 'Abcdefg1!' });
    assert.ok(r.hasError);
    assert.ok(r.errors.name.length > 0);
  });
  it('rejects invalid email', () => {
    const r = auth.validateForm({ name: 'John', email: 'bad', password: 'Abcdefg1!' });
    assert.ok(r.hasError);
    assert.ok(r.errors.email.length > 0);
  });
  it('rejects weak password', () => {
    const r = auth.validateForm({ name: 'John', email: 'john@test.com', password: '12345678' });
    assert.ok(r.hasError);
    assert.strictEqual(r.errors.password, 'Password must meet all complexity requirements');
  });
  it('normalizes name', () => {
    const r = auth.validateForm({ name: '  john   doe  ', email: 'john@test.com', password: 'Abcdefg1!' });
    assert.strictEqual(r.name, 'John Doe');
  });
});
