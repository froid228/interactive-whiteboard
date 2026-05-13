const Board = require('../models/Board');
const Message = require('../models/Message');
const { validateMessageText } = require('../utils/validators');

class ChatController {
  async getMessages(req, res) {
    const boardId = Number(req.params.boardId);
    const hasAccess = await Board.userHasAccess(boardId, req.user);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Нет доступа к чату этой доски' });
    }

    const messages = await Message.findForBoard(boardId);
    return res.json(messages);
  }

  async createMessage(req, res) {
    const boardId = Number(req.params.boardId);
    const { text } = req.body;
    const hasAccess = await Board.userHasAccess(boardId, req.user);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Нет доступа к чату этой доски' });
    }

    if (!validateMessageText(text)) {
      return res.status(400).json({ message: 'Сообщение должно содержать от 1 до 1000 символов' });
    }

    const message = await Message.create({
      boardId,
      authorId: req.user.id,
      text: text.trim(),
    });

    return res.status(201).json(message);
  }
}

module.exports = new ChatController();
