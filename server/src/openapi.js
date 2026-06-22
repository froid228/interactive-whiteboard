const errorJson = (description, example = description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { message: example },
    },
  },
});

const okJson = (description, schema) => ({
  description,
  content: {
    'application/json': {
      schema,
    },
  },
});

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Interactive Whiteboard API',
    version: '1.0.0',
    description: 'REST API для интерактивной доски, доступа, чата, настроек и администрирования.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    parameters: {
      BoardId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 },
        description: 'Положительный идентификатор доски',
      },
      BoardIdForChat: {
        name: 'boardId',
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 },
        description: 'Положительный идентификатор доски',
      },
      UserId: {
        name: 'userId',
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 },
        description: 'Положительный идентификатор пользователя',
      },
      AdminUserId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'integer', minimum: 1 },
        description: 'Положительный идентификатор пользователя',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: 'Некорректный идентификатор доски' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Алиса' },
          email: { type: 'string', format: 'email', example: 'alice@whiteboard.local' },
          role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
          is_active: { type: 'boolean', example: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthPayload: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      AuthCredentials: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'alice@whiteboard.local' },
          password: { type: 'string', example: 'User123!' },
        },
      },
      RegisterPayload: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 120, example: 'Алексей' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 6, maxLength: 160, example: 'User123!' },
        },
      },
      BoardPayload: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 3, maxLength: 120, example: 'Командная доска' },
          description: { type: 'string', maxLength: 500, example: 'Описание сценария совместной работы' },
        },
      },
      Board: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 10 },
          title: { type: 'string', example: 'Командная доска' },
          description: { type: 'string', example: 'Описание сценария совместной работы' },
          owner_id: { type: 'integer', example: 2 },
          snapshot: { type: 'array', items: { type: 'object' } },
          owner_name: { type: 'string', example: 'Алиса' },
          collaborators: {
            type: 'array',
            items: { $ref: '#/components/schemas/User' },
          },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      SharePayload: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'bob@whiteboard.local' },
        },
      },
      MessagePayload: {
        type: 'object',
        required: ['text'],
        properties: {
          text: { type: 'string', minLength: 1, maxLength: 1000, example: 'Привет в чате доски' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 7 },
          board_id: { type: 'integer', example: 10 },
          author_id: { type: 'integer', example: 2 },
          author_name: { type: 'string', example: 'Алиса' },
          text: { type: 'string', example: 'Привет в чате доски' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      BoardEvent: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 12 },
          board_id: { type: 'integer', nullable: true, example: 10 },
          action: { type: 'string', example: 'shared' },
          board_title: { type: 'string', example: 'Командная доска' },
          metadata: { type: 'object' },
          actor_id: { type: 'integer', example: 2 },
          actor_name: { type: 'string', example: 'Алиса' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Settings: {
        type: 'object',
        additionalProperties: true,
        example: { allowGuestRegistration: true, autosaveIntervalSec: 10 },
      },
      UpdateUserPayload: {
        type: 'object',
        properties: {
          role: { type: 'string', enum: ['admin', 'user'], example: 'user' },
          isActive: { type: 'boolean', example: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Проверка состояния сервера',
        security: [],
        responses: {
          200: okJson('OK', { type: 'object' }),
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Регистрация пользователя',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterPayload' } } },
        },
        responses: {
          201: okJson('Пользователь создан', { $ref: '#/components/schemas/AuthPayload' }),
          400: errorJson('Ошибка валидации', 'Некорректный email'),
          403: errorJson('Регистрация закрыта', 'Регистрация временно закрыта администратором'),
          409: errorJson('Email уже занят', 'Пользователь с таким email уже существует'),
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Авторизация пользователя',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthCredentials' } } },
        },
        responses: {
          200: okJson('JWT и профиль', { $ref: '#/components/schemas/AuthPayload' }),
          400: errorJson('Не передан email или пароль', 'Email и пароль обязательны'),
          401: errorJson('Неверные учетные данные', 'Неверный email или пароль'),
          403: errorJson('Пользователь заблокирован', 'Пользователь заблокирован администратором'),
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Текущий пользователь',
        responses: {
          200: okJson('Профиль', { $ref: '#/components/schemas/User' }),
          401: errorJson('Нет токена или токен недействителен', 'Требуется авторизация'),
          403: errorJson('Пользователь заблокирован или удален'),
          404: errorJson('Пользователь не найден'),
        },
      },
    },
    '/boards': {
      get: {
        summary: 'Список доступных досок',
        responses: {
          200: okJson('Доски', { type: 'array', items: { $ref: '#/components/schemas/Board' } }),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
        },
      },
      post: {
        summary: 'Создание доски',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BoardPayload' } } },
        },
        responses: {
          201: okJson('Доска создана', { $ref: '#/components/schemas/Board' }),
          400: errorJson('Ошибка валидации', 'Название доски должно содержать от 3 до 120 символов'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
        },
      },
    },
    '/boards/activity': {
      get: {
        summary: 'Журнал событий по доступным доскам',
        responses: {
          200: okJson('События досок', { type: 'array', items: { $ref: '#/components/schemas/BoardEvent' } }),
          401: errorJson('Нет токена или токен недействителен'),
        },
      },
      delete: {
        summary: 'Очистка уведомлений администратором',
        responses: {
          200: okJson('Уведомления очищены', { type: 'object' }),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
        },
      },
    },
    '/boards/{id}': {
      parameters: [{ $ref: '#/components/parameters/BoardId' }],
      get: {
        summary: 'Детали доски',
        responses: {
          200: okJson('Доска', { $ref: '#/components/schemas/Board' }),
          400: errorJson('Некорректный id'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Нет доступа к доске'),
          404: errorJson('Доска не найдена'),
        },
      },
      put: {
        summary: 'Обновление доски владельцем или администратором',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BoardPayload' } } },
        },
        responses: {
          200: okJson('Доска обновлена', { $ref: '#/components/schemas/Board' }),
          400: errorJson('Некорректный id или payload'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Нет прав для редактирования'),
          404: errorJson('Доска не найдена'),
        },
      },
      delete: {
        summary: 'Удаление доски владельцем или администратором',
        responses: {
          200: okJson('Доска удалена', { type: 'object' }),
          400: errorJson('Некорректный id'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Нет прав для удаления'),
          404: errorJson('Доска не найдена'),
        },
      },
    },
    '/boards/{id}/share': {
      parameters: [{ $ref: '#/components/parameters/BoardId' }],
      post: {
        summary: 'Выдача доступа к доске',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SharePayload' } } },
        },
        responses: {
          200: okJson('Доступ обновлен', { $ref: '#/components/schemas/Board' }),
          400: errorJson('Некорректный id или email'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
          404: errorJson('Пользователь или доска не найдены'),
        },
      },
    },
    '/boards/{id}/share/{userId}': {
      parameters: [
        { $ref: '#/components/parameters/BoardId' },
        { $ref: '#/components/parameters/UserId' },
      ],
      delete: {
        summary: 'Отзыв доступа к доске',
        responses: {
          200: okJson('Доступ отозван', { $ref: '#/components/schemas/Board' }),
          400: errorJson('Некорректный id'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
          404: errorJson('Доска или участник не найдены'),
        },
      },
    },
    '/chat/{boardId}/messages': {
      parameters: [{ $ref: '#/components/parameters/BoardIdForChat' }],
      get: {
        summary: 'Сообщения доски',
        responses: {
          200: okJson('Список сообщений', { type: 'array', items: { $ref: '#/components/schemas/Message' } }),
          400: errorJson('Некорректный id'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Нет доступа к доске'),
        },
      },
      post: {
        summary: 'Отправка сообщения',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MessagePayload' } } },
        },
        responses: {
          201: okJson('Сообщение создано', { $ref: '#/components/schemas/Message' }),
          400: errorJson('Некорректный id или текст сообщения'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Нет доступа к доске'),
        },
      },
    },
    '/settings': {
      get: {
        summary: 'Системные настройки',
        responses: {
          200: okJson('Настройки', { $ref: '#/components/schemas/Settings' }),
          401: errorJson('Нет токена или токен недействителен'),
        },
      },
      put: {
        summary: 'Обновление системных настроек администратором',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Settings' } } },
        },
        responses: {
          200: okJson('Настройки обновлены', { $ref: '#/components/schemas/Settings' }),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
        },
      },
    },
    '/admin/users': {
      get: {
        summary: 'Список пользователей для администратора',
        responses: {
          200: okJson('Пользователи', { type: 'array', items: { $ref: '#/components/schemas/User' } }),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
        },
      },
    },
    '/admin/users/{id}': {
      parameters: [{ $ref: '#/components/parameters/AdminUserId' }],
      patch: {
        summary: 'Обновление роли или статуса пользователя',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateUserPayload' } } },
        },
        responses: {
          200: okJson('Пользователь обновлен', { $ref: '#/components/schemas/User' }),
          400: errorJson('Некорректный id, роль или попытка заблокировать себя'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
          404: errorJson('Пользователь не найден'),
        },
      },
      delete: {
        summary: 'Удаление пользователя',
        responses: {
          200: okJson('Пользователь удален', { type: 'object' }),
          400: errorJson('Некорректный id или попытка удалить себя'),
          401: errorJson('Нет токена или токен недействителен'),
          403: errorJson('Недостаточно прав'),
          404: errorJson('Пользователь не найден'),
        },
      },
    },
  },
};

module.exports = openapi;
