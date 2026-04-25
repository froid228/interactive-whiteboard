const Board = require('../models/Board');
const User = require('../models/User');

function validateBoardTitle(title) {
  return typeof title === 'string' && title.trim().length >= 3 && title.trim().length <= 120;
}

function validateBoardDescription(description) {
  return description === undefined || (typeof description === 'string' && description.trim().length <= 500);
}

class BoardController {
  async create(req, res) {
    const { title, description } = req.body;

    if (!validateBoardTitle(title)) {
      return res.status(400).json({
        message: 'Название доски должно содержать от 3 до 120 символов',
      });
    }

    if (!validateBoardDescription(description)) {
      return res.status(400).json({
        message: 'Описание доски должно содержать не более 500 символов',
      });
    }

    const board = await Board.create({
      title: title.trim(),
      description: (description || '').trim(),
      ownerId: req.user.id,
    });

    await Board.createEvent({
      boardId: board.id,
      actorId: req.user.id,
      action: 'created',
      boardTitle: board.title,
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
    const { title, description } = req.body;

    if (title === undefined && description === undefined) {
      return res.status(400).json({ message: 'Нужно передать название или описание доски' });
    }

    if (title !== undefined && !validateBoardTitle(title)) {
      return res.status(400).json({
        message: 'Название доски должно содержать от 3 до 120 символов',
      });
    }

    if (!validateBoardDescription(description)) {
      return res.status(400).json({
        message: 'Описание доски должно содержать не более 500 символов',
      });
    }

    const canManage = await Board.canManage(boardId, req.user);
    if (!canManage) {
      return res.status(403).json({ message: 'Нет прав для редактирования этой доски' });
    }

    const currentBoard = await Board.findDetailedById(boardId);
    if (!currentBoard) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }

    const nextTitle = title !== undefined ? title.trim() : undefined;
    const nextDescription = description !== undefined ? description.trim() : undefined;
    const updated = await Board.update(boardId, {
      title: nextTitle,
      description: nextDescription,
    });

    const changedFields = [];
    if (nextTitle !== undefined && nextTitle !== currentBoard.title) {
      changedFields.push('title');
    }
    if (nextDescription !== undefined && nextDescription !== currentBoard.description) {
      changedFields.push('description');
    }

    if (changedFields.length > 0) {
      await Board.createEvent({
        boardId,
        actorId: req.user.id,
        action: 'updated',
        boardTitle: updated.title,
        metadata: { changedFields },
      });
    }

    return res.json(updated);
  }

  async delete(req, res) {
    const boardId = Number(req.params.id);
    const canManage = await Board.canManage(boardId, req.user);

    if (!canManage) {
      return res.status(403).json({ message: 'Нет прав для удаления этой доски' });
    }

    const board = await Board.findDetailedById(boardId);
    await Board.delete(boardId);

    await Board.createEvent({
      actorId: req.user.id,
      action: 'deleted',
      boardTitle: board?.title || `Доска #${boardId}`,
    });

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

    await Board.createEvent({
      boardId,
      actorId: req.user.id,
      action: 'shared',
      boardTitle: updated.title,
      metadata: {
        sharedWithId: collaborator.id,
        sharedWithName: collaborator.name,
        sharedWithEmail: collaborator.email,
      },
    });

    return res.json(updated);
  }

  async removeCollaborator(req, res) {
    const boardId = Number(req.params.id);
    const userId = Number(req.params.userId);

    const canManage = await Board.canManage(boardId, req.user);
    if (!canManage) {
      return res.status(403).json({ message: 'Только владелец или администратор может управлять доступом' });
    }

    const board = await Board.findDetailedById(boardId);
    if (!board) {
      return res.status(404).json({ message: 'Доска не найдена' });
    }

    const collaborator = board.collaborators.find((member) => Number(member.id) === userId);
    if (!collaborator) {
      return res.status(404).json({ message: 'Участник не найден в списке доступа' });
    }

    const updated = await Board.removeCollaborator(boardId, userId);

    await Board.createEvent({
      boardId,
      actorId: req.user.id,
      action: 'access_removed',
      boardTitle: updated.title,
      metadata: {
        removedUserId: collaborator.id,
        removedUserName: collaborator.name,
        removedUserEmail: collaborator.email,
      },
    });

    return res.json(updated);
  }

  async getActivity(req, res) {
    const activity = await Board.getRecentActivity(req.user);
    return res.json(activity);
  }
}

module.exports = new BoardController();
