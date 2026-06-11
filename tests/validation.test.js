import assert from 'assert';
import { validateEmail, validatePassword, checkPasswordStrength } from '../src/utils/validation.js';

console.log('Running validation tests...');

// validateEmail
assert.strictEqual(validateEmail(''), 'Email is required');
assert.strictEqual(validateEmail('invalid-email'), 'Please enter a valid email address');
assert.strictEqual(validateEmail('user@example.com'), '');

// validatePassword
assert.strictEqual(validatePassword(''), 'Password is required');
assert.strictEqual(validatePassword('short'), 'Password must be at least 8 characters long');
assert.strictEqual(validatePassword('longenough'), '');

// checkPasswordStrength
const weak = checkPasswordStrength('short');
assert(weak.score >= 0 && weak.label);

const strong = checkPasswordStrength('Str0ng!Pass');
assert.strictEqual(strong.label, 'Strong');

console.log('All validation tests passed.');
