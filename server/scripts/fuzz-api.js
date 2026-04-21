const API_URL = process.env.FUZZ_API_URL || 'http://localhost:5001/api';

async function runCase(name, init) {
  try {
    const response = await fetch(`${API_URL}${init.path}`, {
      method: init.method,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });

    const text = await response.text();
    console.log(`[${name}] ${response.status} ${text}`);
  } catch (error) {
    console.log(`[${name}] ERROR ${error.message}`);
  }
}

async function main() {
  await runCase('register-empty', {
    path: '/auth/register',
    method: 'POST',
    body: {},
  });

  await runCase('register-long-name', {
    path: '/auth/register',
    method: 'POST',
    body: {
      name: 'x'.repeat(200),
      email: 'fuzz@example.com',
      password: '123456',
    },
  });

  await runCase('login-wrong-password', {
    path: '/auth/login',
    method: 'POST',
    body: {
      email: 'alice@whiteboard.local',
      password: 'wrong-password',
    },
  });

  await runCase('boards-without-token', {
    path: '/boards',
    method: 'GET',
  });

  await runCase('share-invalid-body', {
    path: '/boards/1/share',
    method: 'POST',
    headers: {
      Authorization: 'Bearer invalid-token',
    },
    body: {
      email: ['bad-data'],
    },
  });
}

main();
