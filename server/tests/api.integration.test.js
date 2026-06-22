const http = require('http');
const test = require('node:test');
const assert = require('node:assert/strict');
const { app, getSwaggerHtml } = require('../src/app');
const openapi = require('../src/openapi');
const { initDatabase, pool } = require('../src/config/db');

let server;
let baseUrl;
let databaseAvailable = false;
let httpAvailable = false;
const createdUserEmails = [];
const createdBoardIds = [];

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = text;
  }

  return {
    status: response.status,
    data,
    text,
  };
}

async function login(email, password) {
  const response = await api('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  assert.equal(response.status, 200);
  assert.ok(response.data.token);
  return response.data.token;
}

test.before(async () => {
  server = http.createServer(app);
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
    httpAvailable = true;
  } catch (error) {
    console.warn(`Skipping HTTP integration tests: listen is unavailable (${error.message})`);
    server = null;
  }

  try {
    await initDatabase();
    databaseAvailable = true;
  } catch (error) {
    console.warn(`Skipping integration tests: database is unavailable (${error.message})`);
  }
});

test.after(async () => {
  if (databaseAvailable) {
    for (const boardId of createdBoardIds) {
      await pool.query('DELETE FROM boards WHERE id = $1', [boardId]);
    }

    for (const email of createdUserEmails) {
      await pool.query('DELETE FROM users WHERE email = $1', [email]);
    }
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await pool.end();
});

test('defines OpenAPI schema and Swagger UI page', async () => {
  assert.equal(openapi.openapi, '3.0.3');
  assert.ok(openapi.paths['/auth/login']);
  assert.ok(openapi.paths['/boards/activity']);

  const docs = getSwaggerHtml();
  assert.match(docs, /swagger-ui-bundle/i);
  assert.match(docs, /\/api\/schema/);
});

test('serves OpenAPI schema and Swagger UI page over HTTP when listen is available', async () => {
  if (!httpAvailable) {
    return;
  }

  const schema = await api('/api/schema');
  assert.equal(schema.status, 200);
  assert.equal(schema.data.openapi, '3.0.3');

  const docs = await api('/api/docs');
  assert.equal(docs.status, 200);
  assert.match(docs.text, /swagger-ui-bundle/i);
});

test('initializes database schema and seed users', async () => {
  if (!databaseAvailable) {
    return;
  }

  const { rows } = await pool.query(
    `SELECT email, role
     FROM users
     WHERE email = ANY($1::text[])
     ORDER BY email`,
    [['admin@whiteboard.local', 'alice@whiteboard.local', 'bob@whiteboard.local']]
  );

  assert.equal(rows.length, 3);
  assert.ok(rows.some((user) => user.email === 'admin@whiteboard.local' && user.role === 'admin'));
  assert.ok(rows.some((user) => user.email === 'alice@whiteboard.local' && user.role === 'user'));
});

test('registers a user, logs in and returns current profile', async () => {
  if (!databaseAvailable || !httpAvailable) {
    return;
  }

  const email = `api-user-${Date.now()}@example.com`;
  createdUserEmails.push(email);

  const registered = await api('/api/auth/register', {
    method: 'POST',
    body: {
      name: 'API Tester',
      email,
      password: 'User123!',
    },
  });

  assert.equal(registered.status, 201);
  assert.equal(registered.data.user.email, email);
  assert.ok(registered.data.token);

  const token = await login(email, 'User123!');
  const me = await api('/api/auth/me', { token });

  assert.equal(me.status, 200);
  assert.equal(me.data.email, email);
  assert.deepEqual(me.data.roles, ['user']);
});

test('protects boards and allows owner to share access', async () => {
  if (!databaseAvailable || !httpAvailable) {
    return;
  }

  const aliceToken = await login('alice@whiteboard.local', 'User123!');
  const bobToken = await login('bob@whiteboard.local', 'User123!');
  const title = `Интеграционная доска ${Date.now()}`;

  const created = await api('/api/boards', {
    method: 'POST',
    token: aliceToken,
    body: { title, description: 'Проверка доступа' },
  });

  assert.equal(created.status, 201);
  createdBoardIds.push(created.data.id);

  const forbidden = await api(`/api/boards/${created.data.id}`, { token: bobToken });
  assert.equal(forbidden.status, 403);

  const shared = await api(`/api/boards/${created.data.id}/share`, {
    method: 'POST',
    token: aliceToken,
    body: { email: 'bob@whiteboard.local' },
  });

  assert.equal(shared.status, 200);
  assert.ok(shared.data.collaborators.some((user) => user.email === 'bob@whiteboard.local'));

  const allowed = await api(`/api/boards/${created.data.id}`, { token: bobToken });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.data.id, created.data.id);
});

test('returns 400 for invalid REST resource identifiers', async () => {
  if (!databaseAvailable || !httpAvailable) {
    return;
  }

  const aliceToken = await login('alice@whiteboard.local', 'User123!');
  const adminToken = await login('admin@whiteboard.local', 'Admin123!');

  const invalidBoard = await api('/api/boards/not-a-number', { token: aliceToken });
  assert.equal(invalidBoard.status, 400);

  const invalidChat = await api('/api/chat/null/messages', { token: aliceToken });
  assert.equal(invalidChat.status, 400);

  const invalidAdminUser = await api('/api/admin/users/abc', {
    method: 'PATCH',
    token: adminToken,
    body: { role: 'user' },
  });
  assert.equal(invalidAdminUser.status, 400);
});

test('allows collaborator chat after board access is granted', async () => {
  if (!databaseAvailable || !httpAvailable) {
    return;
  }

  const aliceToken = await login('alice@whiteboard.local', 'User123!');
  const bobToken = await login('bob@whiteboard.local', 'User123!');
  const title = `Чат-доска ${Date.now()}`;

  const created = await api('/api/boards', {
    method: 'POST',
    token: aliceToken,
    body: { title },
  });
  assert.equal(created.status, 201);
  createdBoardIds.push(created.data.id);

  await api(`/api/boards/${created.data.id}/share`, {
    method: 'POST',
    token: aliceToken,
    body: { email: 'bob@whiteboard.local' },
  });

  const message = await api(`/api/chat/${created.data.id}/messages`, {
    method: 'POST',
    token: bobToken,
    body: { text: 'Сообщение из интеграционного теста' },
  });

  assert.equal(message.status, 201);
  assert.equal(message.data.text, 'Сообщение из интеграционного теста');

  const messages = await api(`/api/chat/${created.data.id}/messages`, { token: aliceToken });
  assert.equal(messages.status, 200);
  assert.ok(messages.data.some((item) => item.text === 'Сообщение из интеграционного теста'));
});

test('enforces admin-only routes and settings update', async () => {
  if (!databaseAvailable || !httpAvailable) {
    return;
  }

  const adminToken = await login('admin@whiteboard.local', 'Admin123!');
  const aliceToken = await login('alice@whiteboard.local', 'User123!');

  const rejectedAdminList = await api('/api/admin/users', { token: aliceToken });
  assert.equal(rejectedAdminList.status, 403);

  const users = await api('/api/admin/users', { token: adminToken });
  assert.equal(users.status, 200);
  assert.ok(Array.isArray(users.data));

  const rejectedSettings = await api('/api/settings', {
    method: 'PUT',
    token: aliceToken,
    body: { autosaveIntervalSec: 10 },
  });
  assert.equal(rejectedSettings.status, 403);

  const updatedSettings = await api('/api/settings', {
    method: 'PUT',
    token: adminToken,
    body: { autosaveIntervalSec: 10 },
  });
  assert.equal(updatedSettings.status, 200);
  assert.equal(updatedSettings.data.autosaveIntervalSec, 10);
});
