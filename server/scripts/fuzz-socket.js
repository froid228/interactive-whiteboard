const { io } = require('socket.io-client');

const BASE_URL = process.env.FUZZ_SOCKET_URL || 'http://localhost:5001';
const API_URL = process.env.FUZZ_API_URL || `${BASE_URL}/api`;
const RANDOM_SOCKET_CASES = Number(process.env.RANDOM_SOCKET_CASES || 80);
const ACK_TIMEOUT_MS = Number(process.env.SOCKET_ACK_TIMEOUT_MS || 1200);

const stats = {
  pass: 0,
  warn: 0,
  error: 0,
};

function mark(type, name, details) {
  stats[type] += 1;
  console.log(`[${type.toUpperCase()}] ${name} -> ${details}`);
}

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
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
  };
}

async function login(email, password) {
  const result = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
  });

  if (result.status !== 200 || !result.data?.token) {
    throw new Error(`Не удалось войти как ${email}: HTTP ${result.status}`);
  }

  return result.data.token;
}

async function createBoard(token) {
  const result = await request('/boards', {
    method: 'POST',
    token,
    body: {
      title: `Socket fuzz board ${Date.now()}`,
      description: 'Temporary board for Socket.IO fuzzing',
    },
  });

  if (result.status !== 201 || !result.data?.id) {
    throw new Error(`Не удалось создать доску для Socket.IO fuzzing: HTTP ${result.status}`);
  }

  return result.data.id;
}

async function deleteBoard(token, boardId) {
  if (!boardId) {
    return;
  }

  try {
    await request(`/boards/${boardId}`, {
      method: 'DELETE',
      token,
    });
  } catch (error) {
    mark('warn', 'cleanup.delete-board', error.message);
  }
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = io(BASE_URL, {
      auth: token === undefined ? undefined : { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: ACK_TIMEOUT_MS,
    });

    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (error) => {
      socket.close();
      reject(error);
    });
  });
}

async function expectConnectionRejected(name, token) {
  try {
    const socket = await connectSocket(token);
    socket.close();
    mark('warn', name, 'connection unexpectedly accepted');
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') {
      mark('pass', name, 'UNAUTHORIZED');
      return;
    }

    mark('warn', name, error.message);
  }
}

function emitWithAck(socket, event, payload) {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({ timeout: true });
      }
    }, ACK_TIMEOUT_MS);

    socket.emit(event, payload, (ack) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ ack });
      }
    });
  });
}

async function runSocketCase(socket, name, event, payload, validate = (result) => result.ack?.ok === false) {
  try {
    const result = await emitWithAck(socket, event, payload);
    const ok = validate(result);

    if (ok) {
      mark('pass', name, JSON.stringify(result.ack || result));
      return result;
    }

    mark('warn', name, JSON.stringify(result.ack || result));
    return result;
  } catch (error) {
    mark('error', name, error.message);
    return null;
  }
}

function randomPrimitive() {
  const values = [
    undefined,
    null,
    true,
    false,
    0,
    -1,
    1.5,
    '',
    ' ',
    'abc',
    'x'.repeat(2048),
    '<script>alert(1)</script>',
    "' OR '1'='1",
    [],
    ['array'],
    {},
    { nested: true },
  ];

  return values[Math.floor(Math.random() * values.length)];
}

function randomBadPayload() {
  return {
    boardId: randomPrimitive(),
    segment: randomPrimitive(),
    snapshot: randomPrimitive(),
    text: randomPrimitive(),
    extra: randomPrimitive(),
  };
}

function validLineSegment() {
  return {
    type: 'line',
    color: '#123abc',
    width: 4,
    points: [
      { x: 10, y: 20 },
      { x: 50, y: 70 },
    ],
  };
}

async function runRandomSocketFuzzing(socket) {
  console.log(`\n=== RANDOMIZED SOCKET.IO PAYLOAD FUZZING (${RANDOM_SOCKET_CASES} cases) ===`);

  const events = ['join-board', 'draw-segment', 'board-snapshot', 'clear-board', 'send-message'];

  for (let index = 0; index < RANDOM_SOCKET_CASES; index += 1) {
    const event = events[Math.floor(Math.random() * events.length)];
    await runSocketCase(
      socket,
      `random.${event}.${index + 1}`,
      event,
      randomBadPayload(),
      (result) => result.ack?.ok === false || result.timeout === true
    );
  }
}

async function main() {
  console.log(`\n=== SOCKET.IO FUZZ START ${new Date().toISOString()} ===`);
  console.log(`Socket server: ${BASE_URL}`);
  console.log(`REST API: ${API_URL}\n`);

  let aliceToken;
  let bobToken;
  let boardId;
  let aliceSocket;
  let bobSocket;

  try {
    aliceToken = await login('alice@whiteboard.local', 'User123!');
    bobToken = await login('bob@whiteboard.local', 'User123!');
    boardId = await createBoard(aliceToken);

    await expectConnectionRejected('connect.no-token', undefined);
    await expectConnectionRejected('connect.bad-token', 'not-a-valid-jwt');

    aliceSocket = await connectSocket(aliceToken);
    bobSocket = await connectSocket(bobToken);
    mark('pass', 'connect.valid-token', `connected as ${aliceSocket.id}`);

    await runSocketCase(aliceSocket, 'join-board.valid-owner', 'join-board', { boardId }, (result) => {
      return result.ack?.ok === true && Array.isArray(result.ack.snapshot);
    });

    await runSocketCase(bobSocket, 'join-board.forbidden-user', 'join-board', { boardId });
    await runSocketCase(aliceSocket, 'join-board.invalid-id-string', 'join-board', { boardId: 'abc' });
    await runSocketCase(aliceSocket, 'join-board.invalid-id-object', 'join-board', { boardId: { id: boardId } });

    await runSocketCase(aliceSocket, 'draw-segment.invalid-board-id', 'draw-segment', {
      boardId: 'null',
      segment: validLineSegment(),
    });
    await runSocketCase(aliceSocket, 'draw-segment.invalid-segment-null', 'draw-segment', {
      boardId,
      segment: null,
    });
    await runSocketCase(aliceSocket, 'draw-segment.invalid-color', 'draw-segment', {
      boardId,
      segment: { ...validLineSegment(), color: 'red' },
    });
    await runSocketCase(aliceSocket, 'draw-segment.too-many-points', 'draw-segment', {
      boardId,
      segment: {
        ...validLineSegment(),
        points: new Array(501).fill({ x: 1, y: 1 }),
      },
    });

    await runSocketCase(aliceSocket, 'board-snapshot.invalid-type', 'board-snapshot', {
      boardId,
      snapshot: { bad: true },
    });
    await runSocketCase(aliceSocket, 'board-snapshot.too-large', 'board-snapshot', {
      boardId,
      snapshot: new Array(2001).fill(validLineSegment()),
    });

    await runSocketCase(aliceSocket, 'clear-board.invalid-id', 'clear-board', {
      boardId: -1,
    });

    await runSocketCase(aliceSocket, 'send-message.empty', 'send-message', {
      boardId,
      text: '',
    });
    await runSocketCase(aliceSocket, 'send-message.too-long', 'send-message', {
      boardId,
      text: 'x'.repeat(1001),
    });
    await runSocketCase(bobSocket, 'send-message.forbidden-user', 'send-message', {
      boardId,
      text: 'Попытка сообщения без доступа',
    });

    await runRandomSocketFuzzing(aliceSocket);
  } catch (error) {
    mark('error', 'socket-fuzz.setup', error.message);
  } finally {
    aliceSocket?.close();
    bobSocket?.close();
    await deleteBoard(aliceToken, boardId);
  }

  console.log('\n=== SOCKET.IO FUZZ SUMMARY ===');
  console.log(`PASS: ${stats.pass}; WARN: ${stats.warn}; ERROR: ${stats.error}`);
  console.log('Проверены handshake-авторизация, события join-board, draw-segment, board-snapshot, clear-board, send-message и randomized Socket.IO payload fuzzing.\n');

  if (stats.error > 0) {
    process.exitCode = 1;
  }
}

main();
