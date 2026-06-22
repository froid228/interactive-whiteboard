const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidEmail,
  parsePositiveInt,
  validateBoardSnapshot,
  validateBoardTitle,
  validateDrawSegment,
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

test('validates positive identifiers and board drawing payloads', () => {
  assert.equal(parsePositiveInt('12'), 12);
  assert.equal(parsePositiveInt('abc'), null);
  assert.equal(parsePositiveInt('0'), null);

  const line = {
    type: 'line',
    color: '#123abc',
    width: 4,
    points: [{ x: 10, y: 20 }],
  };
  const shape = {
    type: 'shape',
    shape: 'arrow',
    color: '#123abc',
    width: 4,
    start: { x: 10, y: 20 },
    end: { x: 40, y: 80 },
  };
  const text = {
    type: 'text',
    color: '#123abc',
    fontSize: 26,
    text: 'Заметка',
    x: 10,
    y: 20,
  };

  assert.equal(validateDrawSegment(line), true);
  assert.equal(validateDrawSegment(shape), true);
  assert.equal(validateDrawSegment(text), true);
  assert.equal(validateDrawSegment({ ...line, color: 'red' }), false);
  assert.equal(validateBoardSnapshot([line, shape, text]), true);
  assert.equal(validateBoardSnapshot([{ ...line, points: new Array(501).fill({ x: 1, y: 1 }) }]), false);
});
