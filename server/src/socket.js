const jwt = require('jsonwebtoken');
const Board = require('./models/Board');
const Message = require('./models/Message');
const { validateMessageText } = require('./utils/validators');
const { getJwtSecret } = require('./utils/jwtSecret');

function roomName(boardId) {
  return `board:${boardId}`;
}

function configureSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('UNAUTHORIZED'));
      }

      const payload = jwt.verify(token, getJwtSecret());
      socket.user = payload;
      return next();
    } catch (error) {
      return next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-board', async ({ boardId }, callback = () => {}) => {
      try {
        const numericBoardId = Number(boardId);
        const hasAccess = await Board.userHasAccess(numericBoardId, socket.user);

        if (!hasAccess) {
          callback({ ok: false, message: 'Нет доступа к доске' });
          return;
        }

        socket.join(roomName(numericBoardId));
        const board = await Board.findDetailedById(numericBoardId);
        callback({ ok: true, snapshot: board?.snapshot || [] });
      } catch (error) {
        callback({ ok: false, message: 'Не удалось подключиться к доске' });
      }
    });

    socket.on('draw-segment', async ({ boardId, segment }) => {
      const numericBoardId = Number(boardId);
      if (!(await Board.userHasAccess(numericBoardId, socket.user))) {
        return;
      }

      socket.to(roomName(numericBoardId)).emit('draw-segment', { segment });
    });

    socket.on('board-snapshot', async ({ boardId, snapshot }) => {
      const numericBoardId = Number(boardId);
      if (!(await Board.userHasAccess(numericBoardId, socket.user))) {
        return;
      }

      await Board.updateSnapshot(numericBoardId, Array.isArray(snapshot) ? snapshot : []);
      socket.to(roomName(numericBoardId)).emit('board-snapshot', {
        snapshot: Array.isArray(snapshot) ? snapshot : [],
      });
    });

    socket.on('clear-board', async ({ boardId }) => {
      const numericBoardId = Number(boardId);
      if (!(await Board.userHasAccess(numericBoardId, socket.user))) {
        return;
      }

      await Board.updateSnapshot(numericBoardId, []);
      io.to(roomName(numericBoardId)).emit('clear-board');
    });

    socket.on('send-message', async ({ boardId, text }, callback = () => {}) => {
      try {
        const numericBoardId = Number(boardId);
        if (!(await Board.userHasAccess(numericBoardId, socket.user))) {
          callback({ ok: false, message: 'Нет доступа к чату этой доски' });
          return;
        }

        if (!validateMessageText(text)) {
          callback({ ok: false, message: 'Сообщение должно содержать от 1 до 1000 символов' });
          return;
        }

        const message = await Message.create({
          boardId: numericBoardId,
          authorId: socket.user.id,
          text: text.trim(),
        });

        io.to(roomName(numericBoardId)).emit('message-created', { message });
        callback({ ok: true, message });
      } catch (error) {
        callback({ ok: false, message: 'Не удалось отправить сообщение' });
      }
    });
  });
}

module.exports = {
  configureSockets,
};
