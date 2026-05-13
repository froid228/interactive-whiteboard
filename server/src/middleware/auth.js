const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../utils/jwtSecret');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice('Bearer '.length).trim();
}

async function authRequired(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    const user = await User.findSafeById(req.user.id);
    if (!user || user.is_active === false) {
      return res.status(403).json({ message: 'Пользователь заблокирован или удалён' });
    }
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Токен недействителен' });
  }
}

module.exports = {
  authRequired,
  getTokenFromRequest,
};
