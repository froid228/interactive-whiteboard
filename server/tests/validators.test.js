const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidEmail,
  validateBoardTitle,
  validateMessageText,
  validatePassword,
  validateUserName,
} = require('../src/utils/validators');

test('validates user registration fields', () => {
  assert.equal(validateUserName('Алиса'), true);
  assert.equal(validateUserName('A'), false);
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(isValidEmail('broken-email'), false);
  assert.equal(validatePassword('secret1'), true);
  assert.equal(validatePassword('123'), false);
});

test('validates board titles and chat messages', () => {
  assert.equal(validateBoardTitle('Командная доска'), true);
  assert.equal(validateBoardTitle('ab'), false);
  assert.equal(validateMessageText('Привет'), true);
  assert.equal(validateMessageText(''), false);
  assert.equal(validateMessageText('x'.repeat(1001)), false);
});
