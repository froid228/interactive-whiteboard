const User = require('../models/User');

class AdminController {
  async getUsers(req, res) {
    const users = await User.findAllSafe();
    return res.json(users);
  }

  async updateUser(req, res) {
    const userId = Number(req.params.id);
    const { role, isActive } = req.body;

    if (role !== undefined && !['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль пользователя' });
    }

    if (Number(req.user.id) === userId && role && role !== 'admin') {
      return res.status(400).json({ message: 'Нельзя снять роль администратора с текущего пользователя' });
    }

    if (Number(req.user.id) === userId && isActive === false) {
      return res.status(400).json({ message: 'Нельзя заблокировать текущего пользователя' });
    }

    const updatedUser = await User.update(userId, { role, isActive });
    if (!updatedUser) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json(updatedUser);
  }

  async deleteUser(req, res) {
    const userId = Number(req.params.id);

    if (Number(req.user.id) === userId) {
      return res.status(400).json({ message: 'Нельзя удалить текущего пользователя' });
    }

    const deleted = await User.delete(userId);
    if (!deleted) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    return res.json({ message: 'Пользователь удалён' });
  }
}

module.exports = new AdminController();
