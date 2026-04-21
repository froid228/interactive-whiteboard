const { pool } = require('../config/db');

class User {
  static async create({ name, email, passwordHash, role = 'user' }) {
    const { rows } = await pool.query(
      `
        INSERT INTO users (name, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
      `,
      [name, email.toLowerCase(), passwordHash, role]
    );

    return rows[0];
  }

  static async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );

    return rows[0] || null;
  }

  static async findSafeById(id) {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );

    return rows[0] || null;
  }
}

module.exports = User;
