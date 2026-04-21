const Board = require('../models/Board');
const User = require('../models/User');

function validateBoardTitle(title) {
  return typeof title === 'string' && title.trim().length >= 3 && title.trim().length <= 120;
}

class BoardController {
  async create(req, res) {
    const { title } = req.body;

    if (!validateBoardTitle(title)) {
      return res.status(400).json({
        message: 'Название доски должно содержать от 3 до 120 символов',
      });
    }

    const board = await Board.create({
      title: title.trim(),
      ownerId: req.user.id,
    });

    return res.status(201).json(board);
  }

  async getAll(req, res) {
    const boards = await Board.findAllForUser(req.user);
    return res.json(boards);
  }

  async getById(req, res) {
    const boardId = Number(req.params.id);
    const hasAccess = await Board.userHasAccess(boardId, req.user);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Нет доступа к этой доске' });
    }

    const board = await Board.findDetailedById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }

    return res.json(board);
  }

  async update(req, res) {
    const boardId = Number(req.params.id);
    const { title } = req.body;

    if (!validateBoardTitle(title)) {
      return res.status(400).json({
        message: 'Название доски должно содержать от 3 до 120 символов',
      });
    }

    const canManage = await Board.canManage(boardId, req.user);
    if (!canManage) {
      return res.status(403).json({ message: 'Нет прав для редактирования этой доски' });
    }

    const updated = await Board.update(boardId, { title: title.trim() });
    return res.json(updated);
  }

  async delete(req, res) {
    const boardId = Number(req.params.id);
    const canManage = await Board.canManage(boardId, req.user);

    if (!canManage) {
      return res.status(403).json({ message: 'Нет прав для удаления этой доски' });
    }

    await Board.delete(boardId);
    return res.json({ message: 'Доска удалена' });
  }

  async share(req, res) {
    const boardId = Number(req.params.id);
    const { email } = req.body;

    const canManage = await Board.canManage(boardId, req.user);
    if (!canManage) {
      return res.status(403).json({ message: 'Только владелец или администратор может выдать доступ' });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email обязателен' });
    }

    const collaborator = await User.findByEmail(email.trim().toLowerCase());
    if (!collaborator) {
      return res.status(404).json({ message: 'Пользователь с таким email не найден' });
    }

    const board = await Board.findDetailedById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }

    if (Number(board.owner_id) === Number(collaborator.id)) {
      return res.status(400).json({ message: 'Владелец уже имеет доступ к доске' });
    }

    const updated = await Board.addCollaborator(boardId, collaborator.id);
    return res.json(updated);
  }
}

module.exports = new BoardController();
