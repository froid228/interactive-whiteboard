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
    CREATE TABLE IF NOT EXISTS boards (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS board_members (
      board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (board_id, user_id)
    );
  `);

  await seedDefaults();
}

async function seedDefaults() {
  for (const user of DEFAULT_USERS) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
    if (existing.rowCount > 0) {
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [user.name, user.email, passwordHash, user.role]
    );
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
