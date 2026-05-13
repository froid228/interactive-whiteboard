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
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': { get: { summary: 'Проверка состояния сервера', security: [], responses: { 200: { description: 'OK' } } } },
    '/auth/register': { post: { summary: 'Регистрация пользователя', security: [], responses: { 201: { description: 'Пользователь создан' } } } },
    '/auth/login': { post: { summary: 'Авторизация пользователя', security: [], responses: { 200: { description: 'JWT и профиль' } } } },
    '/auth/me': { get: { summary: 'Текущий пользователь', responses: { 200: { description: 'Профиль' } } } },
    '/boards': {
      get: { summary: 'Список доступных досок', responses: { 200: { description: 'Доски' } } },
      post: { summary: 'Создание доски', responses: { 201: { description: 'Доска создана' } } },
    },
    '/boards/{id}': {
      get: { summary: 'Детали доски', responses: { 200: { description: 'Доска' } } },
      put: { summary: 'Обновление доски', responses: { 200: { description: 'Доска обновлена' } } },
      delete: { summary: 'Удаление доски', responses: { 200: { description: 'Доска удалена' } } },
    },
    '/boards/{id}/share': { post: { summary: 'Выдача доступа к доске', responses: { 200: { description: 'Доступ обновлен' } } } },
    '/boards/{id}/share/{userId}': { delete: { summary: 'Отзыв доступа к доске', responses: { 200: { description: 'Доступ отозван' } } } },
    '/chat/{boardId}/messages': {
      get: { summary: 'Сообщения доски', responses: { 200: { description: 'Список сообщений' } } },
      post: { summary: 'Отправка сообщения', responses: { 201: { description: 'Сообщение создано' } } },
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
