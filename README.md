# Interactive Whiteboard

Курсовой проект по теме «Интерактивная доска для совместной работы в реальном времени».

## Что реализовано

- клиент-серверное приложение на React + Node.js + PostgreSQL
- JWT-аутентификация и серверная проверка ролей
- CRUD для досок
- разграничение доступа: владелец, участник, администратор
- совместное рисование в реальном времени через Socket.IO
- тестовые данные и автоматическая инициализация схемы БД
- Docker-конфигурация для запуска полного стенда
- базовый fuzzing API

## Стек

- Frontend: React, Redux, React Router
- Backend: Node.js, Express, Socket.IO
- Database: PostgreSQL
- Auth: JWT, bcrypt
- Infra: Docker, Docker Compose

## Структура проекта

```text
client/
  public/
  src/
    api/
    components/
    pages/
    redux/
server/
  scripts/
  src/
    config/
    controllers/
    middleware/
    models/
    routes/
    socket.js
docker-compose.yml
README.md
```

## Тестовые пользователи

- `admin@whiteboard.local / Admin123!`
- `alice@whiteboard.local / User123!`
- `bob@whiteboard.local / User123!`

Пользователи создаются автоматически при старте backend, если таблица `users` пуста.

## Локальный запуск

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
npm start
```

По умолчанию:

- frontend: `http://localhost:3000`
- backend: `http://localhost:5001`

## Запуск через Docker

```bash
docker compose up --build
```

Сервисы:

- `client` на `http://localhost:3000`
- `server` на `http://localhost:5001`
- `postgres` на `localhost:5432`

## Переменные окружения

### `server/.env`

```env
PORT=5001
CLIENT_ORIGIN=http://localhost:3000
DB_HOST=postgres
DB_PORT=5432
DB_NAME=whiteboard
DB_USER=whiteboard
DB_PASSWORD=whiteboard
JWT_SECRET=super-secret-key
NODE_ENV=development
```

### `client/.env`

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_SOCKET_URL=http://localhost:5001
```

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Boards

- `GET /api/boards`
- `POST /api/boards`
- `GET /api/boards/:id`
- `PUT /api/boards/:id`
- `DELETE /api/boards/:id`
- `POST /api/boards/:id/share`

## Проверка realtime

1. Войти под `alice@whiteboard.local`.
2. Открыть любую доску.
3. Во втором окне войти под `bob@whiteboard.local`.
4. После выдачи доступа на доску начать рисовать в одном окне.
5. Линии должны появляться во втором окне почти сразу.

## Фаззинг

Базовый сценарий фаззинга:

```bash
cd server
npm run fuzz
```

Скрипт проверяет:

- пустые и некорректные данные при регистрации
- неверный пароль при логине
- обращение к API без токена
- некорректные токены и JSON-поля

## Что ещё можно развивать

- чат доски с серверным хранением сообщений
- инструменты рисования: цвета, толщины, фигуры
- UML-диаграммы и отчёт по тестированию для защиты
