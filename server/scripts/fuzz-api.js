const API_URL = process.env.FUZZ_API_URL || 'http://localhost:5001/api';

function randomEmail(prefix = 'fuzz') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function request(path, { method = 'GET', token, body, headers = {} } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
  };
}

async function runCase(name, config, expectedStatuses = []) {
  try {
    const result = await request(config.path, config);
    const ok = expectedStatuses.length === 0 || expectedStatuses.includes(result.status);
    const marker = ok ? 'PASS' : 'WARN';

    console.log(
      `[${marker}] ${name} -> ${result.status} ${JSON.stringify(result.data)}`
    );

    return result;
  } catch (error) {
    console.log(`[ERROR] ${name} -> ${error.message}`);
    return null;
  }
}

async function login(email, password) {
  const result = await runCase(
    `login:${email}`,
    {
      path: '/auth/login',
      method: 'POST',
      body: { email, password },
    },
    [200]
  );

  return result?.data?.token || null;
}

async function main() {
  console.log(`\n=== FUZZ START ${new Date().toISOString()} ===`);
  console.log(`API: ${API_URL}\n`);

  const adminToken = await login('admin@whiteboard.local', 'Admin123!');
  const aliceToken = await login('alice@whiteboard.local', 'User123!');
  const bobToken = await login('bob@whiteboard.local', 'User123!');

  console.log('\n=== AUTH CASES ===');
  await runCase(
    'auth.register.empty-body',
    {
      path: '/auth/register',
      method: 'POST',
      body: {},
    },
    [400]
  );

  await runCase(
    'auth.register.short-name',
    {
      path: '/auth/register',
      method: 'POST',
      body: {
        name: 'A',
        email: randomEmail('short-name'),
        password: '123456',
      },
    },
    [400]
  );

  await runCase(
    'auth.register.invalid-email',
    {
      path: '/auth/register',
      method: 'POST',
      body: {
        name: 'Fuzz User',
        email: 'broken-email',
        password: '123456',
      },
    },
    [400]
  );

  await runCase(
    'auth.register.short-password',
    {
      path: '/auth/register',
      method: 'POST',
      body: {
        name: 'Fuzz User',
        email: randomEmail('short-pass'),
        password: '123',
      },
    },
    [400]
  );

  await runCase(
    'auth.register.long-name',
    {
      path: '/auth/register',
      method: 'POST',
      body: {
        name: 'X'.repeat(180),
        email: randomEmail('long-name'),
        password: '123456',
      },
    },
    [201, 400]
  );

  const duplicateEmail = randomEmail('duplicate');
  await runCase(
    'auth.register.duplicate.first',
    {
      path: '/auth/register',
      method: 'POST',
      body: {
        name: 'Duplicate User',
        email: duplicateEmail,
        password: '123456',
      },
    },
    [201]
  );

  await runCase(
    'auth.register.duplicate.second',
    {
      path: '/auth/register',
      method: 'POST',
      body: {
        name: 'Duplicate User',
        email: duplicateEmail,
        password: '123456',
      },
    },
    [409]
  );

  await runCase(
    'auth.login.empty-body',
    {
      path: '/auth/login',
      method: 'POST',
      body: {},
    },
    [400]
  );

  await runCase(
    'auth.login.wrong-password',
    {
      path: '/auth/login',
      method: 'POST',
      body: {
        email: 'alice@whiteboard.local',
        password: 'wrong-password',
      },
    },
    [401]
  );

  await runCase(
    'auth.me.without-token',
    {
      path: '/auth/me',
    },
    [401]
  );

  await runCase(
    'auth.me.invalid-token',
    {
      path: '/auth/me',
      headers: {
        Authorization: 'Bearer invalid-token',
      },
    },
    [401]
  );

  console.log('\n=== BOARD ACCESS CASES ===');
  await runCase(
    'boards.list.without-token',
    {
      path: '/boards',
    },
    [401]
  );

  await runCase(
    'boards.list.invalid-token',
    {
      path: '/boards',
      headers: {
        Authorization: 'Bearer bad.token.value',
      },
    },
    [401]
  );

  await runCase(
    'boards.create.empty-title',
    {
      path: '/boards',
      method: 'POST',
      token: aliceToken,
      body: {
        title: '',
      },
    },
    [400]
  );

  await runCase(
    'boards.create.short-title',
    {
      path: '/boards',
      method: 'POST',
      token: aliceToken,
      body: {
        title: 'ab',
      },
    },
    [400]
  );

  await runCase(
    'boards.create.long-title',
    {
      path: '/boards',
      method: 'POST',
      token: aliceToken,
      body: {
        title: 'T'.repeat(121),
      },
    },
    [400]
  );

  await runCase(
    'boards.create.bad-description-type',
    {
      path: '/boards',
      method: 'POST',
      token: aliceToken,
      body: {
        title: 'Невалидное описание',
        description: ['bad'],
      },
    },
    [400]
  );

  await runCase(
    'boards.create.long-description',
    {
      path: '/boards',
      method: 'POST',
      token: aliceToken,
      body: {
        title: 'Слишком длинное описание',
        description: 'D'.repeat(501),
      },
    },
    [400]
  );

  const createdBoard = await runCase(
    'boards.create.valid',
    {
      path: '/boards',
      method: 'POST',
      token: aliceToken,
      body: {
        title: `Fuzz board ${Date.now()}`,
        description: 'Доска для негативных и граничных проверок API',
      },
    },
    [201]
  );

  const fuzzBoardId = createdBoard?.data?.id;

  await runCase(
    'boards.get.nonexistent',
    {
      path: '/boards/999999',
      token: aliceToken,
    },
    [403, 404]
  );

  if (fuzzBoardId) {
    await runCase(
      'boards.get.forbidden-other-user',
      {
        path: `/boards/${fuzzBoardId}`,
        token: bobToken,
      },
      [403]
    );

    await runCase(
      'boards.update.empty-body',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'PUT',
        token: aliceToken,
        body: {},
      },
      [400]
    );

    await runCase(
      'boards.update.short-title',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'PUT',
        token: aliceToken,
        body: { title: 'xy' },
      },
      [400]
    );

    await runCase(
      'boards.update.long-title',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'PUT',
        token: aliceToken,
        body: { title: 'Z'.repeat(121) },
      },
      [400]
    );

    await runCase(
      'boards.update.long-description',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'PUT',
        token: aliceToken,
        body: { description: 'Q'.repeat(501) },
      },
      [400]
    );

    await runCase(
      'boards.update.bad-description-type',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'PUT',
        token: aliceToken,
        body: { description: { nested: true } },
      },
      [400]
    );

    await runCase(
      'boards.update.forbidden-other-user',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'PUT',
        token: bobToken,
        body: { title: 'Попытка чужого редактирования' },
      },
      [403]
    );

    await runCase(
      'boards.share.empty-body',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: aliceToken,
        body: {},
      },
      [400]
    );

    await runCase(
      'boards.share.bad-email-type',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: aliceToken,
        body: { email: ['bob@whiteboard.local'] },
      },
      [400]
    );

    await runCase(
      'boards.share.unknown-user',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: aliceToken,
        body: { email: randomEmail('missing-user') },
      },
      [404]
    );

    await runCase(
      'boards.share.owner-as-collaborator',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: aliceToken,
        body: { email: 'alice@whiteboard.local' },
      },
      [400]
    );

    await runCase(
      'boards.share.forbidden-other-user',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: bobToken,
        body: { email: 'admin@whiteboard.local' },
      },
      [403]
    );

    await runCase(
      'boards.share.valid',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: aliceToken,
        body: { email: 'bob@whiteboard.local' },
      },
      [200]
    );

    await runCase(
      'boards.share.duplicate-collaborator',
      {
        path: `/boards/${fuzzBoardId}/share`,
        method: 'POST',
        token: aliceToken,
        body: { email: 'bob@whiteboard.local' },
      },
      [200]
    );

    await runCase(
      'boards.remove-collaborator.invalid-user',
      {
        path: `/boards/${fuzzBoardId}/share/999999`,
        method: 'DELETE',
        token: aliceToken,
      },
      [404]
    );

    await runCase(
      'boards.remove-collaborator.forbidden-other-user',
      {
        path: `/boards/${fuzzBoardId}/share/1`,
        method: 'DELETE',
        token: bobToken,
      },
      [403]
    );

    await runCase(
      'boards.activity.authorized',
      {
        path: '/boards/activity',
        token: adminToken,
      },
      [200]
    );

    await runCase(
      'boards.delete.forbidden-other-user',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'DELETE',
        token: bobToken,
      },
      [403]
    );

    await runCase(
      'boards.delete.valid',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'DELETE',
        token: aliceToken,
      },
      [200]
    );

    await runCase(
      'boards.delete.already-deleted',
      {
        path: `/boards/${fuzzBoardId}`,
        method: 'DELETE',
        token: aliceToken,
      },
      [403, 404]
    );
  }

  console.log('\n=== SUMMARY ===');
  console.log('Проверены auth, boards, доступы, ограничения длины, типы данных, невалидные токены и сценарии с чужими правами.');
  console.log('Для отчёта можно приложить консольный вывод этого скрипта как базовый результат фаззинг-тестирования API.\n');
}

main();
