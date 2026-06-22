const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { configureSockets } = require('./socket');
const { app, allowedOrigins } = require('./app');
const server = http.createServer(app);

const PORT = process.env.PORT || 5001;

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

configureSockets(io);

async function start() {
  try {
    server.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = {
  app,
  server,
  start,
};
