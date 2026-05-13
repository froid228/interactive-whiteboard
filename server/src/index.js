const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const { initDatabase } = require('./config/db');
const { configureSockets } = require('./socket');
const { rateLimiter, securityHeaders } = require('./middleware/security');
const openapi = require('./openapi');

const app = express();
const server = http.createServer(app);

const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:8080'];
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  ...DEFAULT_ORIGINS,
]
  .map((origin) => origin.trim())
  .filter(Boolean);
const PORT = process.env.PORT || 5001;

app.use(securityHeaders);
app.use(rateLimiter);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin is not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает' });
});

app.get('/api/schema', (req, res) => {
  res.json(openapi);
});

app.get('/api/docs', (req, res) => {
  res.type('html').send(`<!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <title>Interactive Whiteboard API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; line-height: 1.5; color: #1f2937; }
          code, pre { background: #f3f4f6; border-radius: 8px; padding: 2px 6px; }
          pre { padding: 16px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>Interactive Whiteboard API</h1>
        <p>OpenAPI-схема доступна по адресу <a href="/api/schema">/api/schema</a>.</p>
        <pre>${JSON.stringify(openapi, null, 2)}</pre>
      </body>
    </html>`);
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/boards', require('./routes/boardRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/settings', require('./routes/settingsRoutes'));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    message: error.message || 'Внутренняя ошибка сервера',
  });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

configureSockets(io);

async function start() {
  try {
    await initDatabase();
    server.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error.message);
    process.exit(1);
  }
}

start();
