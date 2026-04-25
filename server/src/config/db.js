const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const DEFAULT_USERS = [
  {
    name: 'Администратор',
    email: 'admin@whiteboard.local',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    name: 'Алиса',
    email: 'alice@whiteboard.local',
    password: 'User123!',
    role: 'user',
  },
  {
    name: 'Боб',
    email: 'bob@whiteboard.local',
    password: 'User123!',
    role: 'user',
  },
];

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      CHECK (role IN ('admin', 'user'))
    );
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
  `);

  await pool.query(`
    UPDATE users
    SET name = COALESCE(NULLIF(TRIM(name), ''), SPLIT_PART(email, '@', 1), 'Пользователь')
    WHERE name IS NULL OR TRIM(name) = '';
  `);

  await pool.query(`
    UPDATE users
    SET role = 'user'
    WHERE role IS NULL OR role NOT IN ('admin', 'user');
  `);

  await pool.query(`
    UPDATE users
    SET created_at = NOW()
    WHERE created_at IS NULL;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'password'
      ) THEN
        EXECUTE 'UPDATE users
                 SET password = COALESCE(password, password_hash, '''')
                 WHERE password IS NULL';

        EXECUTE 'ALTER TABLE users
                 ALTER COLUMN password SET DEFAULT ''''';
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS boards (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE boards
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS owner_id INTEGER,
    ADD COLUMN IF NOT EXISTS snapshot JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
  `);

  await pool.query(`
    UPDATE boards
    SET description = ''
    WHERE description IS NULL;
  `);

  await pool.query(`
    UPDATE boards
    SET snapshot = '[]'::jsonb
    WHERE snapshot IS NULL;
  `);

  await pool.query(`
    UPDATE boards
    SET created_at = NOW()
    WHERE created_at IS NULL;
  `);

  await pool.query(`
    UPDATE boards
    SET updated_at = COALESCE(updated_at, created_at, NOW())
    WHERE updated_at IS NULL;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS board_members (
      board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (board_id, user_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS board_events (
      id SERIAL PRIMARY KEY,
      board_id INTEGER REFERENCES boards(id) ON DELETE SET NULL,
      actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action VARCHAR(32) NOT NULL,
      board_title VARCHAR(255) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await seedDefaults();

  await pool.query(`
    ALTER TABLE users
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN email SET NOT NULL,
    ALTER COLUMN password_hash SET NOT NULL,
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;
  `);

  await pool.query(`
    ALTER TABLE boards
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN owner_id SET NOT NULL,
    ALTER COLUMN snapshot SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;
  `);
}

async function seedDefaults() {
  const defaultPasswordHashes = new Map();

  for (const user of DEFAULT_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    defaultPasswordHashes.set(user.email, passwordHash);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
    if (existing.rowCount > 0) {
      await pool.query(
        `
          UPDATE users
          SET name = COALESCE(NULLIF(TRIM(name), ''), $2),
              password_hash = COALESCE(password_hash, $3),
              role = COALESCE(role, $4)
          WHERE email = $1
        `,
        [user.email, user.name, passwordHash, user.role]
      );
      continue;
    }

    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [user.name, user.email, passwordHash, user.role]
    );
  }

  const fallbackHash = await bcrypt.hash('ChangeMe123!', 10);

  const usersWithoutPassword = await pool.query(
    `SELECT id, email FROM users WHERE password_hash IS NULL OR TRIM(password_hash) = ''`
  );

  for (const user of usersWithoutPassword.rows) {
    const resolvedHash = defaultPasswordHashes.get(user.email) || fallbackHash;
    await pool.query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [user.id, resolvedHash]);
  }

  const boardCheck = await pool.query('SELECT id FROM boards LIMIT 1');
  if (boardCheck.rowCount > 0) {
    return;
  }

  const owner = await pool.query(
    `SELECT id FROM users WHERE email = 'alice@whiteboard.local' LIMIT 1`
  );
  const collaborator = await pool.query(
    `SELECT id FROM users WHERE email = 'bob@whiteboard.local' LIMIT 1`
  );

  if (owner.rowCount === 0 || collaborator.rowCount === 0) {
    return;
  }

  const createdBoard = await pool.query(
    `INSERT INTO boards (title, owner_id, snapshot)
     VALUES ($1, $2, $3::jsonb)
     RETURNING id`,
    [
      'Совместная доска команды',
      owner.rows[0].id,
      JSON.stringify([
        {
          color: '#0f172a',
          width: 4,
          points: [
            { x: 120, y: 90 },
            { x: 260, y: 160 },
            { x: 390, y: 120 },
          ],
        },
      ]),
    ]
  );

  await pool.query(
    `INSERT INTO board_members (board_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [createdBoard.rows[0].id, collaborator.rows[0].id]
  );
}

async function initDatabase() {
  await pool.query('SELECT 1');
  await ensureSchema();
}

module.exports = {
  pool,
  initDatabase,
};
