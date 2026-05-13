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

module.exports = {
  isValidEmail,
  validateUserName,
  validatePassword,
  validateBoardTitle,
  validateBoardDescription,
  validateMessageText,
};
