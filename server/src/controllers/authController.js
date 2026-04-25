const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const RIGHTS_BY_ROLE = {
  admin: ['can_view_boards', 'can_edit_boards', 'can_manage_boards', 'can_manage_users'],
  user: ['can_view_boards', 'can_edit_boards'],
};

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '12h' }
  );
}

function toAuthPayload(user) {
  return {
    token: signToken(user),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      roles: [user.role],
      rights: RIGHTS_BY_ROLE[user.role] || RIGHTS_BY_ROLE.user,
    },
  };
}

class AuthController {
  async register(req, res) {
    const { name, email, password } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      name.trim().length > 120
    ) {
      return res.status(400).json({ message: 'Имя должно содержать от 2 до 120 символов' });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ message: 'Некорректный email' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
      role: 'user',
    });

    return res.status(201).json(toAuthPayload(user));
  }

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    return res.json(toAuthPayload(user));
  }

  async me(req, res) {
    const user = await User.findSafeById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json({
      ...user,
      roles: [user.role],
      rights: RIGHTS_BY_ROLE[user.role] || RIGHTS_BY_ROLE.user,
    });
  }
}

module.exports = new AuthController();
