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
    schemas: {
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
          name: { type: 'string', example: 'Алексей' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          password: { type: 'string', minLength: 6, example: 'User123!' },
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
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { summary: 'Проверка состояния сервера', security: [], responses: { 200: { description: 'OK' } } } },
    '/auth/register': {
      post: {
        summary: 'Регистрация пользователя',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterPayload' } } },
        },
        responses: { 201: { description: 'Пользователь создан' }, 400: { description: 'Ошибка валидации' }, 409: { description: 'Email уже занят' } },
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
        responses: { 200: { description: 'JWT и профиль' }, 401: { description: 'Неверные учетные данные' } },
      },
    },
    '/auth/me': { get: { summary: 'Текущий пользователь', responses: { 200: { description: 'Профиль' } } } },
    '/boards': {
      get: { summary: 'Список доступных досок', responses: { 200: { description: 'Доски' } } },
      post: {
        summary: 'Создание доски',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BoardPayload' } } },
        },
        responses: { 201: { description: 'Доска создана' }, 400: { description: 'Ошибка валидации' } },
      },
    },
    '/boards/activity': {
      get: { summary: 'Журнал событий по доступным доскам', responses: { 200: { description: 'События досок' } } },
      delete: { summary: 'Очистка уведомлений администратором', responses: { 200: { description: 'Уведомления очищены' }, 403: { description: 'Недостаточно прав' } } },
    },
    '/boards/{id}': {
      get: { summary: 'Детали доски', responses: { 200: { description: 'Доска' } } },
      put: { summary: 'Обновление доски', responses: { 200: { description: 'Доска обновлена' } } },
      delete: { summary: 'Удаление доски', responses: { 200: { description: 'Доска удалена' } } },
    },
    '/boards/{id}/share': {
      post: {
        summary: 'Выдача доступа к доске',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SharePayload' } } },
        },
        responses: { 200: { description: 'Доступ обновлен' }, 403: { description: 'Недостаточно прав' }, 404: { description: 'Пользователь или доска не найдены' } },
      },
    },
    '/boards/{id}/share/{userId}': { delete: { summary: 'Отзыв доступа к доске', responses: { 200: { description: 'Доступ отозван' } } } },
    '/chat/{boardId}/messages': {
      get: { summary: 'Сообщения доски', responses: { 200: { description: 'Список сообщений' } } },
      post: {
        summary: 'Отправка сообщения',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/MessagePayload' } } },
        },
        responses: { 201: { description: 'Сообщение создано' }, 403: { description: 'Нет доступа к доске' } },
      },
    },
    '/settings': {
      get: { summary: 'Системные настройки', responses: { 200: { description: 'Настройки' } } },
      put: { summary: 'Обновление системных настроек администратором', responses: { 200: { description: 'Настройки обновлены' } } },
    },
    '/admin/users': { get: { summary: 'Список пользователей для администратора', responses: { 200: { description: 'Пользователи' } } } },
    '/admin/users/{id}': {
      patch: { summary: 'Обновление роли или статуса пользователя', responses: { 200: { description: 'Пользователь обновлен' } } },
      delete: { summary: 'Удаление пользователя', responses: { 200: { description: 'Пользователь удален' } } },
    },
  },
};

module.exports = openapi;
