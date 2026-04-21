const jwt = require('jsonwebtoken');
const Board = require('./models/Board');

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

      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
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
  });
}

module.exports = {
  configureSockets,
};
