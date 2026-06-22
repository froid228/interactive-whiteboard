function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validateUserName(name) {
  return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 120;
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6 && password.length <= 160;
}

function validateBoardTitle(title) {
  return typeof title === 'string' && title.trim().length >= 3 && title.trim().length <= 120;
}

function validateBoardDescription(description) {
  return description === undefined || (typeof description === 'string' && description.trim().length <= 500);
}

function validateMessageText(text) {
  return typeof text === 'string' && text.trim().length > 0 && text.trim().length <= 1000;
}

function parsePositiveInt(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function validatePoint(point) {
  return (
    point &&
    typeof point === 'object' &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= -10000 &&
    point.x <= 10000 &&
    point.y >= -10000 &&
    point.y <= 10000
  );
}

function isValidColor(color) {
  return typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color);
}

function isValidStrokeWidth(width) {
  return Number.isFinite(width) && width >= 1 && width <= 80;
}

function validateLineSegment(segment) {
  return (
    segment.type === 'line' &&
    isValidColor(segment.color) &&
    isValidStrokeWidth(segment.width) &&
    Array.isArray(segment.points) &&
    segment.points.length >= 1 &&
    segment.points.length <= 500 &&
    segment.points.every(validatePoint)
  );
}

function validateShapeSegment(segment) {
  return (
    segment.type === 'shape' &&
    ['rectangle', 'circle', 'line', 'arrow'].includes(segment.shape) &&
    isValidColor(segment.color) &&
    isValidStrokeWidth(segment.width) &&
    validatePoint(segment.start) &&
    validatePoint(segment.end)
  );
}

function validateTextSegment(segment) {
  return (
    segment.type === 'text' &&
    typeof segment.text === 'string' &&
    segment.text.trim().length > 0 &&
    segment.text.trim().length <= 500 &&
    Number.isFinite(segment.x) &&
    Number.isFinite(segment.y) &&
    segment.x >= -10000 &&
    segment.x <= 10000 &&
    segment.y >= -10000 &&
    segment.y <= 10000 &&
    isValidColor(segment.color) &&
    Number.isFinite(segment.fontSize) &&
    segment.fontSize >= 8 &&
    segment.fontSize <= 96
  );
}

function validateDrawSegment(segment) {
  if (!segment || typeof segment !== 'object' || Array.isArray(segment)) {
    return false;
  }

  return (
    validateLineSegment(segment) ||
    validateShapeSegment(segment) ||
    validateTextSegment(segment)
  );
}

function validateBoardSnapshot(snapshot) {
  return (
    Array.isArray(snapshot) &&
    snapshot.length <= 2000 &&
    snapshot.every(validateDrawSegment)
  );
}

module.exports = {
  isValidEmail,
  parsePositiveInt,
  validateUserName,
  validatePassword,
  validateBoardTitle,
  validateBoardDescription,
  validateBoardSnapshot,
  validateDrawSegment,
  validateMessageText,
};
