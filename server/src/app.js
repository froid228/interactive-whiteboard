const express = require('express');
const cors = require('cors');
const { rateLimiter, securityHeaders } = require('./middleware/security');
const openapi = require('./openapi');

const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:8080'];
const allowedOrigins = [
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
  ...DEFAULT_ORIGINS,
]
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

function getSwaggerHtml() {
  return `<!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Interactive Whiteboard API</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          window.ui = SwaggerUIBundle({
            url: '/api/schema',
            dom_id: '#swagger-ui',
            deepLinking: true,
            persistAuthorization: true,
          });
        </script>
      </body>
    </html>`;
}

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
  res.type('html').send(getSwaggerHtml());
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

module.exports = {
  app,
  allowedOrigins,
  getSwaggerHtml,
};
