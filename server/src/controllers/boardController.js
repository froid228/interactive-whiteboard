const Board = require('../models/Board');

class BoardController {
  async create(req, res) {
    try {
      console.log('📥 POST /api/boards');
      console.log('👤 req.user:', req.user);
      console.log('📝 req.body:', req.body);
      
      const { title } = req.body;
      
      // Преобразуем ID в число для PostgreSQL INTEGER
      const userId = parseInt(req.user?.id) || 1;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Название обязательно' });
      }
      
      const board = await Board.create(title.trim(), userId);
      console.log('✅ Доска создана:', board);
      res.status(201).json(board);
    } catch (err) {
      console.error('❌ Ошибка в create:', err);
      res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
  }

  async getAll(req, res) {
    try {
      const boards = await Board.findAll();
      res.json(boards);
    } catch (err) {
      console.error('Ошибка в getAll:', err);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }

  async getById(req, res) {
    try {
      const board = await Board.findById(req.params.id);
      if (!board) {
        return res.status(404).json({ message: 'Доска не найдена' });
      }
      res.json(board);
    } catch (err) {
      console.error('Ошибка в getById:', err);
      res.status(500).json({ message: 'Ошибка сервера' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { title } = req.body;
      const { role, id: userId } = req.user;
      
      // Преобразуем ID в число
      const numericUserId = parseInt(userId) || 1;
      
      if (!title || !title.trim()) {
        return res.status(400).json({ message: 'Название обязательно' });
      }
      
      // Практика 8: Если не админ - проверяем владельца
      if (role !== 'admin') {
        const board = await Board.findById(id);
        if (!board || parseInt(board.owner_id) !== numericUserId) {
          return res.status(403).json({ 
            message: 'Нет прав для редактирования этой доски' 
          });
        }
      }
      
      const updated = await Board.update(id, title.trim());
      res.json(updated);
    } catch (err) {
      console.error('Ошибка в update:', err);
      res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const { role, id: userId } = req.user;
      
      // Преобразуем ID в число
      const numericUserId = parseInt(userId) || 1;
      
      // Практика 8: Если не админ - проверяем владельца
      if (role !== 'admin') {
        const board = await Board.findById(id);
        if (!board || parseInt(board.owner_id) !== numericUserId) {
          return res.status(403).json({ 
            message: 'Нет прав для удаления этой доски' 
          });
        }
      }
      
      await Board.delete(id);
      res.json({ message: 'Удалено' });
    } catch (err) {
      console.error('Ошибка в delete:', err);
      res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
  }
}

module.exports = new BoardController();