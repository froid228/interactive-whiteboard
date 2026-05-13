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
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );

    return rows[0] || null;
  }

  static async findAllSafe() {
    const { rows } = await pool.query(
      `
        SELECT id, name, email, role, is_active, created_at
        FROM users
        ORDER BY created_at DESC, id DESC
      `
    );

    return rows;
  }

  static async update(id, { role, isActive }) {
    const { rows } = await pool.query(
      `
        UPDATE users
        SET role = COALESCE($1, role),
            is_active = COALESCE($2, is_active)
        WHERE id = $3
        RETURNING id, name, email, role, is_active, created_at
      `,
      [role ?? null, isActive ?? null, id]
    );

    return rows[0] || null;
  }

  static async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return rowCount > 0;
  }
}

module.exports = User;
