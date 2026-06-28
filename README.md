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
npm run db:init
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
- `db-init` одноразово создает схему БД и seed-данные перед запуском `server`

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

### Документация API

- OpenAPI JSON: `http://localhost:5001/api/schema`
- Swagger UI: `http://localhost:5001/api/docs`

Swagger UI позволяет просматривать REST endpoints, схему авторизации Bearer JWT и структуру запросов. Для защищенных маршрутов нужно получить токен через `POST /api/auth/login` и указать его в формате `Bearer <token>`.

## Тестирование

### Backend

```bash
cd server
npm test
```

Проверяются:

- валидация email, пароля, имени пользователя, названия доски и сообщений;
- доступность OpenAPI-схемы и Swagger UI;
- инициализация схемы БД и seed-пользователей;
- регистрация, вход и получение текущего профиля;
- создание доски и выдача доступа;
- запрет доступа к чужой доске;
- чат доски для участника с доступом;
- запрет пользовательского доступа к админским маршрутам;
- обновление настроек только администратором.

Если PostgreSQL недоступен, интеграционные тесты аккуратно пропускают проверки, которым нужна база данных.

### Backend coverage

```bash
cd server
npm run test:coverage
```

### Fuzzing

```bash
cd server
npm run fuzz
npm run fuzz:socket
```

`npm run fuzz` проверяет REST API, а `npm run fuzz:socket` проверяет Socket.IO handshake и realtime-события доски. Для последовательного запуска обоих сценариев используется `npm run fuzz:all`.

### Database init

```bash
cd server
npm run db:init
```

Команда создает/обновляет схему PostgreSQL и добавляет тестовых пользователей. Runtime-запуск `npm start` только поднимает API-сервер.

Команда использует встроенное покрытие Node.js test runner и выводит отчет по покрытию backend-файлов.

### Frontend

```bash
cd client
npm test -- --watchAll=false
npm run build
```

Проверяются Redux-редьюсеры, сохранение авторизованного пользователя и production-сборка React-приложения.

## Проверка realtime

1. Войти под `alice@whiteboard.local`.
2. Открыть любую доску.
3. Во втором окне войти под `bob@whiteboard.local`.
4. После выдачи доступа на доску начать рисовать в одном окне.
5. Линии должны появляться во втором окне почти сразу.

## Фаззинг

Расширенный сценарий фаззинг-тестирования API:

```bash
cd server
npm run fuzz
```

Скрипт проверяет:

- пустые, короткие и некорректные данные при регистрации
- дублирование email при регистрации
- неверные пароли и обращения к `/auth/me` без токена
- невалидные Bearer-токены
- пустые, короткие и слишком длинные названия досок
- некорректные типы данных для `description` и `email`
- слишком длинные описания досок
- доступ к чужим доскам без прав
- попытки редактирования и удаления доски чужим пользователем
- ошибки при выдаче доступа и повторной выдаче доступа
- удаление несуществующего участника
- активность `/boards/activity` под авторизованным пользователем
- рандомизированные payload-проверки для auth, boards, chat и невалидных идентификаторов
