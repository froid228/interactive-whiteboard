const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ Изменено: порт 5001 вместо 5000
const PORT = process.env.PORT || 5001;

// ✅ CORS с явным указанием origin (для надёжности)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

// Маршруты API
app.use('/api/boards', require('./routes/boardRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Сервер работает!' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер: http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
});